import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import {
  ToolLayout,
  FileDropzone,
  Button,
  DownloadResult,
  ProgressBar,
  ErrorDisplay,
  formatBytes,
} from "../../components/ui";
import { TOOLS_BY_SLUG } from "../registry";
import { FileText, Loader2 } from "lucide-react";

export default function SplitPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [range, setRange] = useState("");
  const [result, setResult] = useState<Blob | null>(null);
  const [working, setWorking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const tool = TOOLS_BY_SLUG["split-pdf"];

  const load = async (f: File) => {
    setError(null);
    setResult(null);
    try {
      const buf = await f.arrayBuffer();
      const pdf = await PDFDocument.load(buf, { ignoreEncryption: true });
      setFile(f);
      setPageCount(pdf.getPageCount());
    } catch (e: any) {
      setError("Could not read this PDF. It may be corrupted or encrypted.");
    }
  };

  const parseRange = (s: string, total: number): number[] => {
    const pages = new Set<number>();
    const parts = s.split(",").map((x) => x.trim()).filter(Boolean);
    for (const part of parts) {
      if (part.includes("-")) {
        const [a, b] = part.split("-").map((x) => parseInt(x.trim(), 10));
        if (!Number.isFinite(a) || !Number.isFinite(b)) throw new Error(`Invalid range: ${part}`);
        const lo = Math.max(1, Math.min(a, b));
        const hi = Math.min(total, Math.max(a, b));
        for (let i = lo; i <= hi; i++) pages.add(i);
      } else {
        const n = parseInt(part, 10);
        if (!Number.isFinite(n) || n < 1 || n > total) throw new Error(`Invalid page: ${part}`);
        pages.add(n);
      }
    }
    return Array.from(pages).sort((a, b) => a - b);
  };

  const split = async () => {
    if (!file) return;
    setError(null);
    setWorking(true);
    setProgress(10);
    try {
      const selected = parseRange(range || `1-${pageCount}`, pageCount);
      if (!selected.length) throw new Error("No pages selected.");
      const src = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      const out = await PDFDocument.create();
      for (let i = 0; i < selected.length; i++) {
        const [pg] = await out.copyPages(src, [selected[i] - 1]);
        out.addPage(pg);
        setProgress(10 + ((i + 1) / selected.length) * 85);
      }
      const bytes = await out.save();
      setResult(new Blob([bytes as BlobPart], { type: "application/pdf" }));
      setProgress(100);
    } catch (e: any) {
      setError(e?.message ?? "Failed to split PDF.");
    } finally {
      setWorking(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPageCount(0);
    setRange("");
    setResult(null);
    setError(null);
  };

  return (
    <ToolLayout tool={tool}>
      <div className="space-y-5">
        {!file ? (
          <FileDropzone
            accept="application/pdf,.pdf"
            onFiles={(f) => load(f[0])}
            label="Drop a PDF here"
          />
        ) : (
          <div className="flex items-center gap-3 p-4 bg-[#25211D] border border-[#342821] rounded-lg">
            <div className="w-10 h-10 rounded-md bg-[#191715] flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#C96B4B]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{file.name}</p>
              <p className="text-xs text-[#91887D]">
                {formatBytes(file.size)} • {pageCount} page{pageCount !== 1 ? "s" : ""}
              </p>
            </div>
            <Button size="sm" variant="ghost" onClick={reset}>
              Replace
            </Button>
          </div>
        )}

        {file && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Page range
              </label>
              <input
                type="text"
                value={range}
                onChange={(e) => setRange(e.target.value)}
                placeholder={`e.g. 1, 1-5, 2,4,7, 1-3,8-${pageCount}`}
                className="w-full px-3 py-2 bg-[#11100F] border border-[#342821] rounded-lg text-sm placeholder:text-[#91887D] focus:border-[#C96B4B] outline-none"
              />
              <p className="text-xs text-[#91887D] mt-1.5">
                Leave empty to extract all pages. Separate pages with commas.
              </p>
            </div>
          </>
        )}

        {working && <ProgressBar progress={progress} label="Extracting pages" />}
        {error && <ErrorDisplay message={error} onRetry={reset} />}
        <DownloadResult blob={result} filename="extracted.pdf" label="Download PDF" />

        {file && !working && (
          <Button onClick={split} loading={working}>
            {working ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Extract pages
          </Button>
        )}
      </div>
    </ToolLayout>
  );
}
