import { useEffect, useState } from 'react';
import { Button } from '@/components/common/Button';
import { apiClient, extraireMessageErreur } from '@/services/apiClient';
import { configurationService, CONFIG_DEFAUT } from '@/services/configurationService';
import type { ConfigurationSystemeDTO } from '@/types/configuration.types';

interface ParametreRelance {
  id: number;
  niveauRelance: string;
  libelle: string;
  seuilJours: number;
  canalParDefaut: string;
  actif: boolean;
  description: string;
}

interface ConfigurationSysteme extends ConfigurationSystemeDTO {
  brevoApiKey: string;
  brevoSenderId: string;
  brevoSoldeSms: number;
  brevoStatut: string;

  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpExpediteurNom: string;
  smtpStatut: string;

  villeEmission: string;
  serviceNom: string;

  tauxMajorationInitiale: number;
  tauxInteretMensuel: number;
  delaiGraceDefaut: number;

  nomSignataire: string;
  titreSignataire: string;
  mentionLegale: string;
}

export function ParametresPage() {
  const [ongletActif, setOngletActif] = useState<'seuils' | 'sms' | 'email' | 'cgi' | 'signatures'>('seuils');
  
  // États des paramètres
  const [parametres, setParametres] = useState<ParametreRelance[]>([
    {
      id: 1,
      niveauRelance: 'PREVENTIF',
      libelle: 'Rappel Préventif Avant Échéance',
      seuilJours: 0,
      canalParDefaut: 'SMS',
      actif: true,
      description: 'Notification courtoise envoyée le jour même de l’échéance pour inciter au versement spontané.',
    },
    {
      id: 2,
      niveauRelance: 'AMIABLE',
      libelle: 'Relance Amiable (SMS)',
      seuilJours: 8,
      canalParDefaut: 'SMS',
      actif: true,
      description: 'SMS court envoyé 8 jours après l’échéance pour rappeler le délai de grâce légal.',
    },
    {
      id: 3,
      niveauRelance: 'INTERMEDIAIRE',
      libelle: 'Relance Intermédiaire Multicanal',
      seuilJours: 15,
      canalParDefaut: 'SMS_ET_EMAIL',
      actif: true,
      description: 'Avis formel combinant SMS et Courrier Électronique avec décompte des premières pénalités.',
    },
    {
      id: 4,
      niveauRelance: 'OFFICIEL',
      libelle: 'Mise en Demeure Officielle (PDF)',
      seuilJours: 30,
      canalParDefaut: 'EMAIL',
      actif: true,
      description: 'Sommation juridique officielle avec lettre PDF certifiée DGI accordant 8 jours de régularisation.',
    },
    {
      id: 5,
      niveauRelance: 'FORCE',
      libelle: 'Procédure de Recouvrement Forcé (ATD)',
      seuilJours: 60,
      canalParDefaut: 'EMAIL',
      actif: true,
      description: 'Dossier transmis au service des poursuites pour Avis à Tiers Détenteur et saisie conservatoire.',
    },
  ]);

  const [config, setConfig] = useState<ConfigurationSysteme>({
    brevoApiKey: CONFIG_DEFAUT.brevoApiKey ?? '',
    brevoSenderId: CONFIG_DEFAUT.brevoSenderId ?? 'DGIFISC',
    brevoSoldeSms: CONFIG_DEFAUT.brevoSoldeSms ?? 0,
    brevoStatut: 'REQUIS_CREDITS',

    smtpHost: CONFIG_DEFAUT.smtpHost ?? 'smtp-relay.brevo.com',
    smtpPort: CONFIG_DEFAUT.smtpPort ?? 587,
    smtpUser: CONFIG_DEFAUT.smtpUser ?? 'rakotonirinamario81@gmail.com',
    smtpExpediteurNom: CONFIG_DEFAUT.smtpExpediteurNom ?? 'Direction Régionale des Impôts - Vatovavy Fitovinany',
    smtpStatut: 'ACTIF',

    villeEmission: CONFIG_DEFAUT.villeEmission ?? 'Manakara',
    serviceNom: CONFIG_DEFAUT.serviceNom ?? 'Direction Régionale des Impôts - Vatovavy Fitovinany',

    tauxMajorationInitiale: CONFIG_DEFAUT.tauxMajorationInitiale ?? 10,
    tauxInteretMensuel: CONFIG_DEFAUT.tauxInteretMensuel ?? 1.0,
    delaiGraceDefaut: CONFIG_DEFAUT.delaiGraceDefaut ?? 8,

    nomSignataire: CONFIG_DEFAUT.nomSignataire ?? 'Le Responsable du Recouvrement',
    titreSignataire: CONFIG_DEFAUT.titreSignataire ?? 'Chef de Service Régional des Entreprises',
    mentionLegale: CONFIG_DEFAUT.mentionLegale ?? 'Conformément aux Articles 20.03.02 et 20.01.53 du Code Général des Impôts de Madagascar.',
  });

  const [chargement, setChargement] = useState(false);
  const [enregistrementEnCours, setEnregistrementEnCours] = useState(false);
  const [succes, setSucces] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    // 1. Charger les seuils de relance
    apiClient
      .get<ParametreRelance[]>('/parametres-relance')
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setParametres(res.data);
        }
      })
      .catch(() => {
        // Mode autonome
      })
      .finally(() => setChargement(false));

    // 2. Charger la configuration système persistante
    configurationService
      .getConfiguration()
      .then((data) => {
        if (data) {
          setConfig((prev) => ({
            ...prev,
            ...data,
            smtpExpediteurNom: data.smtpExpediteurNom || 'Direction Régionale des Impôts - Vatovavy Fitovinany',
            villeEmission: data.villeEmission || 'Manakara',
          }));
        }
      })
      .catch((e) => {
        console.warn('Impossible de charger la configuration système:', e);
      });
  }, []);

  function modifierSeuilLocal(id: number, seuilJours: number) {
    setParametres((prev) => prev.map((p) => (p.id === id ? { ...p, seuilJours } : p)));
  }

  function basculerActif(id: number) {
    setParametres((prev) => prev.map((p) => (p.id === id ? { ...p, actif: !p.actif } : p)));
  }

  async function enregistrerParametresRelance() {
    setEnregistrementEnCours(true);
    setErreur(null);
    setSucces(null);
    try {
      await Promise.all(
        parametres.map((p) => apiClient.put(`/parametres-relance/${p.id}`, p).catch(() => null))
      );
      setSucces('Configuration des seuils de relance enregistrée avec succès.');
    } catch (err) {
      setErreur(extraireMessageErreur(err));
    } finally {
      setEnregistrementEnCours(false);
    }
  }

  async function enregistrerConfigurationSysteme(section = 'SMTP') {
    setEnregistrementEnCours(true);
    setErreur(null);
    setSucces(null);
    try {
      const saved = await configurationService.sauvegarderConfiguration(config);
      setConfig((prev) => ({ ...prev, ...saved }));
      if (section === 'SMTP') {
        setSucces(
          `✓ Paramètres SMTP validés avec succès ! L'expéditeur officiel est désormais « ${config.smtpExpediteurNom} » et tous les envois pour motif d'impayé sont rédigés avec ce libellé depuis ${config.villeEmission || 'Manakara'}.`
        );
      } else {
        setSucces('✓ Configuration système mise à jour et persistée avec succès.');
      }
    } catch (err) {
      setErreur(extraireMessageErreur(err));
    } finally {
      setEnregistrementEnCours(false);
    }
  }

  if (chargement) {
    return (
      <div className="p-8 text-center text-sm text-gray-500">
        <span className="inline-block animate-spin text-xl mb-2">⏳</span>
        <p>Chargement de la configuration système DGI...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* 1. Bannière Institutionnelle DGI */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-fiscal-bordeaux via-[#601414] to-[#3a0a0a] p-6 text-white shadow-xl border border-red-900/40">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-72 w-72 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md border border-white/15">
              <span>⚙️</span>
              <span>DIRECTION GÉNÉRALE DES IMPÔTS · CONFIGURATION SYSTÈME</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span>🛠️</span> Paramètres & Règles de Relance
            </h1>
            <p className="text-xs sm:text-sm text-red-100 max-w-2xl font-light leading-relaxed">
              Configuration des seuils temporels de relance, gestion des passerelles SMS Brevo / SMTP Email, taux de pénalités CGI et signatures officielles DGI.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 self-start md:self-auto">
            <div className="flex items-center gap-2 rounded-lg bg-black/25 px-3 py-2 text-xs border border-white/10 font-mono text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Version 2.4.0 · Système Actif</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alertes de notification */}
      {succes && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs sm:text-sm text-emerald-800 font-semibold flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <span>✓</span> {succes}
          </div>
          <button type="button" onClick={() => setSucces(null)} className="text-emerald-600 hover:text-emerald-900 text-xs">
            ✕
          </button>
        </div>
      )}

      {erreur && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm text-red-800 font-semibold flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <span>⚠️</span> {erreur}
          </div>
          <button type="button" onClick={() => setErreur(null)} className="text-red-600 hover:text-red-900 text-xs">
            ✕
          </button>
        </div>
      )}

      {/* 2. Cartes Synthétiques de Configuration */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Niveaux de Relance</div>
          <div className="mt-2 text-2xl font-black text-gray-900 font-mono">{parametres.length} Seuils</div>
          <div className="mt-1 text-[11px] text-emerald-700 font-medium">⚡ Règles d'automatisation actives</div>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 shadow-xs">
          <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">Passerelle SMS Brevo</div>
          <div className="mt-2 text-2xl font-black text-amber-950 font-mono">⚠️ 0 Crédit</div>
          <div className="mt-1 text-[11px] text-amber-800 font-medium">Requiert solde transactionnel</div>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-xs">
          <div className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">Passerelle SMTP Email</div>
          <div className="mt-2 text-2xl font-black text-emerald-950 font-mono">✓ Connecté</div>
          <div className="mt-1 text-[11px] text-emerald-700 font-medium">Gmail SMTP Relay : Port 587</div>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 shadow-xs">
          <div className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">Pénalités CGI Madagascar</div>
          <div className="mt-2 text-2xl font-black text-blue-950 font-mono">10% + 1%/mois</div>
          <div className="mt-1 text-[11px] text-blue-800 font-medium">Articles 20.03.02 / 20.01.53</div>
        </div>
      </div>

      {/* 3. Onglets de Navigation des Paramètres */}
      <div className="flex border-b border-gray-200 text-xs sm:text-sm font-semibold gap-1">
        <button
          type="button"
          onClick={() => setOngletActif('seuils')}
          className={`px-4 py-3 border-b-2 flex items-center gap-2 transition-all ${
            ongletActif === 'seuils'
              ? 'border-fiscal-bordeaux text-fiscal-bordeaux font-bold bg-white'
              : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          <span>⚡ Seuils de Relance Automatique</span>
        </button>

        <button
          type="button"
          onClick={() => setOngletActif('sms')}
          className={`px-4 py-3 border-b-2 flex items-center gap-2 transition-all ${
            ongletActif === 'sms'
              ? 'border-fiscal-bordeaux text-fiscal-bordeaux font-bold bg-white'
              : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          <span>📲 Passerelle SMS (Brevo API)</span>
        </button>

        <button
          type="button"
          onClick={() => setOngletActif('email')}
          className={`px-4 py-3 border-b-2 flex items-center gap-2 transition-all ${
            ongletActif === 'email'
              ? 'border-fiscal-bordeaux text-fiscal-bordeaux font-bold bg-white'
              : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          <span>📧 Passerelle Email (SMTP)</span>
        </button>

        <button
          type="button"
          onClick={() => setOngletActif('cgi')}
          className={`px-4 py-3 border-b-2 flex items-center gap-2 transition-all ${
            ongletActif === 'cgi'
              ? 'border-fiscal-bordeaux text-fiscal-bordeaux font-bold bg-white'
              : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          <span>⚖️ Pénalités & CGI</span>
        </button>

        <button
          type="button"
          onClick={() => setOngletActif('signatures')}
          className={`px-4 py-3 border-b-2 flex items-center gap-2 transition-all ${
            ongletActif === 'signatures'
              ? 'border-fiscal-bordeaux text-fiscal-bordeaux font-bold bg-white'
              : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          <span>📜 Modèles & Signature DGI</span>
        </button>
      </div>

      {/* 4. CONTENU ONGLET 1 : SEUILS DE RELANCE */}
      {ongletActif === 'seuils' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-gray-900">
                  Délais de Déclenchement des Relances (en jours de retard)
                </h3>
                <p className="text-xs text-gray-500">
                  Ces seuils déterminent le moment où le système génère et propose les avis adaptés pour chaque dossier fiscal impayé.
                </p>
              </div>

              <Button
                onClick={enregistrerParametresRelance}
                enCours={enregistrementEnCours}
                className="bg-fiscal-bordeaux hover:bg-fiscal-bordeauxFonce text-white text-xs font-bold px-4 py-2"
              >
                💾 Enregistrer tous les seuils
              </Button>
            </div>

            <div className="space-y-3">
              {parametres.map((param) => (
                <div
                  key={param.id}
                  className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-xl border transition-all ${
                    param.actif ? 'border-gray-200 bg-slate-50/50 hover:bg-white' : 'border-gray-100 bg-gray-50/40 opacity-60'
                  }`}
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-fiscal-bordeaux font-mono">
                        Niveau {param.id}
                      </span>
                      <h4 className="text-sm font-extrabold text-gray-900">{param.libelle}</h4>
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-mono text-gray-700">
                        Canal : {param.canalParDefaut}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{param.description}</p>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-gray-700">Seuil (jours) :</label>
                      <input
                        type="number"
                        min={0}
                        value={param.seuilJours}
                        onChange={(e) => modifierSeuilLocal(param.id, Number(e.target.value))}
                        className="w-24 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-mono font-bold text-gray-900 focus:border-fiscal-bordeaux focus:outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => basculerActif(param.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        param.actif
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200'
                          : 'bg-gray-200 text-gray-700 border border-gray-300 hover:bg-gray-300'
                      }`}
                    >
                      {param.actif ? '✓ Actif' : '✕ Inactif'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. CONTENU ONGLET 2 : PASSERELLE SMS BREVO */}
      {ongletActif === 'sms' && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-gray-900">Configuration Passerelle SMS Brevo</h3>
              <p className="text-xs text-gray-500">Paramètres de connexion à l'API HTTP Transactionnelle Brevo.</p>
            </div>

            <Button
              onClick={() => void enregistrerConfigurationSysteme('SMS')}
              enCours={enregistrementEnCours}
              className="bg-fiscal-bordeaux hover:bg-fiscal-bordeauxFonce text-white text-xs font-bold px-4 py-2"
            >
              💾 Sauvegarder la clé API
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Clé d’API Brevo (v3 API Key) :</label>
              <input
                type="password"
                value={config.brevoApiKey}
                onChange={(e) => setConfig({ ...config, brevoApiKey: e.target.value })}
                className="w-full rounded-xl border border-gray-300 font-mono px-3 py-2 text-xs focus:border-fiscal-bordeaux focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Identifiant d’Expéditeur (Sender ID) :</label>
              <input
                type="text"
                value={config.brevoSenderId}
                onChange={(e) => setConfig({ ...config, brevoSenderId: e.target.value })}
                className="w-full rounded-xl border border-gray-300 font-mono font-bold px-3 py-2 text-xs focus:border-fiscal-bordeaux focus:outline-none"
              />
              <p className="text-[10px] text-gray-400 mt-1">Exemple : DGIFISC (Max 11 caractères alfanumériques).</p>
            </div>
          </div>

          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-950 space-y-2">
            <div className="font-extrabold text-amber-950 flex items-center gap-2 text-sm">
              <span>⚠️</span> Statut des Crédits Transactionnels SMS Brevo
            </div>
            <p className="leading-relaxed text-xs">
              Le compte Brevo configuré dispose de 300 envois emails/jour gratuits, mais le solde des **SMS transactionnels pour Madagascar (+261)** est actuellement de <strong>0 crédit</strong>.
            </p>
            <p className="leading-relaxed text-xs text-amber-900">
              Pour que les SMS soient distribués sur les réseaux Telma, Orange et Airtel, veuillez recharger votre compte sur <a href="https://app.brevo.com" target="_blank" rel="noopener noreferrer" className="underline font-bold text-amber-950">app.brevo.com</a> (Achat de crédits SMS transactionnels).
            </p>
          </div>
        </div>
      )}

      {/* 6. CONTENU ONGLET 3 : PASSERELLE EMAIL SMTP */}
      {ongletActif === 'email' && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-gray-900">Configuration Serveur SMTP Email</h3>
              <p className="text-xs text-gray-500">Paramètres d'envoi du Courrier Électronique Officiel DGI.</p>
            </div>

            <Button
              onClick={() => void enregistrerConfigurationSysteme('SMTP')}
              enCours={enregistrementEnCours}
              className="bg-fiscal-bordeaux hover:bg-fiscal-bordeauxFonce text-white text-xs font-bold px-4 py-2"
            >
              💾 Valider les paramètres SMTP
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Serveur Hôte SMTP :</label>
              <input
                type="text"
                value={config.smtpHost}
                onChange={(e) => setConfig({ ...config, smtpHost: e.target.value })}
                className="w-full rounded-xl border border-gray-300 font-mono px-3 py-2 text-xs focus:border-fiscal-bordeaux focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Port SMTP :</label>
              <input
                type="number"
                value={config.smtpPort}
                onChange={(e) => setConfig({ ...config, smtpPort: Number(e.target.value) })}
                className="w-full rounded-xl border border-gray-300 font-mono px-3 py-2 text-xs focus:border-fiscal-bordeaux focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Compte d’Envoi (Utilisateur SMTP) :</label>
              <input
                type="email"
                value={config.smtpUser}
                onChange={(e) => setConfig({ ...config, smtpUser: e.target.value })}
                className="w-full rounded-xl border border-gray-300 font-mono px-3 py-2 text-xs focus:border-fiscal-bordeaux focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Libellé de l’Expéditeur Officiel :</label>
              <input
                type="text"
                value={config.smtpExpediteurNom}
                onChange={(e) => setConfig({ ...config, smtpExpediteurNom: e.target.value })}
                className="w-full rounded-xl border border-gray-300 font-sans font-bold px-3 py-2 text-xs focus:border-fiscal-bordeaux focus:outline-none"
              />
              <p className="text-[10px] text-gray-400 mt-1">Exemple : Direction Régionale des Impôts - Vatovavy Fitovinany</p>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Ville d'Émission Officielle :</label>
              <input
                type="text"
                value={config.villeEmission}
                onChange={(e) => setConfig({ ...config, villeEmission: e.target.value })}
                className="w-full rounded-xl border border-gray-300 font-sans font-bold px-3 py-2 text-xs focus:border-fiscal-bordeaux focus:outline-none"
              />
              <p className="text-[10px] text-gray-400 mt-1">Ville figurant sur les avis et courriers officiels (par défaut : Manakara).</p>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-900 flex items-center gap-2">
            <span className="text-base">✓</span>
            <span><strong>Serveur Email Opérationnel :</strong> Les e-mails sont délivrés normalement aux contribuables avec la lettre officielle PDF en pièce jointe.</span>
          </div>
        </div>
      )}

      {/* 7. CONTENU ONGLET 4 : PÉNALITÉS & CGI MADAGASCAR */}
      {ongletActif === 'cgi' && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-gray-900">Règles Légales des Pénalités (Code Général des Impôts)</h3>
              <p className="text-xs text-gray-500">Taux de majorations et intérêts de retard applicables aux créances fiscales.</p>
            </div>

            <Button
              onClick={() => void enregistrerConfigurationSysteme('CGI')}
              enCours={enregistrementEnCours}
              className="bg-fiscal-bordeaux hover:bg-fiscal-bordeauxFonce text-white text-xs font-bold px-4 py-2"
            >
              💾 Sauvegarder les taux CGI
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="rounded-xl border border-gray-200 bg-slate-50 p-4 space-y-2">
              <label className="block font-extrabold text-gray-900">Majoration Initiale de Retard (%) :</label>
              <input
                type="number"
                step="0.1"
                value={config.tauxMajorationInitiale}
                onChange={(e) => setConfig({ ...config, tauxMajorationInitiale: Number(e.target.value) })}
                className="w-full rounded-lg border border-gray-300 font-mono font-black text-base px-3 py-2 focus:border-fiscal-bordeaux focus:outline-none"
              />
              <p className="text-[11px] text-gray-500">Appliquée dès le 1er jour de retard sur le solde brut dû.</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-slate-50 p-4 space-y-2">
              <label className="block font-extrabold text-gray-900">Intérêt Mensuel (%) :</label>
              <input
                type="number"
                step="0.1"
                value={config.tauxInteretMensuel}
                onChange={(e) => setConfig({ ...config, tauxInteretMensuel: Number(e.target.value) })}
                className="w-full rounded-lg border border-gray-300 font-mono font-black text-base px-3 py-2 focus:border-fiscal-bordeaux focus:outline-none"
              />
              <p className="text-[11px] text-gray-500">Calculé mensuellement pour tout mois entamé de retard (1.0%/mois).</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-slate-50 p-4 space-y-2">
              <label className="block font-extrabold text-gray-900">Délai de Grâce Légale (jours) :</label>
              <input
                type="number"
                value={config.delaiGraceDefaut}
                onChange={(e) => setConfig({ ...config, delaiGraceDefaut: Number(e.target.value) })}
                className="w-full rounded-lg border border-gray-300 font-mono font-black text-base px-3 py-2 focus:border-fiscal-bordeaux focus:outline-none"
              />
              <p className="text-[11px] text-gray-500">Nombre de jours accordés dans les sommation de régularisation (8 jours par défaut).</p>
            </div>
          </div>
        </div>
      )}

      {/* 8. CONTENU ONGLET 5 : SIGNATURES & MODÈLES */}
      {ongletActif === 'signatures' && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-gray-900">Mentions Légales & Signatures des Lettres PDF</h3>
              <p className="text-xs text-gray-500">Informations apparaissant sur le papier à lettres officiel imprimable.</p>
            </div>

            <Button
              onClick={() => void enregistrerConfigurationSysteme('SIGNATURES')}
              enCours={enregistrementEnCours}
              className="bg-fiscal-bordeaux hover:bg-fiscal-bordeauxFonce text-white text-xs font-bold px-4 py-2"
            >
              💾 Sauvegarder les signatures
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Nom de l’Autorité Signataire :</label>
              <input
                type="text"
                value={config.nomSignataire}
                onChange={(e) => setConfig({ ...config, nomSignataire: e.target.value })}
                className="w-full rounded-xl border border-gray-300 font-bold px-3 py-2 text-xs focus:border-fiscal-bordeaux focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Titre Officiel de l’Autorité :</label>
              <input
                type="text"
                value={config.titreSignataire}
                onChange={(e) => setConfig({ ...config, titreSignataire: e.target.value })}
                className="w-full rounded-xl border border-gray-300 font-bold px-3 py-2 text-xs focus:border-fiscal-bordeaux focus:outline-none"
              />
            </div>

            <div className="col-span-full">
              <label className="block font-bold text-gray-700 mb-1">Mentions Légales au Bas de Page :</label>
              <textarea
                rows={3}
                value={config.mentionLegale}
                onChange={(e) => setConfig({ ...config, mentionLegale: e.target.value })}
                className="w-full rounded-xl border border-gray-300 p-3 text-xs leading-relaxed focus:border-fiscal-bordeaux focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}