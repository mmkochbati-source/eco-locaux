import type { PostgrestError } from '@supabase/supabase-js';
import type { Note, PreparationRdv, Prospect, RendezVous, RendezVousAvecProspect } from '../types';
import { N8nError, n8n } from './n8n';
import type { Repository } from './repository';
import { getSupabase } from './supabaseClient';

// Implémentation Supabase : colonnes identiques à types.ts (snake_case).
// Les droits sont garantis en base (RLS : chaque commercial ne voit que ses données).
// Les chiffres métier (score, économies…) sont calculés par les triggers en base, jamais ici.

const db = () => getSupabase();

function check<T>(res: { data: T | null; error: PostgrestError | null }, what: string): T {
  if (res.error) throw new Error(`${what} : ${res.error.message}`);
  if (res.data === null) throw new Error(`${what} : introuvable`);
  return res.data;
}

async function currentUserId(): Promise<string> {
  const { data } = await db().auth.getUser();
  if (!data.user) throw new Error('Session expirée : reconnectez-vous.');
  return data.user.id;
}

function initiales(nom: string): string {
  return (
    nom
      .split(/[\s._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((m) => m[0]!.toUpperCase())
      .join('') || '?'
  );
}

// Droits en base : le front ne peut pas écrire preparations_rdv.statut ni erreur_detail (réservés à n8n).
// Si le webhook ne peut pas être appelé, la ligne resterait « en_cours » : on retient l'échec pour la session
// afin d'afficher l'erreur et le bouton « Régénérer » au lieu d'un chargement sans fin.
const failedPreparations = new Map<string, string>();

function markPreparationError(rdvId: string, err: unknown) {
  failedPreparations.set(rdvId, err instanceof Error ? err.message : String(err));
}

function withLocalFailure(prep: PreparationRdv): PreparationRdv {
  const detail = failedPreparations.get(prep.rdv_id);
  if (detail && prep.statut === 'en_cours') return { ...prep, statut: 'erreur', erreur_detail: detail };
  if (prep.statut !== 'en_cours') failedPreparations.delete(prep.rdv_id);
  return prep;
}

const PREP_COLUMNS =
  'id, rdv_id, statut, trajet, checklist, points_cles, objections, genere_le, modifie_par_commercial, erreur_detail';

export const supabaseRepository: Repository = {
  async getProfil() {
    const id = await currentUserId();
    const profil = check(
      await db()
        .from('profils')
        .select('nom, secteur_id, secteur:secteurs(nom, centre_lat, centre_lng, rayon_km)')
        .eq('id', id)
        .single(),
      'Profil',
    ) as unknown as {
      nom: string;
      secteur_id: string | null;
      secteur: { nom: string; centre_lat: number; centre_lng: number; rayon_km: number } | null;
    };
    if (!profil.secteur) throw new Error("Votre compte n'est rattaché à aucun secteur. Contactez un administrateur.");
    return {
      nom: profil.nom,
      initiales: initiales(profil.nom),
      secteur_id: profil.secteur_id,
      secteur_nom: profil.secteur.nom,
      centre: { lat: profil.secteur.centre_lat, lng: profil.secteur.centre_lng },
      rayon_km: Number(profil.secteur.rayon_km),
    };
  },

  async listProspects(filters = {}) {
    let query = db().from('prospects').select('*').order('score_potentiel', { ascending: false });
    if (filters.categorie) query = query.eq('categorie', filters.categorie);
    if (filters.statut) query = query.eq('statut', filters.statut);
    if (filters.priorite) query = query.eq('priorite', filters.priorite);
    const q = filters.q?.trim().replace(/[%,()]/g, ' ');
    if (q) query = query.or(`nom.ilike.%${q}%,adresse.ilike.%${q}%`);
    return check(await query, 'Prospects') as Prospect[];
  },

  async getProspect(id) {
    return check(await db().from('prospects').select('*').eq('id', id).single(), 'Prospect') as Prospect;
  },

  async createProspect(input) {
    return check(await db().from('prospects').insert(input).select('*').single(), 'Création du prospect') as Prospect;
  },

  async updateProspect(id, patch) {
    const { id: _ignored, ...rest } = patch;
    void _ignored;
    return check(await db().from('prospects').update(rest).eq('id', id).select('*').single(), 'Mise à jour du prospect') as Prospect;
  },

  async listHistorique(prospectId) {
    return check(
      await db().from('historique').select('id, prospect_id, type, resume, date').eq('prospect_id', prospectId).order('date', { ascending: false }),
      'Historique',
    );
  },

  async addHistorique(prospectId, input) {
    return check(
      await db().from('historique').insert({ prospect_id: prospectId, ...input }).select('id, prospect_id, type, resume, date').single(),
      "Ajout à l'historique",
    );
  },

  async getNote(prospectId) {
    const res = await db()
      .from('notes')
      .select('*')
      .eq('prospect_id', prospectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (res.error) throw new Error(`Note : ${res.error.message}`);
    return res.data as Note | null;
  },

  async saveNote(prospectId, texte) {
    // Une note par prospect : on met à jour la plus récente, sinon on la crée.
    // Droits en base : le front n'écrit que prospect_id et texte ; statut_analyse est géré par n8n.
    const existing = await supabaseRepository.getNote(prospectId);
    const res = existing
      ? await db().from('notes').update({ texte }).eq('id', existing.id).select('*').single()
      : await db().from('notes').insert({ prospect_id: prospectId, texte }).select('*').single();
    const note = check(res, 'Enregistrement de la note') as Note;
    // En cas d'échec, la note reste enregistrée et N8nError porte le message à afficher.
    await n8n.analyserNote(note.id);
    // Affichage immédiat en attendant que Realtime confirme le passage à en_cours puis terminee.
    return { ...note, statut_analyse: 'en_cours' };
  },

  async listRendezVous() {
    return check(
      await db().from('rendez_vous').select('id, prospect_id, date_heure, duree_min, statut, prospect:prospects(id, nom, categorie)').order('date_heure'),
      'Rendez-vous',
    ) as unknown as RendezVousAvecProspect[];
  },

  async createRendezVous(prospectId, date_heure) {
    // Le trigger en base crée la préparation (en_cours), l'entrée d'historique et met à jour le statut.
    const rdv = check(
      await db().from('rendez_vous').insert({ prospect_id: prospectId, date_heure }).select('id, prospect_id, date_heure, duree_min, statut').single(),
      'Planification du rendez-vous',
    ) as RendezVous;
    try {
      await n8n.preparerRdv(rdv.id);
    } catch (err) {
      // Le RDV existe : l'écran Préparation affichera l'erreur et le bouton « Régénérer ».
      markPreparationError(rdv.id, err);
    }
    return rdv;
  },

  async getRendezVous(id) {
    return check(
      await db().from('rendez_vous').select('id, prospect_id, date_heure, duree_min, statut, prospect:prospects(*)').eq('id', id).single(),
      'Rendez-vous',
    ) as unknown as RendezVous & { prospect: Prospect };
  },

  async getPreparation(rdvId) {
    return withLocalFailure(
      check(await db().from('preparations_rdv').select(PREP_COLUMNS).eq('rdv_id', rdvId).single(), 'Préparation') as PreparationRdv,
    );
  },

  subscribePreparation(rdvId, cb) {
    const channel = db()
      .channel(`preparation-${rdvId}-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'preparations_rdv', filter: `rdv_id=eq.${rdvId}` },
        (payload) => {
          if (payload.new && 'rdv_id' in payload.new) cb(withLocalFailure(payload.new as PreparationRdv));
        },
      )
      .subscribe();
    return () => {
      void db().removeChannel(channel);
    };
  },

  async regeneratePreparation(rdvId) {
    // n8n repasse la préparation à en_cours puis pret / erreur ; le front se contente de déclencher.
    failedPreparations.delete(rdvId);
    try {
      await n8n.preparerRdv(rdvId);
    } catch (err) {
      markPreparationError(rdvId, err);
      throw err;
    }
  },

  async updatePreparation(rdvId, patch) {
    const update: Record<string, unknown> = { ...patch };
    if (patch.points_cles || patch.objections) update.modifie_par_commercial = true;
    check(await db().from('preparations_rdv').update(update).eq('rdv_id', rdvId).select('id').single(), 'Mise à jour de la préparation');
  },

  // Pas de workflow d'export PDF côté n8n pour l'instant : l'écran ouvre l'impression du navigateur.
  async exportPreparationPdf() {
    return { pdf_url: null };
  },

  async importProspects(categories) {
    const profil = await supabaseRepository.getProfil();
    if (!profil.secteur_id) throw new N8nError("Votre compte n'est rattaché à aucun secteur.", null);
    await n8n.importerProspects(profil.secteur_id, categories);
  },

  subscribeProspects(cb) {
    // Un import écrit des dizaines de lignes d'un coup : on regroupe la rafale en un seul rafraîchissement.
    let timer: number | undefined;
    const debounced = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(cb, 600);
    };
    const channel = db()
      .channel(`prospects-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prospects' }, debounced)
      .subscribe();
    return () => {
      window.clearTimeout(timer);
      void db().removeChannel(channel);
    };
  },

  subscribeNote(prospectId, cb) {
    const channel = db()
      .channel(`notes-${prospectId}-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notes', filter: `prospect_id=eq.${prospectId}` },
        (payload) => {
          if (payload.new && 'id' in payload.new) cb(payload.new as Note);
        },
      )
      .subscribe();
    return () => {
      void db().removeChannel(channel);
    };
  },
};
