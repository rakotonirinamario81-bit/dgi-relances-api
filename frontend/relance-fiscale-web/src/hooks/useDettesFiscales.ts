import { useCallback, useEffect, useState } from 'react';
import { detteFiscaleService } from '@/services/detteFiscaleService';
import type { DetteFiscale } from '@/types/detteFiscale.types';
import { extraireMessageErreur } from '@/services/apiClient';

export function useDettesFiscales(contribuableId: number | null) {
  const [dettes, setDettes] = useState<DetteFiscale[]>([]);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const recharger = useCallback(async () => {
    if (contribuableId === null) return;
    setChargement(true);
    setErreur(null);
    try {
      const donnees = await detteFiscaleService.listerParContribuable(contribuableId);
      setDettes(donnees);
    } catch (err) {
      setErreur(extraireMessageErreur(err));
    } finally {
      setChargement(false);
    }
  }, [contribuableId]);

  useEffect(() => {
    recharger();
  }, [recharger]);

  return { dettes, chargement, erreur, recharger };
}