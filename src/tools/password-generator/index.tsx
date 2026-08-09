import { useEffect, useMemo, useState } from "react";
import {
  ToolLayout,
  Button,
} from "../../components/ui";
import { TOOLS_BY_SLUG } from "../registry";
import { Copy, RefreshCw, ShieldCheck, Check as CheckIcon } from "lucide-react";

export default function PasswordGenerator() {
  const [length, setLength] = useState(20);
  const [upper, setUpper] = useState(true);
  const [lower, setLower] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [count, setCount] = useState(1);
  const [passwords, setPasswords] = useState<string[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const tool = TOOLS_BY_SLUG["password-generator"];

  const generate = () => {
    let pool = "";
    if (upper) pool += "ABCDEFGHJKLMNPQRSTUVWXYZ";
    if (lower) pool += "abcdefghjkmnpqrstuvwxyz";
    if (numbers) pool += "23456789";
    if (symbols) pool += "!@#$%^&*()-_=+[]{};:,.<>/?";
    if (!excludeAmbiguous) {
      if (upper && !pool.includes("I")) pool += "I";
      if (upper && !pool.includes("O")) pool += "O";
      if (lower && !pool.includes("l")) pool += "l";
      if (numbers && !pool.includes("0")) pool += "0";
      if (numbers && !pool.includes("1")) pool += "1";
    }
    if (!pool) {
      setPasswords(["Select at least one character set."]);
      return;
    }
    const out: string[] = [];
    for (let n = 0; n < count; n++) {
      let pw = "";
      const arr = new Uint32Array(length);
      crypto.getRandomValues(arr);
      for (let i = 0; i < length; i++) {
        pw += pool[arr[i] % pool.length];
      }
      out.push(pw);
    }
    setPasswords(out);
  };

  useEffect(() => {
    generate();
  }, []);

  const strength = useMemo(() => {
    if (!passwords.length || passwords[0].startsWith("Select")) return { label: "—", pct: 0, color: "#91887D" };
    const pool = passwords[0];
    let size = 0;
    if (/[a-z]/.test(pool)) size += 26;
    if (/[A-Z]/.test(pool)) size += 26;
    if (/[0-9]/.test(pool)) size += 10;
    if (/[^a-zA-Z0-9]/.test(pool)) size += 32;
    const entropy = pool.length * Math.log2(size);
    let label = "Weak";
    let color = "#ef4444";
    let pct = 25;
    if (entropy >= 120) {
      label = "Very strong";
      color = "#10b981";
      pct = 100;
    } else if (entropy >= 80) {
      label = "Strong";
      color = "#34d399";
      pct = 75;
    } else if (entropy >= 50) {
      label = "Good";
      color = "#f59e0b";
      pct = 50;
    } else if (entropy >= 30) {
      label = "Fair";
      color = "#fb923c";
      pct = 35;
    }
    return { label, pct, color };
  }, [passwords]);

  const copy = async (i: number) => {
    await navigator.clipboard.writeText(passwords[i]);
    setCopiedIdx(i);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  return (
    <ToolLayout tool={tool}>
      <div className="space-y-6">
        {/* Result */}
        <div className="bg-[#11100F] border border-[#342821] rounded-lg p-4">
          <div className="space-y-2">
            {passwords.map((pw, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-[#191715] border border-[#342821] rounded-lg px-3 py-2.5"
              >
                <code className="flex-1 mono text-sm md:text-base text-[#E8E1D5] break-all">
                  {pw}
                </code>
                <button
                  onClick={() => copy(i)}
                  className="p-1.5 rounded-md hover:bg-[#25211D] text-[#91887D] hover:text-[#E8E1D5] flex-shrink-0"
                  aria-label="Copy"
                >
                  {copiedIdx === i ? (
                    <CheckIcon className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-[#91887D] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Strength
              </span>
              <span style={{ color: strength.color }} className="font-medium">
                {strength.label}
              </span>
            </div>
            <div className="h-1.5 bg-[#25211D] rounded-full overflow-hidden">
              <div
                className="h-full transition-all"
                style={{ width: `${strength.pct}%`, backgroundColor: strength.color }}
              />
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Length: {length}
            </label>
            <input
              type="range"
              min={4}
              max={64}
              value={length}
              onChange={(e) => setLength(parseInt(e.target.value))}
              className="w-full accent-[#C96B4B]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Count: {count}
            </label>
            <input
              type="range"
              min={1}
              max={5}
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value))}
              className="w-full accent-[#C96B4B]"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Character sets</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <CheckRow label="Uppercase (A-Z)" value={upper} onChange={setUpper} />
            <CheckRow label="Lowercase (a-z)" value={lower} onChange={setLower} />
            <CheckRow label="Numbers (0-9)" value={numbers} onChange={setNumbers} />
            <CheckRow label="Symbols (!@#...)" value={symbols} onChange={setSymbols} />
            <CheckRow label="Exclude ambiguous" value={excludeAmbiguous} onChange={setExcludeAmbiguous} />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={generate}>
            <RefreshCw className="w-4 h-4" /> Generate
          </Button>
        </div>

        <p className="text-xs text-[#91887D]">
          Generated using your browser's cryptographically secure random number
          generator. Passwords never leave your device.
        </p>
      </div>
    </ToolLayout>
  );
}

function CheckRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 px-3 py-2 bg-[#25211D] border border-[#342821] rounded-lg cursor-pointer hover:border-[#C96B4B]/40 text-sm">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-[#C96B4B]"
      />
      <span>{label}</span>
    </label>
  );
}
