import {
  BiChevronLeft,
  BiChevronRight,
  BiChevronsLeft,
  BiChevronsRight,
} from "react-icons/bi";
export default function PaginationFooter({
  rowsPerPage,
  setRowsPerPage,
  currentPage,
  setCurrentPage,
  items,
}) {
  const pageCount = Math.ceil(items.length / rowsPerPage);

  return (
    <div className="flex justify-between items-center dark:text-white">
      <div className="flex gap-3">
        <div>
          <select
            className="border rounded ml-2 dark:bg-zinc-800 dark:border-zinc-900 cursor-pointer"
            id="rowsPerPage"
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1); // Reset to first page on rows per page change
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={250}>250</option>
          </select>
        </div>
        <p className="text-sm">
          {currentPage === 1 ? 1 : (currentPage - 1) * rowsPerPage + 1} -{" "}
          {currentPage * rowsPerPage > items.length
            ? items.length
            : currentPage * rowsPerPage}{" "}
          of {items.length}
        </p>
      </div>
      <div className="gap-2 flex">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(1)}
          className="hover:cursor-pointer disabled:cursor-not-allowed p-1 disabled:text-zinc-500"
        >
          <BiChevronsLeft />
        </button>
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
          className="hover:cursor-pointer disabled:cursor-not-allowed p-1 disabled:text-zinc-500"
        >
          <BiChevronLeft />
        </button>
        <p>
          {currentPage} of {pageCount}
        </p>
        <button
          disabled={currentPage === pageCount}
          onClick={() => setCurrentPage((prev) => prev + 1)}
          className="hover:cursor-pointer disabled:cursor-not-allowed p-1 disabled:text-zinc-500"
        >
          <BiChevronRight />
        </button>
        <button
          disabled={currentPage === pageCount}
          onClick={() => setCurrentPage(pageCount)}
          className="hover:cursor-pointer disabled:cursor-not-allowed p-1 disabled:text-zinc-500"
        >
          <BiChevronsRight />
        </button>
      </div>
    </div>
  );
}
