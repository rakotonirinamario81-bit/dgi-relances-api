import { useCallback, useEffect, useState } from 'react';
import { contribuableService } from '@/services/contribuableService';
import type { Contribuable } from '@/types/contribuable.types';
import { extraireMessageErreur } from '@/services/apiClient';

interface UseContribuablesParams {
  nif?: string;
  nom?: string;
  commune?: string;
  page: number;
  taillePage: number;
}

export function useContribuables(params: UseContribuablesParams) {
  const [contribuables, setContribuables] = useState<Contribuable[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const recharger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const resultat = await contribuableService.rechercher({
        nif: params.nif,
        nom: params.nom,
        commune: params.commune,
        page: params.page,
        size: params.taillePage,
      });
      setContribuables(resultat.content);
      setTotalElements(resultat.totalElements);
    } catch (err) {
      setErreur(extraireMessageErreur(err));
    } finally {
      setChargement(false);
    }
  }, [params.nif, params.nom, params.commune, params.page, params.taillePage]);

  useEffect(() => {
    recharger();
  }, [recharger]);

  return { contribuables, totalElements, chargement, erreur, recharger };
}