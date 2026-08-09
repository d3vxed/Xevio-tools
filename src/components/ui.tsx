import { useCallback, useEffect, useRef, useState, type DragEvent, type ReactNode } from "react";
import { Upload, X, File as FileIcon, Loader2, Check, AlertCircle, ChevronLeft, Lock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "../utils/cn";
import type { Tool } from "../tools/registry";

/* ============================================================
   FORMAT HELPERS
   ============================================================ */
export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + " " + sizes[i];
}

/* ============================================================
   BUTTON
   ============================================================ */
export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  disabled,
  loading,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 font-medium transition-colors rounded-lg focus-visible:outline-accent whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  };
  const variants = {
    primary:
      "bg-[#C96B4B] text-white hover:bg-[#E0805C] active:bg-[#E0805C]/80",
    secondary:
      "bg-[#25211D] text-[#E8E1D5] hover:bg-[#342821] border border-[#342821]",
    ghost: "text-[#E8E1D5] hover:bg-[#25211D]",
    outline:
      "border border-[#342821] text-[#E8E1D5] hover:bg-[#25211D] hover:border-[#C96B4B]/40",
  };
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(base, sizes[size], variants[variant], className)}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}

/* ============================================================
   PRIVACY NOTICE
   ============================================================ */
export function PrivacyNotice({ text }: { text?: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-[#91887D]">
      <Lock className="w-3.5 h-3.5" />
      <span>{text ?? "Processed locally in your browser whenever supported."}</span>
    </div>
  );
}

/* ============================================================
   PROGRESS BAR
   ============================================================ */
export function ProgressBar({ progress, label }: { progress: number; label?: string }) {
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-xs text-[#91887D] mb-1.5">
          <span>{label}</span>
          <span>{Math.round(progress)}%</span>
        </div>
      )}
      <div className="h-1.5 w-full bg-[#25211D] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#C96B4B] transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}

/* ============================================================
   FILE DROPZONE
   ============================================================ */
export function FileDropzone({
  onFiles,
  accept,
  multiple = false,
  label = "Drop your files here",
  sublabel,
  disabled,
}: {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  label?: string;
  sublabel?: string;
  disabled?: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (disabled) return;
      const files = Array.from(e.dataTransfer.files);
      if (files.length) onFiles(multiple ? files : [files[0]]);
    },
    [onFiles, multiple, disabled]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !disabled) inputRef.current?.click();
      }}
      role="button"
      tabIndex={0}
      aria-label={label}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-colors cursor-pointer",
        dragging
          ? "border-[#C96B4B] bg-[#C96B4B]/5"
          : "border-[#342821] hover:border-[#C96B4B]/60 hover:bg-[#191715]",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length) onFiles(multiple ? files : [files[0]]);
          if (inputRef.current) inputRef.current.value = "";
        }}
      />
      <div className="w-12 h-12 rounded-full bg-[#25211D] flex items-center justify-center mb-4">
        <Upload className="w-5 h-5 text-[#C96B4B]" />
      </div>
      <p className="text-[#E8E1D5] font-medium">{label}</p>
      {sublabel && <p className="text-sm text-[#91887D] mt-1">{sublabel}</p>}
      <p className="text-xs text-[#91887D] mt-4">
        or <span className="text-[#C96B4B] underline underline-offset-2">browse files</span>
      </p>
    </div>
  );
}

/* ============================================================
   FILE LIST ITEM
   ============================================================ */
export type FileStatus = "pending" | "processing" | "done" | "error";

export function FileListItem({
  file,
  status,
  progress,
  onRemove,
  subtitle,
}: {
  file: File;
  status: FileStatus;
  progress?: number;
  onRemove?: () => void;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-[#191715] border border-[#342821] rounded-lg">
      <div className="w-9 h-9 rounded-md bg-[#25211D] flex items-center justify-center flex-shrink-0">
        {status === "processing" ? (
          <Loader2 className="w-4 h-4 text-[#C96B4B] animate-spin" />
        ) : status === "done" ? (
          <Check className="w-4 h-4 text-emerald-400" />
        ) : status === "error" ? (
          <AlertCircle className="w-4 h-4 text-rose-400" />
        ) : (
          <FileIcon className="w-4 h-4 text-[#91887D]" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#E8E1D5] truncate">{file.name}</p>
        <p className="text-xs text-[#91887D]">
          {subtitle ?? formatBytes(file.size)}
          {progress !== undefined && status === "processing" && ` • ${Math.round(progress)}%`}
        </p>
      </div>
      {onRemove && (
        <button
          onClick={onRemove}
          aria-label="Remove file"
          className="p-1.5 text-[#91887D] hover:text-[#E8E1D5] rounded-md hover:bg-[#25211D]"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

/* ============================================================
   ERROR DISPLAY
   ============================================================ */
export function ErrorDisplay({
  title,
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="p-5 bg-rose-500/5 border border-rose-500/20 rounded-lg text-center">
      <AlertCircle className="w-6 h-6 text-rose-400 mx-auto mb-2" />
      <p className="text-sm font-medium text-[#E8E1D5]">{title ?? "Something went wrong."}</p>
      <p className="text-sm text-[#91887D] mt-1">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}

/* ============================================================
   TOOL LAYOUT
   ============================================================ */
export function ToolLayout({
  tool,
  children,
}: {
  tool: Tool;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <div className="fade-in">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-[#91887D] hover:text-[#E8E1D5] mb-4 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Back
      </button>
      <div className="flex items-start gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-[#C96B4B]/10 border border-[#C96B4B]/20 flex items-center justify-center text-[#C96B4B]">
          {tool.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-semibold text-[#E8E1D5] tracking-tight">
            {tool.name}
          </h1>
          <p className="text-sm text-[#91887D] mt-1">{tool.description}</p>
        </div>
      </div>
      <div className="bg-[#191715] border border-[#342821] rounded-2xl p-5 md:p-7">
        {children}
      </div>
      <div className="mt-5">
        <PrivacyNotice />
      </div>
    </div>
  );
}

/* ============================================================
   EMPTY STATE (tool category)
   ============================================================ */
export function EmptyState({
  icon,
  title,
  description,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="text-center py-10">
      {icon && <div className="inline-flex mb-3 text-[#91887D]">{icon}</div>}
      <h3 className="text-sm font-medium text-[#E8E1D5]">{title}</h3>
      {description && <p className="text-xs text-[#91887D] mt-1">{description}</p>}
    </div>
  );
}

/* ============================================================
   DOWNLOAD RESULT
   ============================================================ */
/* ============================================================
   DOWNLOAD RESULT
   ============================================================ */
export function DownloadResult({
  blob,
  filename,
  label = "Download",
}: {
  blob: Blob | null;
  filename: string;
  label?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!blob) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    // Revoke this exact URL when the blob changes again, or on unmount
    // (e.g. the user navigates to another tool). This is what was leaking.
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);

  if (!blob || !url) return null;

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 bg-[#25211D] border border-[#C96B4B]/20 rounded-lg">
      <Check className="w-5 h-5 text-emerald-400 hidden sm:block" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#E8E1D5]">Ready to download</p>
        <p className="text-xs text-[#91887D] truncate">
          {filename} • {formatBytes(blob.size)}
        </p>
      </div>
      <a href={url} download={filename}>
        <Button>{label}</Button>
      </a>
    </div>
  );
}

/* Re-export Link for convenience */
export { Link };
