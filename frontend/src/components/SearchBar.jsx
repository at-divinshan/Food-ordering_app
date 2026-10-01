import { Search } from "lucide-react";
export default function SearchBar({
  value,
  onChange,
  placeholder = "Search food…",
}) {
  return (
    <label className="search">
      <Search size={17} />
      <input
        aria-label={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
