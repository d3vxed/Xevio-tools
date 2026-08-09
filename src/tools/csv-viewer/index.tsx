import { useMemo, useState } from "react";
import Papa from "papaparse";
import {
  ToolLayout,
  FileDropzone,
  Button,
  ErrorDisplay,
} from "../../components/ui";
import { TOOLS_BY_SLUG } from "../registry";
import { Search, Download } from "lucide-react";

const PAGE_SIZE = 50;

export default function CSVViewer() {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [filename, setFilename] = useState("");
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const tool = TOOLS_BY_SLUG["csv-viewer"];

  const load = (file: File) => {
    setError(null);
    setFilename(file.name);
    Papa.parse(file, {
      complete: (result) => {
        const data = result.data as string[][];
        if (!data.length) {
          setError("No data found.");
          return;
        }
        const h = data[0];
        const r = data.slice(1).filter((row) => row.some((c) => c !== ""));
        setHeaders(h);
        setRows(r);
        setPage(0);
        setSortCol(null);
      },
      error: (e) => setError(e.message),
    });
  };

  const filtered = useMemo(() => {
    if (!search) return rows;
    const s = search.toLowerCase();
    return rows.filter((r) => r.some((c) => c.toLowerCase().includes(s)));
  }, [rows, search]);

  const sorted = useMemo(() => {
    if (sortCol === null) return filtered;
    return [...filtered].sort((a, b) => {
      const av = a[sortCol] ?? "";
      const bv = b[sortCol] ?? "";
      const an = parseFloat(av);
      const bn = parseFloat(bv);
      if (!isNaN(an) && !isNaN(bn)) return sortDir === "asc" ? an - bn : bn - an;
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [filtered, sortCol, sortDir]);

  const paged = useMemo(() => {
    return sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  }, [sorted, page]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));

  const toggleSort = (i: number) => {
    if (sortCol === i) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortCol(i);
      setSortDir("asc");
    }
  };

  const download = () => {
    const csv = Papa.unparse([headers, ...sorted]);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "data.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setHeaders([]);
    setRows([]);
    setFilename("");
    setSearch("");
    setSortCol(null);
    setPage(0);
    setError(null);
  };

  return (
    <ToolLayout tool={tool}>
      <div className="space-y-5">
        {!headers.length ? (
          <FileDropzone
            accept=".csv,text/csv"
            onFiles={(f) => load(f[0])}
            label="Drop a CSV file here"
          />
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div>
                <p className="text-sm font-medium">{filename}</p>
                <p className="text-xs text-[#91887D]">
                  {sorted.length} row{sorted.length !== 1 ? "s" : ""} •{" "}
                  {headers.length} column{headers.length !== 1 ? "s" : ""}
                  {search && ` • filtered: ${filtered.length}`}
                </p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#91887D]" />
                  <input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(0);
                    }}
                    placeholder="Search…"
                    className="w-full sm:w-64 pl-9 pr-3 py-2 bg-[#11100F] border border-[#342821] rounded-lg text-sm placeholder:text-[#91887D] focus:border-[#C96B4B] outline-none"
                  />
                </div>
                <Button variant="secondary" size="sm" onClick={download}>
                  <Download className="w-3.5 h-3.5" /> Download
                </Button>
                <Button variant="ghost" size="sm" onClick={reset}>
                  Replace
                </Button>
              </div>
            </div>

            <div className="border border-[#342821] rounded-lg overflow-hidden overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#25211D] border-b border-[#342821]">
                  <tr>
                    {headers.map((h, i) => (
                      <th
                        key={i}
                        onClick={() => toggleSort(i)}
                        className="px-3 py-2 text-left font-medium text-[#E8E1D5] whitespace-nowrap cursor-pointer hover:text-[#C96B4B]"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{h || <span className="text-[#91887D]">col {i + 1}</span>}</span>
                          {sortCol === i && (
                            <span className="text-[#C96B4B]">
                              {sortDir === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.map((row, ri) => (
                    <tr key={ri} className="border-b border-[#342821]/50 hover:bg-[#25211D]/40">
                      {headers.map((_, ci) => (
                        <td
                          key={ci}
                          className="px-3 py-2 text-[#E8E1D5] whitespace-nowrap max-w-xs truncate"
                          title={row[ci]}
                        >
                          {row[ci] ?? ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {paged.length === 0 && (
                    <tr>
                      <td colSpan={headers.length} className="py-8 text-center text-[#91887D]">
                        No rows match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-[#91887D]">
                Page {page + 1} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}

        {error && <ErrorDisplay message={error} />}
      </div>
    </ToolLayout>
  );
}
