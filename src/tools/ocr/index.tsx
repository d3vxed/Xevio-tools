import { useState } from "react";
import Tesseract from "tesseract.js";
import {
  ToolLayout,
  FileDropzone,
  Button,
  ProgressBar,
  ErrorDisplay,
} from "../../components/ui";
import { TOOLS_BY_SLUG } from "../registry";
import { Loader2, Copy, Download, Check, FileText } from "lucide-react";

export default function OCR() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [text, setText] = useState<string>("");
  const [lang, setLang] = useState<string>("eng");
  const [working, setWorking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const tool = TOOLS_BY_SLUG["ocr"];

  const onFile = (f: File) => {
    setError(null);
    setText("");
    setPreview(URL.createObjectURL(f));
    setFile(f);
  };

  const run = async () => {
    if (!file) return;
    setError(null);
    setWorking(true);
    setProgress(0);
    try {
      const result = await Tesseract.recognize(file, lang, {
        logger: (m) => {
          if (m.status) setStatus(m.status);
          if (typeof m.progress === "number") setProgress(m.progress * 100);
        },
      });
      setText(result.data.text);
      setProgress(100);
    } catch (e: any) {
      setError(e?.message ?? "OCR failed.");
    } finally {
      setWorking(false);
    }
  };

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview("");
    setText("");
    setError(null);
    setProgress(0);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const download = () => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "extracted.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ToolLayout tool={tool}>
      <div className="space-y-5">
        {!file ? (
          <FileDropzone
            accept="image/*"
            onFiles={(f) => onFile(f[0])}
            label="Drop an image here"
            sublabel="Contains text you want to extract"
          />
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-xs text-[#91887D] uppercase tracking-wider">Image</p>
              <div className="aspect-[4/3] bg-[#11100F] border border-[#342821] rounded-lg overflow-hidden flex items-center justify-center">
                <img src={preview} alt="" className="max-w-full max-h-full object-contain" />
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Language</label>
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value)}
                  className="w-full px-3 py-2 bg-[#11100F] border border-[#342821] rounded-lg text-sm focus:border-[#C96B4B] outline-none"
                >
                  <option value="eng">English</option>
                  <option value="spa">Spanish</option>
                  <option value="fra">French</option>
                  <option value="deu">German</option>
                  <option value="ita">Italian</option>
                  <option value="por">Portuguese</option>
                  <option value="chi_sim">Chinese (Simplified)</option>
                  <option value="jpn">Japanese</option>
                  <option value="kor">Korean</option>
                </select>
              </div>
              {!working && !text && (
                <Button onClick={run}>
                  <FileText className="w-4 h-4" />
                  Extract text
                </Button>
              )}
            </div>
          </div>
        )}

        {working && (
          <div className="space-y-2">
            <ProgressBar progress={progress} label={status || "Processing"} />
            <p className="text-xs text-[#91887D]">
              Loading OCR models the first time may take a moment…
            </p>
          </div>
        )}

        {error && <ErrorDisplay message={error} onRetry={reset} />}

        {text && (
          <div className="bg-[#11100F] border border-[#342821] rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#342821] bg-[#191715]">
              <span className="text-xs font-medium text-[#91887D]">Extracted text</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={copy}
                  className="inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded hover:bg-[#25211D] text-[#E8E1D5]"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  onClick={download}
                  className="inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded hover:bg-[#25211D] text-[#E8E1D5]"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download TXT
                </button>
              </div>
            </div>
            <pre className="p-4 text-sm text-[#E8E1D5] whitespace-pre-wrap mono max-h-80 overflow-y-auto">
              {text || <span className="text-[#91887D]">No text detected.</span>}
            </pre>
          </div>
        )}

        {file && !working && (
          <div className="flex gap-2">
            <Button onClick={run} loading={working}>
              {working && <Loader2 className="w-4 h-4 animate-spin" />}
              {text ? "Re-extract" : "Extract text"}
            </Button>
            <Button variant="outline" onClick={reset}>
              Replace
            </Button>
          </div>
        )}

        <p className="text-xs text-[#91887D]">
          Powered by Tesseract.js. OCR runs entirely in your browser.
        </p>
      </div>
    </ToolLayout>
  );
}
