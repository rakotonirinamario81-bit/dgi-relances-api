import { useEffect, useState } from 'react';

/** Retarde la mise à jour d'une valeur — utile pour la recherche multicritère (évite un appel API par frappe). */
export function useDebounce<T>(valeur: T, delaiMs = 400): T {
  const [valeurDebattue, setValeurDebattue] = useState(valeur);

  useEffect(() => {
    const timer = setTimeout(() => setValeurDebattue(valeur), delaiMs);
    return () => clearTimeout(timer);
  }, [valeur, delaiMs]);

  return valeurDebattue;
}