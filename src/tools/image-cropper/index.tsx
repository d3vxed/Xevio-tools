import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import {
  ToolLayout,
  FileDropzone,
  Button,
  DownloadResult,
  ErrorDisplay,
} from "../../components/ui";
import { TOOLS_BY_SLUG } from "../registry";
import { RotateCw, ZoomIn, ZoomOut, Loader2 } from "lucide-react";

const ASPECTS: { label: string; value: number | "free" }[] = [
  { label: "Free", value: "free" },
  { label: "Square", value: 1 },
  { label: "16:9", value: 16 / 9 },
  { label: "4:3", value: 4 / 3 },
  { label: "3:2", value: 3 / 2 },
  { label: "9:16", value: 9 / 16 },
];

export default function ImageCropper() {
  const [file, setFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string>("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspect, setAspect] = useState<number | "free">("free");
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const tool = TOOLS_BY_SLUG["image-cropper"];

  const onFile = (f: File) => {
    setError(null);
    setResult(null);
    const url = URL.createObjectURL(f);
    setFile(f);
    setImageSrc(url);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  const onCropComplete = useCallback((_: Area, area: Area) => {
    setCroppedArea(area);
  }, []);

  const getCroppedImg = async (): Promise<Blob> => {
    const img = new Image();
    img.src = imageSrc;
    await new Promise((res) => (img.onload = res));
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    canvas.width = croppedArea!.width;
    canvas.height = croppedArea!.height;
    ctx.drawImage(
      img,
      croppedArea!.x,
      croppedArea!.y,
      croppedArea!.width,
      croppedArea!.height,
      0,
      0,
      croppedArea!.width,
      croppedArea!.height
    );
    return new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b!), "image/png")
    );
  };

  const cropAndDownload = async () => {
    if (!croppedArea) return;
    setError(null);
    setWorking(true);
    try {
      const blob = await getCroppedImg();
      if (result) URL.revokeObjectURL(result.url);
      setResult({ blob, url: URL.createObjectURL(blob) });
    } catch (e: any) {
      setError(e?.message ?? "Crop failed.");
    } finally {
      setWorking(false);
    }
  };

  const reset = () => {
    if (imageSrc) URL.revokeObjectURL(imageSrc);
    if (result) URL.revokeObjectURL(result.url);
    setFile(null);
    setImageSrc("");
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
            label="Drop an image here"
          />
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {ASPECTS.map((a) => (
                <button
                  key={a.label}
                  onClick={() => setAspect(a.value)}
                  className={
                    "px-3 py-1.5 text-xs rounded-md border transition-colors " +
                    (aspect === a.value
                      ? "bg-[#C96B4B]/10 border-[#C96B4B]/50 text-[#E0805C]"
                      : "bg-[#25211D] border-[#342821] hover:border-[#C96B4B]/40")
                  }
                >
                  {a.label}
                </button>
              ))}
            </div>

            <div className="relative w-full aspect-[4/3] bg-[#11100F] border border-[#342821] rounded-lg overflow-hidden">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={aspect === "free" ? undefined : aspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={onCropComplete}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex items-center gap-2">
                <ZoomOut className="w-4 h-4 text-[#91887D]" />
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="flex-1 accent-[#C96B4B]"
                />
                <ZoomIn className="w-4 h-4 text-[#91887D]" />
              </div>
              <div className="flex items-center gap-2">
                <RotateCw className="w-4 h-4 text-[#91887D]" />
                <input
                  type="range"
                  min={0}
                  max={360}
                  value={rotation}
                  onChange={(e) => setRotation(parseInt(e.target.value))}
                  className="flex-1 accent-[#C96B4B]"
                />
                <span className="text-xs text-[#91887D] w-8">{rotation}°</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-[#91887D]">
                  {croppedArea ? `${Math.round(croppedArea.width)} × ${Math.round(croppedArea.height)}` : "—"}
                </span>
              </div>
            </div>
          </>
        )}

        {error && <ErrorDisplay message={error} onRetry={reset} />}
        {result && (
          <DownloadResult blob={result.blob} filename={`cropped-${file?.name ?? "image.png"}`} />
        )}

        {file && (
          <div className="flex gap-2">
            <Button onClick={cropAndDownload} loading={working}>
              {working && <Loader2 className="w-4 h-4 animate-spin" />}
              Crop & Download
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
