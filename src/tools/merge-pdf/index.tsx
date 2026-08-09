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
import { GripVertical } from "lucide-react";

export default function MergePDF() {
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<Blob | null>(null);
  const [progress, setProgress] = useState(0);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tool = TOOLS_BY_SLUG["merge-pdf"];

  const onFiles = (incoming: File[]) => {
    const pdfs = incoming.filter((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
    if (!pdfs.length) {
      setError("Please select PDF files only.");
      return;
    }
    setFiles((prev) => [...prev, ...pdfs]);
    setResult(null);
    setError(null);
  };

  const move = (from: number, to: number) => {
    setFiles((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const merge = async () => {
    if (files.length < 2) {
      setError("Please add at least 2 PDFs to merge.");
      return;
    }
    setError(null);
    setWorking(true);
    setProgress(10);
    try {
      const out = await PDFDocument.create();
      for (let i = 0; i < files.length; i++) {
        const buf = await files[i].arrayBuffer();
        const src = await PDFDocument.load(buf, { ignoreEncryption: true });
        const pages = await out.copyPages(src, src.getPageIndices());
        pages.forEach((p) => out.addPage(p));
        setProgress(10 + ((i + 1) / files.length) * 80);
      }
      const bytes = await out.save();
      setResult(new Blob([bytes as BlobPart], { type: "application/pdf" }));
      setProgress(100);
    } catch (e: any) {
      setError(e?.message ?? "Failed to merge PDFs.");
    } finally {
      setWorking(false);
    }
  };

  const reset = () => {
    setFiles([]);
    setResult(null);
    setError(null);
    setProgress(0);
  };

  return (
    <ToolLayout tool={tool}>
      <div className="space-y-5">
        <FileDropzone
          onFiles={onFiles}
          multiple
          accept="application/pdf,.pdf"
          label="Drop PDF files here"
          sublabel="You can add multiple PDFs to merge them in order"
        />

        {files.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#91887D]">
                {files.length} file{files.length > 1 ? "s" : ""} •{" "}
                {formatBytes(files.reduce((a, f) => a + f.size, 0))}
              </p>
              <button
                onClick={reset}
                className="text-xs text-[#91887D] hover:text-[#E8E1D5]"
              >
                Clear all
              </button>
            </div>
            <div className="space-y-1.5">
              {files.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-2.5 bg-[#25211D] border border-[#342821] rounded-lg group"
                >
                  <div className="flex flex-col gap-0.5">
                    <button
                      disabled={i === 0}
                      onClick={() => move(i, i - 1)}
                      className="p-0.5 text-[#91887D] hover:text-[#E8E1D5] disabled:opacity-30"
                      aria-label="Move up"
                    >
                      <GripVertical className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-xs text-[#91887D] w-5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{f.name}</p>
                    <p className="text-xs text-[#91887D]">{formatBytes(f.size)}</p>
                  </div>
                  <button
                    onClick={() => setFiles((p) => p.filter((_, idx) => idx !== i))}
                    className="text-xs text-[#91887D] hover:text-[#E8E1D5]"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {working && <ProgressBar progress={progress} label="Merging PDFs" />}
        {error && <ErrorDisplay message={error} onRetry={reset} />}
        <DownloadResult blob={result} filename="merged.pdf" label="Download merged PDF" />

        {files.length >= 2 && !working && (
          <div className="flex gap-2">
            <Button onClick={merge}>Merge PDFs</Button>
            <Button variant="outline" onClick={reset}>
              Reset
            </Button>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
