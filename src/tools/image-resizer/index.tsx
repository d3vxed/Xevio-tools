import { useState, useEffect, useRef } from "react";
import {
  ToolLayout,
  FileDropzone,
  Button,
  DownloadResult,
  ErrorDisplay,
  formatBytes,
} from "../../components/ui";
import { TOOLS_BY_SLUG } from "../registry";
import { Link2, Unlink, RotateCw, Loader2 } from "lucide-react";

const PRESETS: { label: string; w: number; h: number }[] = [
  { label: "1080 × 1080", w: 1080, h: 1080 },
  { label: "1920 × 1080", w: 1920, h: 1080 },
  { label: "1080 × 1920", w: 1080, h: 1920 },
  { label: "1200 × 630", w: 1200, h: 630 },
  { label: "2560 × 1440", w: 2560, h: 1440 },
  { label: "1024 × 768", w: 1024, h: 768 },
];

export default function ImageResizer() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [original, setOriginal] = useState<{ w: number; h: number } | null>(null);
  const [w, setW] = useState<number>(0);
  const [h, setH] = useState<number>(0);
  const [lock, setLock] = useState(true);
  const [rotation, setRotation] = useState(0);
  const [quality, setQuality] = useState(0.92);
  const [format, setFormat] = useState<"jpeg" | "png" | "webp">("jpeg");
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tool = TOOLS_BY_SLUG["image-resizer"];

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
      if (result) URL.revokeObjectURL(result.url);
    };
  }, [preview, result]);

  const onFile = (f: File) => {
    setError(null);
    setResult(null);
    const url = URL.createObjectURL(f);
    setPreview(url);
    setFile(f);
    const img = new Image();
    img.onload = () => {
      setOriginal({ w: img.naturalWidth, h: img.naturalHeight });
      setW(img.naturalWidth);
      setH(img.naturalHeight);
    };
    img.src = url;
  };

  const setWidth = (v: number) => {
    setW(v);
    if (lock && original) setH(Math.round(v * (original.h / original.w)));
  };
  const setHeight = (v: number) => {
    setH(v);
    if (lock && original) setW(Math.round(v * (original.w / original.h)));
  };

  const resize = async () => {
    if (!file || !original || !w || !h) return;
    setError(null);
    setWorking(true);
    try {
      const img = new Image();
      img.src = preview!;
      await new Promise((res) => (img.onload = res));
      const canvas = canvasRef.current || document.createElement("canvas");
      const swap = rotation === 90 || rotation === 270;
      canvas.width = swap ? h : w;
      canvas.height = swap ? w : h;
      const ctx = canvas.getContext("2d")!;
      ctx.imageSmoothingQuality = "high";
      if (format !== "png") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      const mime = format === "png" ? "image/png" : format === "webp" ? "image/webp" : "image/jpeg";
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setError("Resize failed.");
            return;
          }
          if (result) URL.revokeObjectURL(result.url);
          setResult({ blob, url: URL.createObjectURL(blob) });
          setWorking(false);
        },
        mime,
        quality
      );
    } catch (e: any) {
      setError(e?.message ?? "Resize failed.");
      setWorking(false);
    }
  };

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    if (result) URL.revokeObjectURL(result.url);
    setFile(null);
    setPreview("");
    setOriginal(null);
    setW(0);
    setH(0);
    setResult(null);
    setError(null);
    setRotation(0);
  };

  return (
    <ToolLayout tool={tool}>
      <div className="space-y-5">
        {!file ? (
          <FileDropzone
            accept="image/*"
            onFiles={(f) => onFile(f[0])}
            label="Drop an image here"
          />
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-[#11100F] border border-[#342821] rounded-lg p-3">
              <p className="text-xs text-[#91887D] mb-2">
                Original: {original?.w} × {original?.h} • {file && formatBytes(file.size)}
              </p>
              <div className="aspect-video bg-[#191715] rounded flex items-center justify-center overflow-hidden">
                <img src={preview} alt="" className="max-w-full max-h-full object-contain" />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Preset sizes</label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESETS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => {
                        setW(p.w);
                        if (lock && original) setH(Math.round(p.w * (original.h / original.w)));
                        else setH(p.h);
                      }}
                      className="px-2 py-1 text-xs bg-[#25211D] border border-[#342821] rounded hover:border-[#C96B4B]/40"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Width</label>
                  <input
                    type="number"
                    value={w}
                    onChange={(e) => setWidth(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-[#11100F] border border-[#342821] rounded-lg text-sm focus:border-[#C96B4B] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Height</label>
                  <input
                    type="number"
                    value={h}
                    onChange={(e) => setHeight(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-[#11100F] border border-[#342821] rounded-lg text-sm focus:border-[#C96B4B] outline-none"
                  />
                </div>
              </div>

              <button
                onClick={() => setLock(!lock)}
                className="inline-flex items-center gap-2 text-xs text-[#91887D] hover:text-[#E8E1D5]"
              >
                {lock ? <Link2 className="w-3.5 h-3.5" /> : <Unlink className="w-3.5 h-3.5" />}
                {lock ? "Aspect ratio locked" : "Aspect ratio unlocked"}
              </button>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Rotation ({rotation}°)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={360}
                    value={rotation}
                    onChange={(e) => setRotation(parseInt(e.target.value))}
                    className="flex-1 accent-[#C96B4B]"
                  />
                  <button
                    onClick={() => setRotation((rotation + 90) % 360)}
                    className="p-2 bg-[#25211D] border border-[#342821] rounded-lg"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Format</label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#11100F] border border-[#342821] rounded-lg text-sm focus:border-[#C96B4B] outline-none"
                  >
                    <option value="jpeg">JPG</option>
                    <option value="png">PNG</option>
                    <option value="webp">WebP</option>
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
              </div>
            </div>
          </div>
        )}

        {error && <ErrorDisplay message={error} onRetry={reset} />}
        {result && (
          <DownloadResult blob={result.blob} filename={`resized-${file?.name}`} />
        )}

        <canvas ref={canvasRef} className="hidden" />

        {file && (
          <div className="flex gap-2">
            <Button onClick={resize} loading={working}>
              {working && <Loader2 className="w-4 h-4 animate-spin" />}
              Resize & Download
            </Button>
            <Button variant="outline" onClick={reset}>
              Replace
            </Button>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
