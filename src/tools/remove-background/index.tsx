import { useState, useEffect } from "react";
import {
  ToolLayout,
  FileDropzone,
  Button,
  DownloadResult,
  ProgressBar,
  ErrorDisplay,
} from "../../components/ui";
import { TOOLS_BY_SLUG } from "../registry";
import { Loader2, Eraser } from "lucide-react";
import { removeBackground, type Config } from "@imgly/background-removal";

type Quality = "fast" | "balanced" | "high";

const QUALITY_MODEL: Record<Quality, Config["model"]> = {
  fast: "isnet_quint8",
  balanced: "isnet_fp16",
  high: "isnet",
};

export default function RemoveBackground() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null);
  const [working, setWorking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("Removing background");
  const [error, setError] = useState<string | null>(null);
  const [quality, setQuality] = useState<Quality>("balanced");
  const tool = TOOLS_BY_SLUG["remove-background"];

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

  // Real subject segmentation (ISNet neural network), runs fully client-side
  // via WASM/ONNX. Replaces the old flood-fill approach, which only matched
  // background by color and had no concept of "person" vs "background".
  const doRemoveBackground = async () => {
    if (!file) return;
    setError(null);
    setWorking(true);
    setProgress(0);
    setProgressLabel("Loading model");

    try {
      const blob = await removeBackground(file, {
        model: QUALITY_MODEL[quality],
        output: { format: "image/png", quality: 1 },
        progress: (key, current, total) => {
          const pct = total > 0 ? Math.round((current / total) * 100) : 0;
          setProgressLabel(key.startsWith("fetch") ? "Downloading model" : "Processing image");
          setProgress(pct);
        },
      });

      if (result) URL.revokeObjectURL(result.url);
      setResult({ blob, url: URL.createObjectURL(blob) });
      setProgress(100);
      setWorking(false);
    } catch (e: any) {
      setError(e?.message ?? "Background removal failed.");
      setWorking(false);
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
            label="Drop an image here"
            sublabel="Works with any photo — portraits, products, complex backgrounds"
          />
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xs text-[#91887D] uppercase tracking-wider">Original</p>
                <div className="aspect-square bg-[#11100F] border border-[#342821] rounded-lg overflow-hidden flex items-center justify-center">
                  <img src={preview} alt="" className="max-w-full max-h-full object-contain" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-[#91887D] uppercase tracking-wider">Result</p>
                <div
                  className="aspect-square border border-[#342821] rounded-lg overflow-hidden flex items-center justify-center"
                  style={{
                    background: result
                      ? "repeating-conic-gradient(#342821 0% 25%, #11100F 0% 50%) 50% / 24px 24px"
                      : "#11100F",
                  }}
                >
                  {result ? (
                    <img src={result.url} alt="" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <div className="text-sm text-[#91887D]">Click "Remove background"</div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Quality</label>
              <div className="flex gap-2">
                {(["fast", "balanced", "high"] as Quality[]).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuality(q)}
                    disabled={working}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors capitalize ${
                      quality === q
                        ? "bg-[#C96B4B] border-[#C96B4B] text-white"
                        : "bg-[#11100F] border-[#342821] text-[#91887D] hover:border-[#C96B4B]/50"
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
              <p className="text-xs text-[#91887D] mt-1.5">
                Higher quality gives cleaner edges (hair, fine detail) but is slower and downloads a
                larger model on first use.
              </p>
            </div>
          </>
        )}

        {working && <ProgressBar progress={progress} label={progressLabel} />}
        {error && <ErrorDisplay message={error} onRetry={reset} />}
        {result && <DownloadResult blob={result.blob} filename="no-background.png" />}

        {file && !working && (
          <div className="flex gap-2">
            <Button onClick={doRemoveBackground} loading={working}>
              {working && <Loader2 className="w-4 h-4 animate-spin" />}
              <Eraser className="w-4 h-4" />
              Remove background
            </Button>
            <Button variant="outline" onClick={reset}>
              Replace
            </Button>
          </div>
        )}

        <p className="text-xs text-[#91887D]">
          This tool runs entirely in your browser using an on-device AI segmentation model. The
          first run downloads the model (cached afterward); your image is never uploaded anywhere.
        </p>
      </div>
    </ToolLayout>
  );
}
