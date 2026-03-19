import React from "react";
import { useSchoolAutocomplete } from "../hooks/useSchoolAutocomplete";

interface SchoolAutocompleteProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value?: string;
  onPlaceSelect?: (location: any) => void;
  onManualEntry?: (name: string) => void;
  error?: string;
}

const SchoolAutocomplete = ({
  value,
  onChange,
  onPlaceSelect,
  onManualEntry,
  placeholder = "Search for school name...",
  className = "",
  error,
  ...props
}: SchoolAutocompleteProps) => {
  const {
    inputRef,
    inputValue,
    isValidSelection,
    handleInputChange,
    isLoaded,
    loadError,
  } = useSchoolAutocomplete({ value, onChange, onPlaceSelect });

  return (
    <div className="relative space-y-2">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder={isLoaded ? placeholder : "Loading search..."}
        className={`w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 transition-all outline-none font-bold text-gray-900 placeholder:text-gray-400 text-lg ${
          error ? "border-red-500 bg-red-50" : "border-gray-200 focus:border-[rgb(32,38,130)] focus:bg-white focus:shadow-lg focus:shadow-blue-900/5"
        } ${className}`}
        {...props}
      />
      
      {!isValidSelection && inputValue.length > 2 && (
        <button
          type="button"
          onClick={() => onManualEntry?.(inputValue)}
          className="text-xs font-bold text-[rgb(32,38,130)] hover:underline px-1"
        >
          School not found? Enter manually
        </button>
      )}

      {error && <p className="text-xs font-bold text-red-500 px-1">{error}</p>}
      {loadError && <p className="text-xs text-orange-500 px-1">Location search unavailable</p>}
    </div>
  );
};

export default SchoolAutocomplete;
