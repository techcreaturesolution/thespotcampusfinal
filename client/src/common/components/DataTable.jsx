import React, { useMemo, useState } from "react";
import { FiSearch, FiInbox } from "react-icons/fi";

const thClass = "px-5 py-4 text-left text-[11px] font-extrabold uppercase tracking-widest text-[#3730a3] bg-[#f0f2fa] border-b border-indigo-100";
const tdClass = "px-5 py-4 text-slate-600 text-sm font-medium";
const trClass = "border-b border-slate-200/60 last:border-0 hover:bg-indigo-50/30 transition-colors duration-150";

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
    <div className="bg-white rounded-2xl border border-slate-200 border-t-4 border-t-[#3730a3] shadow-sm overflow-hidden">
      {(searchKeys.length > 0 || toolbar) && (
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-slate-200/60 bg-[#f8f9ff]/70">
          {searchKeys.length > 0 && (
            <div className="relative flex-1 max-w-md">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3730a3] pointer-events-none" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 focus:border-[#3730a3] focus:bg-white outline-none rounded-xl transition focus:ring-4 focus:ring-indigo-100/50 shadow-sm"
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
            {filtered.map((row, idx) => (
              <tr key={row[rowKey]} className={`${trClass} ${idx % 2 === 1 ? "bg-indigo-50/10" : "bg-white"}`}>
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
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400 text-sm bg-white/40">
          <FiInbox className="w-12 h-12 text-[#3730a3]/20" />
          <p className="font-semibold text-slate-500">{emptyMessage}</p>
          {query && <p className="text-xs text-slate-400">Try a different search term</p>}
        </div>
      )}

      {filtered.length > 0 && (
        <div className="px-5 py-4 text-xs font-bold text-slate-400 border-t border-slate-200/60 bg-indigo-50/5">
          Showing <span className="text-slate-600">{filtered.length}</span>
          {filtered.length !== data.length && (
            <> of <span className="text-slate-600">{data.length}</span></>
          )}{" "}
          records
        </div>
      )}
    </div>
  );
};

export default DataTable;
