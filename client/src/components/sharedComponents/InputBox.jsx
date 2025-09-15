import { useState } from "react";
import { IoCloseCircle } from "react-icons/io5";

export default function InputBox({
  value,
  onchange,
  placeholder = "",
  type = "text",
  required = false,
}) {
  const [isFocused, setIsFocused] = useState(false);
  const shouldFloat = isFocused || value;

  return (
    <div className="relative w-full dark:text-white">
      {/* Input */}
      <input
        type={type}
        value={value}
        onChange={onchange || null}
        disabled={onchange == undefined && true}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder=""
        className="whitespace-nowrap min-h-12 w-full px-2 py-1 pr-8 border border-zinc-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-slate-900 dark:border-slate-600"
      />

      {/* Floating label */}
      <label
        className={`absolute left-3 px-2 transition-all duration-200 rounded-md whitespace-nowrap
        ${
          shouldFloat
            ? "text-xs -top-2  bg-white dark:bg-slate-800"
            : "text-base top-3 text-zinc-500 "
        }
        pointer-events-none`}
      >
        {placeholder} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Clear button */}
      {value && onchange && (
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
          onClick={() => onchange({ target: { value: "" } })}
        >
          <IoCloseCircle size={18} />
        </button>
      )}
    </div>
  );
}
