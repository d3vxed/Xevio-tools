import { useState } from "react";
import * as pdfjs from "pdfjs-dist";
// @ts-ignore
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.mjs?url";
import JSZip from "jszip";
import {
  ToolLayout,
  FileDropzone,
  Button,
  ProgressBar,
  ErrorDisplay,
  formatBytes,
} from "../../components/ui";
import { TOOLS_BY_SLUG } from "../registry";
import { FileText, Loader2, Download } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

type Img = { url: string; name: string; blob: Blob };

export default function PDFToImages() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [format, setFormat] = useState<"png" | "jpeg" | "webp">("png");
  const [quality, setQuality] = useState(0.9);
  const [scale, setScale] = useState(1.5);
  const [range, setRange] = useState("");
  const [images, setImages] = useState<Img[]>([]);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);
  const [working, setWorking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const tool = TOOLS_BY_SLUG["pdf-to-images"];

  const load = async (f: File) => {
    setError(null);
    setImages([]);
    setZipBlob(null);
    try {
      const buf = await f.arrayBuffer();
      const doc = await pdfjs.getDocument({ data: buf }).promise;
      setFile(f);
      setPageCount(doc.numPages);
    } catch (e: any) {
      setError("Could not read this PDF.");
    }
  };

  const parseRange = (s: string, total: number): number[] => {
    if (!s.trim()) return Array.from({ length: total }, (_, i) => i + 1);
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

  const convert = async () => {
    if (!file) return;
    setError(null);
    setImages([]);
    setZipBlob(null);
    setWorking(true);
    setProgress(5);
    try {
      const buf = await file.arrayBuffer();
      const doc = await pdfjs.getDocument({ data: buf }).promise;
      const selected = parseRange(range, doc.numPages);
      const out: Img[] = [];
      const mime = format === "jpeg" ? "image/jpeg" : format === "webp" ? "image/webp" : "image/png";
      for (let i = 0; i < selected.length; i++) {
        const page = await doc.getPage(selected[i]);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        if (format !== "png") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        await page.render({ canvas, viewport } as any).promise;
        const blob: Blob = await new Promise((resolve) =>
          canvas.toBlob((b) => resolve(b!), mime, quality)
        );
        const url = URL.createObjectURL(blob);
        out.push({ url, name: `page-${selected[i]}.${format}`, blob });
        setProgress(5 + ((i + 1) / selected.length) * 85);
      }
      setImages(out);
      const zip = new JSZip();
      out.forEach((img) => zip.file(img.name, img.blob));
      const zb = await zip.generateAsync({ type: "blob" });
      setZipBlob(zb);
      setProgress(100);
    } catch (e: any) {
      setError(e?.message ?? "Failed to convert PDF.");
    } finally {
      setWorking(false);
    }
  };

  const reset = () => {
    images.forEach((i) => URL.revokeObjectURL(i.url));
    setFile(null);
    setImages([]);
    setZipBlob(null);
    setPageCount(0);
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Format</label>
                <div className="flex gap-2">
                  {(["png", "jpeg", "webp"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFormat(f)}
                      className={
                        "flex-1 px-3 py-2 rounded-lg border text-sm uppercase transition-colors " +
                        (format === f
                          ? "bg-[#C96B4B]/10 border-[#C96B4B]/50 text-[#E0805C]"
                          : "bg-[#25211D] border-[#342821] hover:border-[#C96B4B]/40")
                      }
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Quality {format !== "png" && `(${Math.round(quality * 100)}%)`}
                </label>
                <input
                  type="range"
                  min={0.3}
                  max={1}
                  step={0.05}
                  value={quality}
                  disabled={format === "png"}
                  onChange={(e) => setQuality(parseFloat(e.target.value))}
                  className="w-full accent-[#C96B4B]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Scale ({scale}x)
              </label>
              <input
                type="range"
                min={0.5}
                max={3}
                step={0.25}
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full accent-[#C96B4B]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Page range</label>
              <input
                type="text"
                value={range}
                onChange={(e) => setRange(e.target.value)}
                placeholder={`1-${pageCount} (empty = all)`}
                className="w-full px-3 py-2 bg-[#11100F] border border-[#342821] rounded-lg text-sm placeholder:text-[#91887D] focus:border-[#C96B4B] outline-none"
              />
            </div>
          </>
        )}

        {working && <ProgressBar progress={progress} label="Rendering pages" />}
        {error && <ErrorDisplay message={error} onRetry={reset} />}

        {images.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {images.map((img) => (
                <a
                  key={img.name}
                  href={img.url}
                  download={img.name}
                  className="group block bg-[#25211D] border border-[#342821] rounded-lg overflow-hidden hover:border-[#C96B4B]/50 transition-colors"
                >
                  <div className="aspect-[3/4] bg-[#11100F] flex items-center justify-center">
                    <img src={img.url} alt={img.name} className="max-h-full max-w-full" />
                  </div>
                  <div className="p-2 flex items-center justify-between">
                    <p className="text-xs truncate">{img.name}</p>
                    <Download className="w-3.5 h-3.5 text-[#91887D] group-hover:text-[#C96B4B]" />
                  </div>
                </a>
              ))}
            </div>
            {zipBlob && (
              <a href={URL.createObjectURL(zipBlob)} download="images.zip">
                <Button>Download all as ZIP</Button>
              </a>
            )}
          </>
        )}

        {file && !working && images.length === 0 && (
          <Button onClick={convert} loading={working}>
            {working && <Loader2 className="w-4 h-4 animate-spin" />}
            Convert to images
          </Button>
        )}
      </div>
    </ToolLayout>
  );
}
