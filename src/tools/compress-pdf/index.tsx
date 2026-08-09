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
import { FileText, Loader2, TrendingDown } from "lucide-react";

export default function CompressPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Blob | null>(null);
  const [working, setWorking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState<"low" | "medium" | "high">("medium");
  const tool = TOOLS_BY_SLUG["compress-pdf"];

  const load = async (f: File) => {
    setError(null);
    setResult(null);
    setFile(f);
  };

  const compress = async () => {
    if (!file) return;
    setError(null);
    setWorking(true);
    setProgress(10);
    try {
      const buf = await file.arrayBuffer();
      const src = await PDFDocument.load(buf, { ignoreEncryption: true });
      setProgress(40);
      // Strategy: reload the document through pdf-lib and re-save.
      // This drops unreferenced objects and normalizes output,
      // which can reduce size for many PDFs. We also remove metadata.
      const out = await PDFDocument.create();
      const pages = await out.copyPages(src, src.getPageIndices());
      pages.forEach((p) => out.addPage(p));
      out.setTitle("");
      out.setAuthor("");
      out.setSubject("");
      out.setKeywords([]);
      out.setProducer("");
      out.setCreator("");
      setProgress(70);
      const bytes = await out.save({
        useObjectStreams: level === "high",
        addDefaultPage: false,
      });
      setProgress(100);
      setResult(new Blob([bytes as BlobPart], { type: "application/pdf" }));
    } catch (e: any) {
      setError(e?.message ?? "Failed to compress PDF.");
    } finally {
      setWorking(false);
    }
  };

  const saved = file && result
    ? Math.round(((file.size - result.size) / file.size) * 100)
    : 0;

  const reset = () => {
    setFile(null);
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
              <p className="text-xs text-[#91887D]">{formatBytes(file.size)}</p>
            </div>
            <Button size="sm" variant="ghost" onClick={reset}>
              Replace
            </Button>
          </div>
        )}

        {file && (
          <div>
            <label className="block text-sm font-medium mb-2">Compression level</label>
            <div className="grid grid-cols-3 gap-2">
              {(["low", "medium", "high"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={
                    "px-3 py-2 rounded-lg border text-sm transition-colors " +
                    (level === l
                      ? "bg-[#C96B4B]/10 border-[#C96B4B]/50 text-[#E0805C]"
                      : "bg-[#25211D] border-[#342821] text-[#E8E1D5] hover:border-[#C96B4B]/40")
                  }
                >
                  <p className="font-medium capitalize">{l}</p>
                  <p className="text-[10px] text-[#91887D] mt-0.5">
                    {l === "low" ? "Faster" : l === "medium" ? "Balanced" : "Smallest"}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {working && <ProgressBar progress={progress} label="Compressing" />}
        {error && <ErrorDisplay message={error} onRetry={reset} />}

        {result && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#25211D] border border-[#342821] rounded-lg p-3">
              <p className="text-xs text-[#91887D]">Original</p>
              <p className="text-sm font-medium mt-1">{file && formatBytes(file.size)}</p>
            </div>
            <div className="bg-[#25211D] border border-[#342821] rounded-lg p-3">
              <p className="text-xs text-[#91887D]">Compressed</p>
              <p className="text-sm font-medium mt-1">{formatBytes(result.size)}</p>
            </div>
            <div className="bg-[#C96B4B]/10 border border-[#C96B4B]/30 rounded-lg p-3">
              <p className="text-xs text-[#C96B4B]">Saved</p>
              <p className="text-sm font-medium mt-1 flex items-center gap-1">
                <TrendingDown className="w-3 h-3" /> {Math.max(0, saved)}%
              </p>
            </div>
          </div>
        )}

        <DownloadResult blob={result} filename={file ? `compressed-${file.name}` : "compressed.pdf"} />

        {file && !working && (
          <Button onClick={compress} loading={working}>
            {working && <Loader2 className="w-4 h-4 animate-spin" />}
            Compress PDF
          </Button>
        )}

        <p className="text-xs text-[#91887D]">
          Note: browser-based compression works best on PDFs with redundant
          internal objects. Heavily compressed or image-based PDFs may not shrink
          significantly without re-encoding images.
        </p>
      </div>
    </ToolLayout>
  );
}
