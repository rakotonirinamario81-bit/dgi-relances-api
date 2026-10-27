import { apiClient } from './apiClient';
import type { ConfigurationSystemeDTO } from '@/types/configuration.types';

const STORAGE_KEY = 'relance_fiscale_config_systeme';

export const CONFIG_DEFAUT: ConfigurationSystemeDTO = {
  smtpHost: 'smtp-relay.brevo.com',
  smtpPort: 587,
  smtpUser: 'rakotonirinamario81@gmail.com',
  smtpExpediteurNom: 'Direction Régionale des Impôts - Vatovavy Fitovinany',
  smtpStatut: 'ACTIF',
  villeEmission: 'Manakara',
  serviceNom: 'Direction Régionale des Impôts - Vatovavy Fitovinany',
  brevoApiKey: '',
  brevoSenderId: 'DGIFISC',
  brevoSoldeSms: 0,
  tauxMajorationInitiale: 10,
  tauxInteretMensuel: 1.0,
  delaiGraceDefaut: 8,
  nomSignataire: 'Le Responsable du Recouvrement',
  titreSignataire: 'Chef de Service Régional des Entreprises',
  mentionLegale: 'Conformément aux Articles 20.03.02 et 20.01.53 du Code Général des Impôts de Madagascar.',
};

export const configurationService = {
  /**
   * Récupère la configuration système depuis l'API backend avec fallback local.
   */
  async getConfiguration(): Promise<ConfigurationSystemeDTO> {
    try {
      const res = await apiClient.get<ConfigurationSystemeDTO>('/configuration-systeme');
      if (res.data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(res.data));
        return { ...CONFIG_DEFAUT, ...res.data };
      }
    } catch {
      // Fallback sur le cache local
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return { ...CONFIG_DEFAUT, ...JSON.parse(saved) };
        } catch {
          // ignore
        }
      }
    }
    return CONFIG_DEFAUT;
  },

  /**
   * Sauvegarde la configuration système sur le backend et en cache local.
   */
  async sauvegarderConfiguration(config: ConfigurationSystemeDTO): Promise<ConfigurationSystemeDTO> {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    try {
      const res = await apiClient.put<ConfigurationSystemeDTO>('/configuration-systeme', config);
      if (res.data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(res.data));
        return res.data;
      }
    } catch (err) {
      console.warn('Sauvegarde distante indisponible, enregistrement local appliqué:', err);
    }
    return config;
  },

  /**
   * Lecture synchrone directe du libellé expéditeur (utile pour les rendus instantanés).
   */
  getLibelleExpediteurActuel(): string {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ConfigurationSystemeDTO;
        if (parsed.smtpExpediteurNom && parsed.smtpExpediteurNom.trim()) {
          return parsed.smtpExpediteurNom.trim();
        }
      } catch {
        // ignore
      }
    }
    return CONFIG_DEFAUT.smtpExpediteurNom!;
  },

  /**
   * Lecture synchrone de la ville d'émission.
   */
  getVilleEmissionActuelle(): string {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ConfigurationSystemeDTO;
        if (parsed.villeEmission && parsed.villeEmission.trim()) {
          return parsed.villeEmission.trim();
        }
      } catch {
        // ignore
      }
    }
    return CONFIG_DEFAUT.villeEmission!;
  },
};
