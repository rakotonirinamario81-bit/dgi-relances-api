interface SearchBarProps {
  valeur: string;
  onChange: (valeur: string) => void;
  placeholder?: string;
}

export function SearchBar({ valeur, onChange, placeholder = 'Rechercher...' }: SearchBarProps) {
  return (
    <input
      type="search"
      value={valeur}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full max-w-xs rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fiscal-bordeaux"
    />
  );
}