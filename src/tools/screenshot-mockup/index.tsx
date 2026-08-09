import { useState, useRef, useEffect } from "react";
import {
  ToolLayout,
  FileDropzone,
  Button,
  ErrorDisplay,
} from "../../components/ui";
import { TOOLS_BY_SLUG } from "../registry";
import { Monitor, Smartphone, Tablet, Laptop, Globe } from "lucide-react";

type Device = "desktop" | "laptop" | "tablet" | "phone" | "browser";

export default function ScreenshotMockup() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [device, setDevice] = useState<Device>("desktop");
  const [bg, setBg] = useState("#11100F");
  const [padding, setPadding] = useState(48);
  const [radius, setRadius] = useState(12);
  const [shadow, setShadow] = useState(true);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [format, setFormat] = useState<"png" | "webp">("png");
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tool = TOOLS_BY_SLUG["screenshot-mockup"];

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
      if (result) URL.revokeObjectURL(result.url);
    };
  }, [preview, result]);

  const onFile = (f: File) => {
    setError(null);
    setResult(null);
    setPreview(URL.createObjectURL(f));
    setFile(f);
  };

  const getFrame = (device: Device) => {
    const frames: Record<Device, { w: number; h: number; barH: number; rounded: number; bezel: number }> = {
      desktop: { w: 1280, h: 800, barH: 32, rounded: 14, bezel: 16 },
      laptop: { w: 1280, h: 800, barH: 28, rounded: 12, bezel: 14 },
      tablet: { w: 800, h: 1100, barH: 28, rounded: 28, bezel: 22 },
      phone: { w: 380, h: 780, barH: 30, rounded: 40, bezel: 16 },
      browser: { w: 1200, h: 780, barH: 32, rounded: 8, bezel: 0 },
    };
    return frames[device];
  };

  const render = async () => {
    if (!file) return;
    setError(null);
    try {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      const img = new Image();
      img.src = preview;
      await new Promise((res) => (img.onload = res));

      const frame = getFrame(device);
      const contentW = frame.w - frame.bezel * 2;
      const contentH = frame.h - frame.bezel * 2 - frame.barH;
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const contentRatio = contentW / contentH;
      let drawW: number, drawH: number;
      if (imgRatio > contentRatio) {
        drawW = contentW;
        drawH = contentW / imgRatio;
      } else {
        drawH = contentH;
        drawW = contentH * imgRatio;
      }

      const totalW = frame.w + padding * 2;
      const totalH = frame.h + padding * 2;
      canvas.width = totalW;
      canvas.height = totalH;

      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, totalW, totalH);

      ctx.save();
      ctx.translate(totalW / 2, totalH / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(scale, scale);

      const fx = -frame.w / 2;
      const fy = -frame.h / 2;

      if (shadow) {
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 40;
        ctx.shadowOffsetY = 20;
      }

      // Outer frame
      if (device === "browser") {
        ctx.fillStyle = "#1a1a1a";
        roundRect(ctx, fx, fy, frame.w, frame.h, frame.rounded);
        ctx.fill();
        // Browser bar
        ctx.fillStyle = "#2a2a2a";
        roundRect(ctx, fx, fy, frame.w, frame.barH, frame.rounded, true);
        ctx.fill();
      } else if (device === "desktop" || device === "laptop") {
        ctx.fillStyle = "#1a1a1a";
        roundRect(ctx, fx, fy, frame.w, frame.h, frame.rounded);
        ctx.fill();
        // Screen bezel
        ctx.fillStyle = "#000";
        roundRect(ctx, fx + frame.bezel, fy + frame.bezel, frame.w - frame.bezel * 2, frame.h - frame.bezel * 2, 4);
        ctx.fill();
        // Address bar
        ctx.fillStyle = "#25211D";
        roundRect(ctx, fx + frame.bezel, fy + frame.bezel, frame.w - frame.bezel * 2, frame.barH, 0);
        ctx.fill();
        // Stand
        if (device === "desktop") {
          ctx.fillStyle = "#1a1a1a";
          ctx.fillRect(fx + frame.w / 2 - 40, fy + frame.h + 4, 80, 8);
          ctx.fillRect(fx + frame.w / 2 - 60, fy + frame.h + 12, 120, 6);
        }
      } else if (device === "tablet" || device === "phone") {
        ctx.fillStyle = "#1a1a1a";
        roundRect(ctx, fx, fy, frame.w, frame.h, frame.rounded);
        ctx.fill();
        ctx.fillStyle = "#000";
        roundRect(ctx, fx + frame.bezel, fy + frame.bezel, frame.w - frame.bezel * 2, frame.h - frame.bezel * 2, 6);
        ctx.fill();
        // Status bar
        ctx.fillStyle = "#25211D";
        ctx.fillRect(fx + frame.bezel, fy + frame.bezel, frame.w - frame.bezel * 2, frame.barH);
      }
      ctx.shadowColor = "transparent";

      // Screenshot
      const sx = fx + frame.bezel;
      const sy = fy + frame.bezel + frame.barH;
      ctx.drawImage(img, sx + (contentW - drawW) / 2, sy + (contentH - drawH) / 2, drawW, drawH);

      ctx.restore();

      const mime = format === "webp" ? "image/webp" : "image/png";
      canvas.toBlob((blob) => {
        if (!blob) {
          setError("Failed to render.");
          return;
        }
        if (result) URL.revokeObjectURL(result.url);
        setResult({ blob, url: URL.createObjectURL(blob) });
      }, mime, 0.95);
    } catch (e: any) {
      setError(e?.message ?? "Render failed.");
    }
  };

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    if (result) URL.revokeObjectURL(result.url);
    setFile(null);
    setPreview("");
    setResult(null);
    setError(null);
  };

  return (
    <ToolLayout tool={tool}>
      <div className="space-y-5">
        {!file ? (
          <FileDropzone
            accept="image/*"
            onFiles={(f) => onFile(f[0])}
            label="Drop a screenshot here"
          />
        ) : (
          <div className="grid md:grid-cols-[1fr_320px] gap-5">
            <div className="bg-[#11100F] border border-[#342821] rounded-xl p-4 overflow-auto">
              <div
                className="mx-auto"
                style={{
                  maxWidth: "100%",
                  background: bg,
                  borderRadius: `${radius}px`,
                }}
              >
                <div
                  style={{
                    padding: `${padding}px`,
                    background: bg,
                    borderRadius: `${radius}px`,
                  }}
                >
                  <DevicePreview device={device} src={preview} shadow={shadow} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Device</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(["desktop", "laptop", "tablet", "phone", "browser"] as Device[]).map((d) => {
                    const Icon = d === "desktop" ? Monitor : d === "laptop" ? Laptop : d === "tablet" ? Tablet : d === "phone" ? Smartphone : Globe;
                    return (
                      <button
                        key={d}
                        onClick={() => setDevice(d)}
                        className={
                          "p-2 rounded-lg border flex flex-col items-center gap-1 transition-colors " +
                          (device === d
                            ? "bg-[#C96B4B]/10 border-[#C96B4B]/50 text-[#E0805C]"
                            : "bg-[#25211D] border-[#342821] text-[#91887D] hover:border-[#C96B4B]/40")
                        }
                        title={d}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[10px] capitalize">{d}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Background</label>
                <div className="flex gap-2">
                  {["#11100F", "#191715", "#25211D", "#C96B4B", "#E8E1D5"].map((c) => (
                    <button
                      key={c}
                      onClick={() => setBg(c)}
                      className={
                        "w-8 h-8 rounded-md border-2 transition-all " +
                        (bg === c ? "border-[#C96B4B] scale-110" : "border-[#342821]")
                      }
                      style={{ backgroundColor: c }}
                      aria-label={c}
                    />
                  ))}
                  <input
                    type="color"
                    value={bg}
                    onChange={(e) => setBg(e.target.value)}
                    className="w-8 h-8 rounded-md border border-[#342821] bg-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Padding ({padding}px)
                </label>
                <input
                  type="range"
                  min={0}
                  max={120}
                  value={padding}
                  onChange={(e) => setPadding(parseInt(e.target.value))}
                  className="w-full accent-[#C96B4B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Corner ({radius}px)
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={48}
                    value={radius}
                    onChange={(e) => setRadius(parseInt(e.target.value))}
                    className="w-full accent-[#C96B4B]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Rotation ({rotation}°)
                  </label>
                  <input
                    type="range"
                    min={-30}
                    max={30}
                    value={rotation}
                    onChange={(e) => setRotation(parseInt(e.target.value))}
                    className="w-full accent-[#C96B4B]"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={shadow}
                    onChange={(e) => setShadow(e.target.checked)}
                    className="accent-[#C96B4B]"
                  />
                  Drop shadow
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Format</label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#11100F] border border-[#342821] rounded-lg text-sm focus:border-[#C96B4B] outline-none"
                  >
                    <option value="png">PNG</option>
                    <option value="webp">WebP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Scale ({scale.toFixed(2)}×)
                  </label>
                  <input
                    type="range"
                    min={0.5}
                    max={1.5}
                    step={0.05}
                    value={scale}
                    onChange={(e) => setScale(parseFloat(e.target.value))}
                    className="w-full accent-[#C96B4B]"
                  />
                </div>
              </div>

              <Button onClick={render} className="w-full">
                Generate
              </Button>
              <Button variant="outline" className="w-full" onClick={reset}>
                Replace image
              </Button>
            </div>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />

        {error && <ErrorDisplay message={error} onRetry={reset} />}
        {result && (
          <div className="flex flex-col gap-3 p-4 bg-[#25211D] border border-[#C96B4B]/20 rounded-lg">
            <div className="flex-1">
              <img src={result.url} alt="Mockup" className="max-w-full rounded-md" />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-[#91887D]">
                Mockup ready ({formatBytes(result.blob.size)})
              </span>
              <a href={result.url} download={`mockup.${format}`}>
                <Button>Download</Button>
              </a>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function DevicePreview({
  device,
  src,
  shadow,
}: {
  device: Device;
  src: string;
  shadow: boolean;
}) {
  const sizes: Record<Device, string> = {
    desktop: "max-width: 720px",
    laptop: "max-width: 640px",
    tablet: "max-width: 360px",
    phone: "max-width: 200px",
    browser: "max-width: 640px",
  };
  return (
    <div
      className="relative mx-auto bg-[#1a1a1a] rounded-xl overflow-hidden"
      style={{ maxWidth: sizes[device], boxShadow: shadow ? "0 30px 60px rgba(0,0,0,0.5)" : "none" }}
    >
      {/* Top bar */}
      <div className="h-7 bg-[#25211D] border-b border-[#342821] flex items-center gap-1.5 px-3">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#91887D]" />
          <div className="w-2 h-2 rounded-full bg-[#91887D]" />
          <div className="w-2 h-2 rounded-full bg-[#91887D]" />
        </div>
        {device === "browser" && (
          <div className="flex-1 mx-2 h-4 bg-[#11100F] rounded px-2 text-[10px] text-[#91887D] flex items-center">
            https://yoursite.com
          </div>
        )}
      </div>
      <img src={src} alt="" className="w-full block" />
    </div>
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  topOnly?: boolean
) {
  ctx.beginPath();
  if (topOnly) {
    ctx.moveTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
  } else {
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}
