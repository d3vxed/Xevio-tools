import { useState } from "react";
import { jsPDF } from "jspdf";
import {
  ToolLayout,
  FileDropzone,
  Button,
  DownloadResult,
  ErrorDisplay,
} from "../../components/ui";
import { TOOLS_BY_SLUG } from "../registry";
import { Loader2, RotateCw, X } from "lucide-react";

type Item = { file: File; url: string; rotation: number };

export default function ImagesToPDF() {
  const [items, setItems] = useState<Item[]>([]);
  const [pageSize, setPageSize] = useState<"a4" | "letter" | "fit">("a4");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [margin, setMargin] = useState(10);
  const [result, setResult] = useState<Blob | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tool = TOOLS_BY_SLUG["images-to-pdf"];

  const onFiles = (files: File[]) => {
    const imgs = files.filter((f) =>
      ["image/jpeg", "image/png", "image/webp"].includes(f.type) ||
      /\.(jpe?g|png|webp)$/i.test(f.name)
    );
    if (!imgs.length) {
      setError("Please select JPG, PNG or WebP images.");
      return;
    }
    const items: Item[] = imgs.map((f) => ({
      file: f,
      url: URL.createObjectURL(f),
      rotation: 0,
    }));
    setItems((prev) => [...prev, ...items]);
    setResult(null);
    setError(null);
  };

  const rotate = (i: number) => {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, rotation: (it.rotation + 90) % 360 } : it)));
  };

  const remove = (i: number) => {
    setItems((prev) => {
      const it = prev[i];
      URL.revokeObjectURL(it.url);
      return prev.filter((_, idx) => idx !== i);
    });
  };



  const imgToMime = (name: string) =>
    /\.png$/i.test(name) ? "image/png" : /\.webp$/i.test(name) ? "image/webp" : "image/jpeg";

  const loadImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });

  const generate = async () => {
    if (!items.length) return;
    setError(null);
    setWorking(true);
    try {
      const firstImg = await loadImage(items[0].url);
      const doc = new jsPDF({
        orientation,
        unit: "mm",
        format: pageSize === "fit" ? [
          (items[0].file.name.toLowerCase().endsWith(".png") ? firstImg.width : firstImg.width) * 0.264583,
          (items[0].file.name.toLowerCase().endsWith(".png") ? firstImg.height : firstImg.height) * 0.264583,
        ] : pageSize,
      });

      for (let i = 0; i < items.length; i++) {
        if (i > 0) {
          if (pageSize === "fit") {
            const img = await loadImage(items[i].url);
            doc.addPage([img.width * 0.264583, img.height * 0.264583], orientation);
          } else {
            doc.addPage(pageSize, orientation);
          }
        }
        const item = items[i];
        const img = await loadImage(item.url);
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();
        const availW = pageW - margin * 2;
        const availH = pageH - margin * 2;
        let w = img.width * 0.264583;
        let h = img.height * 0.264583;
        const ratio = Math.min(availW / w, availH / h);
        w *= ratio;
        h *= ratio;
        const x = (pageW - w) / 2;
        const y = (pageH - h) / 2;
        const mime = imgToMime(item.file.name);
        if (item.rotation !== 0) {
          // Rotate canvas via jsPDF transformation isn't trivial — draw via canvas
          const canvas = document.createElement("canvas");
          const swap = item.rotation === 90 || item.rotation === 270;
          canvas.width = swap ? img.height : img.width;
          canvas.height = swap ? img.width : img.height;
          const ctx = canvas.getContext("2d")!;
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((item.rotation * Math.PI) / 180);
          ctx.drawImage(img, -img.width / 2, -img.height / 2);
          const dataUrl = canvas.toDataURL(mime, 0.92);
          const rw = canvas.width * 0.264583;
          const rh = canvas.height * 0.264583;
          const rr = Math.min(availW / rw, availH / rh);
          const fw = rw * rr;
          const fh = rh * rr;
          doc.addImage(dataUrl, "JPEG", (pageW - fw) / 2, (pageH - fh) / 2, fw, fh);
        } else {
          doc.addImage(item.url, mime as "JPEG", x, y, w, h);
        }
      }
      const out = doc.output("blob");
      setResult(out);
    } catch (e: any) {
      setError(e?.message ?? "Failed to build PDF.");
    } finally {
      setWorking(false);
    }
  };

  const reset = () => {
    items.forEach((i) => URL.revokeObjectURL(i.url));
    setItems([]);
    setResult(null);
    setError(null);
  };

  return (
    <ToolLayout tool={tool}>
      <div className="space-y-5">
        <FileDropzone
          multiple
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          onFiles={onFiles}
          label="Drop images here"
          sublabel="JPG, PNG or WebP"
        />

        {items.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Page size</label>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#11100F] border border-[#342821] rounded-lg text-sm focus:border-[#C96B4B] outline-none"
                >
                  <option value="a4">A4</option>
                  <option value="letter">Letter</option>
                  <option value="fit">Fit to image</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Orientation</label>
                <select
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#11100F] border border-[#342821] rounded-lg text-sm focus:border-[#C96B4B] outline-none"
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Margin ({margin}mm)
                </label>
                <input
                  type="range"
                  min={0}
                  max={30}
                  value={margin}
                  onChange={(e) => setMargin(parseInt(e.target.value))}
                  className="w-full accent-[#C96B4B]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-[#91887D]">{items.length} image{items.length > 1 ? "s" : ""}</p>
                <button onClick={reset} className="text-xs text-[#91887D] hover:text-[#E8E1D5]">
                  Clear all
                </button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {items.map((it, i) => (
                  <div
                    key={i}
                    className="relative group bg-[#25211D] border border-[#342821] rounded-lg overflow-hidden"
                  >
                    <div className="aspect-[3/4] bg-[#11100F]">
                      <img
                        src={it.url}
                        alt=""
                        className="w-full h-full object-contain"
                        style={{ transform: `rotate(${it.rotation}deg)` }}
                      />
                    </div>
                    <div className="absolute top-1 left-1 text-[10px] bg-black/60 px-1.5 py-0.5 rounded">
                      {i + 1}
                    </div>
                    <div className="absolute top-1 right-1 flex flex-col gap-0.5">
                      <button
                        onClick={() => rotate(i)}
                        className="p-1 bg-black/60 rounded hover:bg-black/80"
                        aria-label="Rotate"
                      >
                        <RotateCw className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => remove(i)}
                        className="p-1 bg-black/60 rounded hover:bg-black/80"
                        aria-label="Remove"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="p-1.5 text-[10px] text-[#91887D] truncate" title={it.file.name}>
                      {it.file.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {error && <ErrorDisplay message={error} onRetry={reset} />}
        <DownloadResult blob={result} filename="images.pdf" label="Download PDF" />

        {items.length > 0 && !working && (
          <Button onClick={generate}>
            Generate PDF
          </Button>
        )}
        {working && (
          <div className="flex items-center gap-2 text-sm text-[#91887D]">
            <Loader2 className="w-4 h-4 animate-spin" /> Building PDF…
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
