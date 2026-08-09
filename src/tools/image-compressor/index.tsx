import { useState } from "react";
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
import { X } from "lucide-react";
import JSZip from "jszip";

type Result = {
  original: File;
  originalSize: number;
  blob: Blob;
  url: string;
};

export default function ImageCompressor() {
  const [files, setFiles] = useState<File[]>([]);
  const [quality, setQuality] = useState(0.7);
  const [maxW, setMaxW] = useState(0);
  const [maxH, setMaxH] = useState(0);
  const [format, setFormat] = useState<"jpeg" | "webp" | "png">("jpeg");
  const [results, setResults] = useState<Result[]>([]);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);
  const [working, setWorking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const tool = TOOLS_BY_SLUG["image-compressor"];

  const onFiles = (incoming: File[]) => {
    const imgs = incoming.filter((f) => f.type.startsWith("image/"));
    if (!imgs.length) {
      setError("Please select image files.");
      return;
    }
    setFiles((prev) => [...prev, ...imgs]);
    setResults([]);
    setError(null);
  };

  const compressFile = (file: File): Promise<Result> =>
    new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (maxW && width > maxW) {
        height = Math.round(height * (maxW / width));
        width = maxW;
      }
      if (maxH && height > maxH) {
        width = Math.round(width * (maxH / height));
        height = maxH;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.imageSmoothingQuality = "high";
      if (format === "jpeg" || format === "webp") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0, width, height);
      const mime = format === "png" ? "image/png" : format === "webp" ? "image/webp" : "image/jpeg";
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Compression failed"));
          resolve({
              original: file,
              originalSize: file.size,
              blob,
              url: URL.createObjectURL(blob),
            });
          },
          mime,
          format === "png" ? undefined : quality
        );
      };
      img.onerror = () => reject(new Error(`Failed to load ${file.name}`));
      img.src = URL.createObjectURL(file);
    });

  const compress = async () => {
    if (!files.length) return;
    setError(null);
    setResults([]);
    setZipBlob(null);
    setWorking(true);
    try {
      const out: Result[] = [];
      for (let i = 0; i < files.length; i++) {
        out.push(await compressFile(files[i]));
        setProgress(((i + 1) / files.length) * 100);
      }
      setResults(out);
      if (out.length > 1) {
        const zip = new JSZip();
        out.forEach((r) =>
          zip.file(r.original.name.replace(/\.[^.]+$/, "") + `.${format === "jpeg" ? "jpg" : format}`, r.blob)
        );
        const zb = await zip.generateAsync({ type: "blob" });
        setZipBlob(zb);
      }
    } catch (e: any) {
      setError(e?.message ?? "Compression failed.");
    } finally {
      setWorking(false);
    }
  };

  const reset = () => {
    results.forEach((r) => URL.revokeObjectURL(r.url));
    setFiles([]);
    setResults([]);
    setZipBlob(null);
    setError(null);
  };

  const totalOriginal = results.reduce((a, r) => a + r.originalSize, 0);
  const totalNew = results.reduce((a, r) => a + r.blob.size, 0);
  const saved = totalOriginal ? Math.round(((totalOriginal - totalNew) / totalOriginal) * 100) : 0;

  return (
    <ToolLayout tool={tool}>
      <div className="space-y-5">
        <FileDropzone
          multiple
          accept="image/jpeg,image/png,image/webp"
          onFiles={onFiles}
          label="Drop images here"
          sublabel="JPG, PNG, WebP"
        />

        {files.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-[#91887D]">{files.length} image{files.length > 1 ? "s" : ""}</p>
              <button onClick={reset} className="text-xs text-[#91887D] hover:text-[#E8E1D5]">
                Clear
              </button>
            </div>
            <div className="space-y-1.5">
              {files.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-2.5 bg-[#25211D] border border-[#342821] rounded-lg"
                >
                  <div className="w-8 h-8 rounded bg-[#11100F] overflow-hidden flex-shrink-0">
                    <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{f.name}</p>
                    <p className="text-xs text-[#91887D]">{formatBytes(f.size)}</p>
                  </div>
                  <button
                    onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                    className="p-1 text-[#91887D] hover:text-[#E8E1D5]"
                    aria-label="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as any)}
              className="w-full px-3 py-2 bg-[#11100F] border border-[#342821] rounded-lg text-sm focus:border-[#C96B4B] outline-none"
            >
              <option value="jpeg">JPG</option>
              <option value="webp">WebP</option>
              <option value="png">PNG</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Quality ({Math.round(quality * 100)}%)
            </label>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={quality}
              disabled={format === "png"}
              onChange={(e) => setQuality(parseFloat(e.target.value))}
              className="w-full accent-[#C96B4B]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Max width</label>
            <input
              type="number"
              value={maxW || ""}
              onChange={(e) => setMaxW(parseInt(e.target.value) || 0)}
              placeholder="No limit"
              className="w-full px-3 py-2 bg-[#11100F] border border-[#342821] rounded-lg text-sm placeholder:text-[#91887D] focus:border-[#C96B4B] outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Max height</label>
            <input
              type="number"
              value={maxH || ""}
              onChange={(e) => setMaxH(parseInt(e.target.value) || 0)}
              placeholder="No limit"
              className="w-full px-3 py-2 bg-[#11100F] border border-[#342821] rounded-lg text-sm placeholder:text-[#91887D] focus:border-[#C96B4B] outline-none"
            />
          </div>
        </div>

        {working && <ProgressBar progress={progress} label="Compressing" />}
        {error && <ErrorDisplay message={error} onRetry={reset} />}

        {results.length > 0 && (
          <div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-[#25211D] border border-[#342821] rounded-lg p-3">
                <p className="text-xs text-[#91887D]">Original</p>
                <p className="text-sm font-medium mt-1">{formatBytes(totalOriginal)}</p>
              </div>
              <div className="bg-[#25211D] border border-[#342821] rounded-lg p-3">
                <p className="text-xs text-[#91887D]">New</p>
                <p className="text-sm font-medium mt-1">{formatBytes(totalNew)}</p>
              </div>
              <div className="bg-[#C96B4B]/10 border border-[#C96B4B]/30 rounded-lg p-3">
                <p className="text-xs text-[#C96B4B]">Reduced</p>
                <p className="text-sm font-medium mt-1">{saved}%</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              {results.map((r, i) => (
                <a
                  key={i}
                  href={r.url}
                  download={r.original.name.replace(/\.[^.]+$/, "") + `.${format === "jpeg" ? "jpg" : format}`}
                  className="bg-[#25211D] border border-[#342821] rounded-lg p-3 hover:border-[#C96B4B]/50"
                >
                  <div className="aspect-square bg-[#11100F] rounded overflow-hidden mb-2">
                    <img src={r.url} alt="" className="w-full h-full object-contain" />
                  </div>
                  <p className="text-xs truncate">{r.original.name}</p>
                  <p className="text-xs text-[#91887D] mt-0.5">
                    {formatBytes(r.originalSize)} → {formatBytes(r.blob.size)}
                  </p>
                </a>
              ))}
            </div>
            {zipBlob && (
              <a href={URL.createObjectURL(zipBlob)} download="compressed.zip">
                <Button>Download all as ZIP</Button>
              </a>
            )}
            {results.length === 1 && (
              <DownloadResult blob={results[0].blob} filename={results[0].original.name} />
            )}
          </div>
        )}

        {files.length > 0 && !working && (
          <Button onClick={compress}>Compress</Button>
        )}
      </div>
    </ToolLayout>
  );
}
