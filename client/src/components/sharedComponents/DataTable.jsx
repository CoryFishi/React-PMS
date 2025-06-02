import { useState, useEffect, useRef } from "react";

export default function DataTable({
  columns,
  data,
  currentPage = 1,
  rowsPerPage = 25,
  sortDirection,
  sortedColumn,
  onSort,
  hoveredRow = null,
  setHoveredRow = null,
  onRowClick = null,
}) {
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    content: "",
  });
  const contextRef = useRef(null);
  const paginatedData = data.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  useEffect(() => {
    const handleDismiss = (e) => {
      if (contextRef.current && !contextRef.current.contains(e.target)) {
        setContextMenu((prev) => ({ ...prev, visible: false }));
      }
    };

    const handleScroll = () => {
      setContextMenu((prev) => ({ ...prev, visible: false }));
    };

    document.addEventListener("click", handleDismiss);
    document.addEventListener("auxclick", handleDismiss);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("click", handleDismiss);
      document.addEventListener("auxclick", handleDismiss);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, []);

  return (
    <>
      <table className="w-full table-auto border-collapse border-zinc-300 dark:border-zinc-800 dark:text-white">
        <thead className="sticky top-[-1px] z-10 bg-zinc-200 dark:bg-zinc-800">
          <tr>
            {columns.map(({ key, label, accessor, sortable = true }) => (
              <th
                key={key}
                className={`px-4 py-2 select-none justify-center text-center items-center ${
                  sortable
                    ? "hover:cursor-pointer hover:bg-zinc-300 dark:hover:bg-zinc-950"
                    : ""
                } ${
                  sortedColumn === key && sortable
                    ? "bg-zinc-300 dark:bg-zinc-950"
                    : ""
                }`}
                onClick={() => {
                  if (sortable && onSort) onSort(key, accessor);
                }}
              >
                {label}
                {sortedColumn === key && sortable && (
                  <span className="ml-2">
                    {sortDirection === "asc" ? "▲" : "▼"}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((item, index) => (
            <tr
              key={index}
              onClick={() => onRowClick?.(item)}
              onMouseEnter={
                setHoveredRow ? () => setHoveredRow(index) : undefined
              }
              onMouseLeave={
                setHoveredRow ? () => setHoveredRow(null) : undefined
              }
              className={`hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                hoveredRow !== null ? "cursor-pointer" : ""
              }`}
            >
              {columns.map(({ key, accessor, render }) => (
                <td
                  key={key}
                  className="border-y border-zinc-300 dark:border-zinc-700 px-4 py-2 text-center items-center justify-center"
                  onContextMenu={(e) => {
                    e.preventDefault();
                    const value =
                      typeof accessor === "function"
                        ? accessor(item)
                        : item[key];
                    if (!value) return;
                    const rect = e.currentTarget.getBoundingClientRect();

                    setContextMenu({
                      visible: true,
                      x: rect.left,
                      y: rect.bottom,
                      content: { cell: value, row: item },
                    });
                  }}
                >
                  {render
                    ? render(item, index)
                    : typeof accessor === "function"
                    ? accessor(item)
                    : item[key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {contextMenu.visible && (
        <div
          ref={contextRef}
          className="fixed bg-white dark:bg-border-zinc-900 border rounded shadow-lg z-50 text-sm"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={() => setContextMenu({ ...contextMenu, visible: false })}
        >
          <button
            onClick={() => {
              navigator.clipboard.writeText(contextMenu.content.cell);
              setContextMenu({ ...contextMenu, visible: false });
            }}
            className="block w-full text-left px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-950"
          >
            Copy Cell
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(
                JSON.stringify(contextMenu.content.row, null, 2)
              );
              setContextMenu({ ...contextMenu, visible: false });
            }}
            className="block w-full text-left px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-950"
          >
            Copy Row
          </button>
        </div>
      )}
    </>
  );
}
