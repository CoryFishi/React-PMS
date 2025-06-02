export default function ModalContainer({
  title,
  icon,
  mainContent,
  responseContent,
  onClose,
}) {
  return (
    // Modal Background
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center dark:text-white">
      {/* Modal Container */}
      <div className="bg-white dark:bg-zinc-900 dark:text-whiterounded shadow-lg rounded">
        {/* Header Container */}
        <div className="pl-5 border-b-2 border-b-blue-500 flex justify-between items-center h-12">
          <div className="flex items-center">
            {icon || ""}
            <h2 className="ml-2 text-lg font-bold">{title || "Modal Title"}</h2>
          </div>
          {responseContent ? (
            ""
          ) : (
            <button
              onClick={onClose}
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
