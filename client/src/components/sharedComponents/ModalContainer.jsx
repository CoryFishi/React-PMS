import { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input:not([disabled]), select, [tabindex]:not([tabindex="-1"])';

export default function ModalContainer({
  title,
  icon,
  mainContent,
  responseContent,
  onClose,
}) {
  const modalRef = useRef(null);
  const previouslyFocused = useRef(null);

  useEffect(() => {
    previouslyFocused.current = document.activeElement;

    const node = modalRef.current;
    const focusable = node?.querySelectorAll(FOCUSABLE);
    (focusable?.[0] || node)?.focus();

    function handleKeyDown(e) {
      if (e.key === "Escape" && onClose) {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const items = node?.querySelectorAll(FOCUSABLE);
      if (!items || items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused.current?.focus?.();
    };
  }, [onClose]);

  return (
    // Modal Background
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center dark:text-white">
      {/* Modal Container */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={title || "Modal"}
        tabIndex={-1}
        className="bg-white dark:bg-slate-800 dark:text-white rounded shadow-lg outline-none"
      >
        {/* Header Container */}
        <div className="pl-5 border-b-2 border-b-sky-500 flex justify-between items-center h-12">
          <div className="flex items-center">
            {icon || ""}
            <h2 className="ml-2 text-lg font-bold">{title || "Modal Title"}</h2>
          </div>
          {responseContent ? (
            ""
          ) : (
            <button
              onClick={onClose}
              aria-label="Close"
              className="bg-zinc-100 h-full px-5 cursor-pointer rounded-tr text-zinc-600 dark:text-white dark:bg-zinc-800 dark:hover:hover:bg-red-500 hover:bg-red-500 transition duration-300 ease-in-out"
              title="Close"
            >
              x
            </button>
          )}
        </div>
        {/* Content Container */}
        <div className="px-8 pb-4 max-h-[90vh] overflow-y-auto">
          {mainContent || (
            <p>No content provided. Please check the component's props.</p>
          )}
          {/* Response Container */}
          <div className="mt-4 flex justify-end">{responseContent || ""}</div>
        </div>
      </div>
    </div>
  );
}
