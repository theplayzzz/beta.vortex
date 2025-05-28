import { Building } from "lucide-react";
import { SETORES_PERMITIDOS } from "@/lib/constants/sectors";

interface SectorSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function SectorSelect({ 
  value, 
  onValueChange, 
  placeholder = "Selecione o setor de atuação",
  disabled = false,
  className = ""
}: SectorSelectProps) {
  return (
    <div className={`relative ${className}`}>
      <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-periwinkle z-10 pointer-events-none" />
      <select
        value={value || ""}
        onChange={(e) => onValueChange(e.target.value)}
        disabled={disabled}
        className="w-full pl-10 pr-4 py-3 bg-night border border-seasalt/20 rounded-lg text-seasalt placeholder-periwinkle focus:outline-none focus:border-sgbus-green focus:ring-2 focus:ring-sgbus-green/20 appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="" disabled className="text-periwinkle">
          {placeholder}
        </option>
        {SETORES_PERMITIDOS.map((setor) => (
          <option 
            key={setor} 
            value={setor}
            className="text-seasalt bg-night"
          >
            {setor}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg
          className="h-4 w-4 text-periwinkle"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  );
} 