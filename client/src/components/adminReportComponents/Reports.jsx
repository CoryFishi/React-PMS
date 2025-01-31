import { useState } from "react";

export default function Reports() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex flex-col h-full w-full relative dark:bg-darkPrimary">
      <div className="w-full p-5 bg-gray-200 flex justify-around items-center dark:bg-darkNavPrimary dark:text-white">
        <h2 className="text-xl font-bold">Report Summary</h2>
        <p className="text-sm">Errors: 0</p>
      </div>
      <div className="my-4 flex items-center justify-end text-center mx-5">
        <input
          type="text"
          placeholder="Search reports..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border dark:text-white p-2 w-full dark:bg-darkNavSecondary rounded dark:border-border"
        />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4"></div>
    </div>
  );
}
