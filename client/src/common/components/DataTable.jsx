import React, { useMemo, useState } from "react";
import { FiSearch, FiInbox } from "react-icons/fi";

const thClass = "px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 bg-gray-50/80";
const tdClass = "px-5 py-4 text-gray-600";
const trClass = "border-t border-gray-100 hover:bg-primary-50/40 transition-colors";

const DataTable = ({
  columns,
  data,
  rowKey = "_id",
  searchKeys = [],
  searchPlaceholder = "Search…",
  emptyMessage = "No records found",
  toolbar,
}) => {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim() || searchKeys.length === 0) return data;
    const q = query.toLowerCase();
    return data.filter((row) =>
      searchKeys.some((key) => {
        const val = key.split(".").reduce((acc, k) => acc?.[k], row);
        return String(val ?? "").toLowerCase().includes(q);
      })
    );
  }, [data, query, searchKeys]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {(searchKeys.length > 0 || toolbar) && (
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-gray-100 bg-gray-50/50">
          {searchKeys.length > 0 && (
            <div className="relative flex-1 max-w-md">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none transition"
              />
            </div>
          )}
          {toolbar && <div className="ml-auto flex items-center gap-2">{toolbar}</div>}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={`${thClass} ${col.className || ""}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row[rowKey]} className={trClass}>
                {columns.map((col) => (
                  <td key={col.key} className={`${tdClass} ${col.className || ""}`}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-500 text-sm">
          <FiInbox className="w-10 h-10 text-gray-300" />
          <p>{emptyMessage}</p>
          {query && <p className="text-xs text-gray-400">Try a different search term</p>}
        </div>
      )}

      {filtered.length > 0 && (
        <div className="px-5 py-3 text-xs text-gray-500 border-t border-gray-100 bg-gray-50/30">
          Showing <span className="font-semibold text-gray-700">{filtered.length}</span>
          {filtered.length !== data.length && (
            <> of <span className="font-semibold text-gray-700">{data.length}</span></>
          )}{" "}
          records
        </div>
      )}
    </div>
  );
};

export default DataTable;
