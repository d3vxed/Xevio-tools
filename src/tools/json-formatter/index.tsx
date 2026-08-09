import { useState, useEffect } from "react";
import {
  ToolLayout,
  Button,
} from "../../components/ui";
import { TOOLS_BY_SLUG } from "../registry";
import { Copy, Download, Trash2, Minimize2, Sparkles, Check, AlertCircle } from "lucide-react";

export default function JSONFormatter() {
  const [input, setInput] = useState("");
  const [error, setError] = useState<{ line?: number; col?: number; msg: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const tool = TOOLS_BY_SLUG["json-formatter"];

  useEffect(() => {
    if (!input.trim()) {
      setError(null);
      return;
    }
    try {
      JSON.parse(input);
      setError(null);
    } catch (e: any) {
      const match = e.message.match(/position (\d+)/);
      let line: number | undefined;
      let col: number | undefined;
      if (match) {
        const pos = parseInt(match[1], 10);
        const before = input.slice(0, pos);
        line = before.split("\n").length;
        col = pos - before.lastIndexOf("\n");
      }
      setError({ line, col, msg: e.message });
    }
  }, [input]);

  const format = () => {
    try {
      const parsed = JSON.parse(input);
      setInput(JSON.stringify(parsed, null, 2));
    } catch (e: any) {
      setError({ msg: e.message });
    }
  };

  const minify = () => {
    try {
      const parsed = JSON.parse(input);
      setInput(JSON.stringify(parsed));
    } catch (e: any) {
      setError({ msg: e.message });
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(input);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const download = () => {
    const blob = new Blob([input], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "formatted.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Simple syntax highlighting
  const highlight = (str: string) => {
    try {
      JSON.parse(str);
      return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (m) => {
          let cls = "text-[#E0805C]"; // number
          if (/^"/.test(m)) {
            cls = /:$/.test(m) ? "text-[#E8E1D5]" : "text-emerald-400";
          } else if (/true|false/.test(m)) {
            cls = "text-[#C96B4B]";
          } else if (/null/.test(m)) {
            cls = "text-[#91887D]";
          }
          return `<span class="${cls}">${m}</span>`;
        });
    } catch {
      return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
  };

  return (
    <ToolLayout tool={tool}>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={format} variant="secondary" size="sm">
            <Sparkles className="w-3.5 h-3.5" /> Format
          </Button>
          <Button onClick={minify} variant="secondary" size="sm">
            <Minimize2 className="w-3.5 h-3.5" /> Minify
          </Button>
          <div className="flex-1" />
          <Button variant="ghost" size="sm" onClick={copy} disabled={!input}>
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button variant="ghost" size="sm" onClick={download} disabled={!input}>
            <Download className="w-3.5 h-3.5" /> Download
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setInput("")} disabled={!input}>
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </Button>
        </div>

        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Paste JSON here...\n\n{\n  "hello": "world"\n}'
            spellCheck={false}
            className="w-full h-96 p-4 bg-[#11100F] border border-[#342821] rounded-lg mono text-sm text-[#E8E1D5] placeholder:text-[#91887D] focus:border-[#C96B4B] outline-none resize-none"
          />
          {error && (
            <div className="absolute bottom-3 right-3 max-w-sm bg-rose-500/10 border border-rose-500/30 rounded-lg p-2 text-xs">
              <div className="flex items-center gap-1.5 text-rose-300">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                <span className="font-medium">Invalid JSON</span>
              </div>
              <p className="text-[#91887D] mt-1">
                {error.line && error.col && (
                  <span>Line {error.line}, Column {error.col} — </span>
                )}
                {error.msg}
              </p>
            </div>
          )}
        </div>

        {input && !error && (
          <div>
            <p className="text-xs text-[#91887D] mb-2 uppercase tracking-wider">Preview</p>
            <pre
              className="p-4 bg-[#11100F] border border-[#342821] rounded-lg mono text-sm max-h-80 overflow-auto"
              dangerouslySetInnerHTML={{ __html: highlight(input) }}
            />
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
