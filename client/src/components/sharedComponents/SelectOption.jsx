import { useState } from "react";

export default function SelectOption({
  value,
  onChange,
  options = [],
  placeholder = "Select an option",
  required = false,
}) {
  const hasValue = value !== "";
  const [isFocused, setIsFocused] = useState(false);

  const shouldFloat = isFocused || hasValue;

  return (
    <div className="relative w-full">
      {/* Select Element */}
      <select
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`min-h-13 cursor-pointer peer w-full p-3 bg-transparent border border-slate-400 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-sky-600 dark:bg-slate-900 dark:border-slate-600`}
      >
        <option value="" disabled hidden></option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.name}
          </option>
        ))}
        {options.length === 0 && (
          <option value="" disabled>
            No options available
          </option>
        )}
      </select>

      {/* Floating Label */}
      <label
        className={`absolute left-3 px-2 transition-all duration-200 rounded-md
        ${
          shouldFloat
            ? "text-xs -top-2  bg-white dark:bg-slate-800"
            : "text-base top-3 text-zinc-500 "
        }
        pointer-events-none`}
      >
        {placeholder} {required && <span className="text-red-500">*</span>}
      </label>
    </div>
  );
}
