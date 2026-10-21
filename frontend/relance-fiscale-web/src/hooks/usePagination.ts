import { useState } from 'react';

export function usePagination(taillePageInitiale = 20) {
  const [page, setPage] = useState(0);
  const [taillePage, setTaillePage] = useState(taillePageInitiale);

  return {
    page,
    taillePage,
    pageSuivante: () => setPage((p) => p + 1),
    pagePrecedente: () => setPage((p) => Math.max(0, p - 1)),
    allerALaPage: (n: number) => setPage(Math.max(0, n)),
    changerTaillePage: (taille: number) => {
      setTaillePage(taille);
      setPage(0);
    },
  };
}