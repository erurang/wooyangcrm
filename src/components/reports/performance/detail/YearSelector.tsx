"use client";

interface YearSelectorProps {
  availableYears: number[];
  selectedYears: number[];
  currentYear: number;
  onToggleYear: (year: number) => void;
}

export default function YearSelector({
  availableYears,
  selectedYears,
  currentYear,
  onToggleYear,
}: YearSelectorProps) {
  const allYears = [...new Set([...availableYears, currentYear])];

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {allYears.map((year) => (
        <label key={year} className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={selectedYears.includes(year)}
            onChange={() => onToggleYear(year)}
          />
          <span
            className={year === currentYear ? "font-bold text-sky-600" : ""}
          >
            {year}
          </span>
        </label>
      ))}
    </div>
  );
}
