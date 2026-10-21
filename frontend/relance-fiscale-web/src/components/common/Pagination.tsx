interface PaginationProps {
  page: number; // 0-indexé
  totalPages: number;
  onChanger: (page: number) => void;
}

export function Pagination({ page, totalPages, onChanger }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between py-3">
      <button
        onClick={() => onChanger(page - 1)}
        disabled={page === 0}
        className="rounded border px-3 py-1.5 text-sm disabled:opacity-40"
      >
        Précédent
      </button>
      <span className="text-sm text-gray-600">
        Page {page + 1} sur {totalPages}
      </span>
      <button
        onClick={() => onChanger(page + 1)}
        disabled={page >= totalPages - 1}
        className="rounded border px-3 py-1.5 text-sm disabled:opacity-40"
      >
        Suivant
      </button>
    </div>
  );
}