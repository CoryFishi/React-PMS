import { useState, useRef, useEffect } from "react";

export default function MultiSelectDropdown({
  label = "Select Options",
  options = [],
  selected = [],
  onChange,
  required = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleToggle = () => setIsOpen(!isOpen);

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };

  const handleCheckboxChange = (id) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const shouldFloat = isOpen || selected.length > 0;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Floating Label */}
      <label
        className={`absolute left-3 px-1 transition-all duration-200 bg-white dark:bg-zinc-900 pointer-events-none z-20 -top-2 text-xs ${
          shouldFloat && "text-blue-600"
        }`}
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Button */}
      <button
        type="button"
        onClick={handleToggle}
        className="min-h-12 mt-4 block w-full px-3 py-2 border bg-white dark:bg-zinc-900 dark:border-zinc-700 border-zinc-300 rounded-md shadow-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-600 sm:text-sm"
      >
        {selected.length} / {options.length} Selected
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute w-full bg-white border border-zinc-300 dark:bg-zinc-800 dark:border-zinc-700 rounded-md shadow-lg mt-1 z-10 max-h-60 overflow-y-auto">
          {options.map((option) => (
            <label
              key={option.id}
              className="flex items-center px-4 py-2 text-sm text-black dark:text-white"
            >
              <input
                type="checkbox"
                checked={selected.includes(option.id)}
                onChange={() => handleCheckboxChange(option.id)}
                className="mr-2"
              />
              {option.name}
            </label>
          ))}
          {options.length < 1 && (
            <p className="flex flex-wrap w-full text-center">
              No facilities under this company
            </p>
          )}
        </div>
      )}
    </div>
  );
}
