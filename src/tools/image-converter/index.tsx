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

type Out = { file: File; blob: Blob; url: string; name: string };

export default function ImageConverter() {
  const [files, setFiles] = useState<File[]>([]);
  const [format, setFormat] = useState<"jpeg" | "png" | "webp">("webp");
  const [quality, setQuality] = useState(0.92);
  const [results, setResults] = useState<Out[]>([]);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);
  const [working, setWorking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const tool = TOOLS_BY_SLUG["image-converter"];

  const onFiles = (incoming: File[]) => {
    const imgs = incoming.filter((f) => f.type.startsWith("image/"));
    if (!imgs.length) {
      setError("Please select image files.");
      return;
    }
    setFiles(imgs);
    setResults([]);
    setZipBlob(null);
    setError(null);
  };

  const convert = (file: File): Promise<Out> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d")!;
        if (format !== "png") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0);
        const mime = format === "png" ? "image/png" : format === "webp" ? "image/webp" : "image/jpeg";
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Conversion failed"));
            const ext = format === "jpeg" ? "jpg" : format;
            const name = file.name.replace(/\.[^.]+$/, "") + `.${ext}`;
            resolve({ file, blob, url: URL.createObjectURL(blob), name });
          },
          mime,
          format === "png" ? undefined : quality
        );
      };
      img.onerror = () => reject(new Error(`Failed to load ${file.name}`));
      img.src = URL.createObjectURL(file);
    });

  const run = async () => {
    if (!files.length) return;
    setError(null);
    setResults([]);
    setZipBlob(null);
    setWorking(true);
    try {
      const out: Out[] = [];
      for (let i = 0; i < files.length; i++) {
        out.push(await convert(files[i]));
        setProgress(((i + 1) / files.length) * 100);
      }
      setResults(out);
      if (out.length > 1) {
        const zip = new JSZip();
        out.forEach((r) => zip.file(r.name, r.blob));
        const zb = await zip.generateAsync({ type: "blob" });
        setZipBlob(zb);
      }
    } catch (e: any) {
      setError(e?.message ?? "Conversion failed.");
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
                  <span className="text-xs text-[#C96B4B]">→ {format.toUpperCase()}</span>
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">Output format</label>
            <div className="flex gap-2">
              {(["jpeg", "png", "webp"] as const).map((f) => (
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
                  {f === "jpeg" ? "JPG" : f.toUpperCase()}
                </button>
              ))}
            </div>
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
        </div>

        {working && <ProgressBar progress={progress} label="Converting" />}
        {error && <ErrorDisplay message={error} onRetry={reset} />}

        {results.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {results.map((r, i) => (
              <a
                key={i}
                href={r.url}
                download={r.name}
                className="bg-[#25211D] border border-[#342821] rounded-lg p-3 hover:border-[#C96B4B]/50"
              >
                <div className="aspect-square bg-[#11100F] rounded overflow-hidden mb-2">
                  <img src={r.url} alt="" className="w-full h-full object-contain" />
                </div>
                <p className="text-xs truncate">{r.name}</p>
                <p className="text-xs text-[#91887D] mt-0.5">{formatBytes(r.blob.size)}</p>
              </a>
            ))}
          </div>
        )}

        {zipBlob && (
          <a href={URL.createObjectURL(zipBlob)} download="converted.zip">
            <Button>Download all as ZIP</Button>
          </a>
        )}
        {results.length === 1 && (
          <DownloadResult blob={results[0].blob} filename={results[0].name} />
        )}

        {files.length > 0 && !working && (
          <Button onClick={run}>Convert</Button>
        )}
      </div>
    </ToolLayout>
  );
}
