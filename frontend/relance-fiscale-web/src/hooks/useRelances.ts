import { useCallback, useEffect, useState } from 'react';
import { relanceService } from '@/services/relanceService';
import type { Relance } from '@/types/relance.types';
import { extraireMessageErreur } from '@/services/apiClient';

export function useRelances(detteFiscaleId: number | null) {
  const [relances, setRelances] = useState<Relance[]>([]);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const recharger = useCallback(async () => {
    if (detteFiscaleId === null) return;
    setChargement(true);
    setErreur(null);
    try {
      setRelances(await relanceService.listerParDette(detteFiscaleId));
    } catch (err) {
      setErreur(extraireMessageErreur(err));
    } finally {
      setChargement(false);
    }
  }, [detteFiscaleId]);

  useEffect(() => {
    recharger();
  }, [recharger]);

  return { relances, chargement, erreur, recharger };
}