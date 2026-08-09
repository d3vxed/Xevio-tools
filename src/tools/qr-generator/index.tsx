import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import {
  ToolLayout,
  Button,
} from "../../components/ui";
import { TOOLS_BY_SLUG } from "../registry";
import { Download } from "lucide-react";

type Mode = "url" | "text" | "email" | "phone" | "wifi" | "vcard";

export default function QRGenerator() {
  const [mode, setMode] = useState<Mode>("url");
  const [size, setSize] = useState(320);
  const [margin, setMargin] = useState(4);
  const [fg, setFg] = useState("#C96B4B");
  const [bg, setBg] = useState("#11100F");
  const [ec, setEc] = useState<"L" | "M" | "Q" | "H">("M");

  const [url, setUrl] = useState("https://xevio.app");
  const [text, setText] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [ssid, setSsid] = useState("");
  const [wifiPass, setWifiPass] = useState("");
  const [wifiEnc, setWifiEnc] = useState<"WPA" | "WEP" | "nopass">("WPA");
  const [vName, setVName] = useState("");
  const [vPhone, setVPhone] = useState("");
  const [vEmail, setVEmail] = useState("");
  const [vOrg, setVOrg] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const payload = (() => {
    switch (mode) {
      case "url":
        return url || " ";
      case "text":
        return text || " ";
      case "email":
        return email ? `mailto:${email}` : " ";
      case "phone":
        return phone ? `tel:${phone}` : " ";
      case "wifi":
        return ssid
          ? `WIFI:T:${wifiEnc};S:${ssid};P:${wifiPass};;`
          : " ";
      case "vcard":
        return vName
          ? `BEGIN:VCARD\nVERSION:3.0\nFN:${vName}\nORG:${vOrg}\nTEL:${vPhone}\nEMAIL:${vEmail}\nEND:VCARD`
          : " ";
    }
  })();

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, payload, {
      width: size,
      margin,
      color: { dark: fg, light: bg },
      errorCorrectionLevel: ec,
    }).catch(() => {});
  }, [payload, size, margin, fg, bg, ec]);

  const download = (as: "png" | "svg") => {
    if (!canvasRef.current) return;
    if (as === "png") {
      canvasRef.current.toBlob((blob) => {
        if (!blob) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "qr.png";
        a.click();
        URL.revokeObjectURL(a.href);
      });
    } else {
      QRCode.toString(payload, {
        type: "svg",
        width: size,
        margin,
        color: { dark: fg, light: bg },
        errorCorrectionLevel: ec,
      }).then((svg) => {
        const blob = new Blob([svg], { type: "image/svg+xml" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "qr.svg";
        a.click();
        URL.revokeObjectURL(a.href);
      });
    }
  };

  const tool = TOOLS_BY_SLUG["qr-generator"];

  return (
    <ToolLayout tool={tool}>
      <div className="grid md:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Content type</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {(["url", "text", "email", "phone", "wifi", "vcard"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={
                    "px-2 py-1.5 text-xs rounded-md border uppercase transition-colors " +
                    (mode === m
                      ? "bg-[#C96B4B]/10 border-[#C96B4B]/50 text-[#E0805C]"
                      : "bg-[#25211D] border-[#342821] hover:border-[#C96B4B]/40")
                  }
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {mode === "url" && (
            <Input label="URL" value={url} onChange={setUrl} placeholder="https://example.com" />
          )}
          {mode === "text" && (
            <div>
              <label className="block text-sm font-medium mb-1.5">Text</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter text to encode"
                rows={4}
                className="w-full px-3 py-2 bg-[#11100F] border border-[#342821] rounded-lg text-sm placeholder:text-[#91887D] focus:border-[#C96B4B] outline-none resize-none"
              />
            </div>
          )}
          {mode === "email" && (
            <Input label="Email" value={email} onChange={setEmail} placeholder="name@example.com" />
          )}
          {mode === "phone" && (
            <Input label="Phone" value={phone} onChange={setPhone} placeholder="+1 555 000 0000" />
          )}
          {mode === "wifi" && (
            <div className="space-y-3">
              <Input label="Network name (SSID)" value={ssid} onChange={setSsid} />
              <Input label="Password" value={wifiPass} onChange={setWifiPass} />
              <div>
                <label className="block text-sm font-medium mb-1.5">Encryption</label>
                <select
                  value={wifiEnc}
                  onChange={(e) => setWifiEnc(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#11100F] border border-[#342821] rounded-lg text-sm focus:border-[#C96B4B] outline-none"
                >
                  <option value="WPA">WPA/WPA2</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">None</option>
                </select>
              </div>
            </div>
          )}
          {mode === "vcard" && (
            <div className="space-y-3">
              <Input label="Name" value={vName} onChange={setVName} />
              <Input label="Organization" value={vOrg} onChange={setVOrg} />
              <Input label="Phone" value={vPhone} onChange={setVPhone} />
              <Input label="Email" value={vEmail} onChange={setVEmail} />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Size ({size}px)
            </label>
            <input
              type="range"
              min={128}
              max={1024}
              step={16}
              value={size}
              onChange={(e) => setSize(parseInt(e.target.value))}
              className="w-full accent-[#C96B4B]"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Margin</label>
              <input
                type="number"
                value={margin}
                min={0}
                max={10}
                onChange={(e) => setMargin(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-[#11100F] border border-[#342821] rounded-lg text-sm focus:border-[#C96B4B] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Foreground</label>
              <input
                type="color"
                value={fg}
                onChange={(e) => setFg(e.target.value)}
                className="w-full h-10 rounded-lg border border-[#342821] bg-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Background</label>
              <input
                type="color"
                value={bg}
                onChange={(e) => setBg(e.target.value)}
                className="w-full h-10 rounded-lg border border-[#342821] bg-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Error correction</label>
            <div className="flex gap-2">
              {(["L", "M", "Q", "H"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setEc(l)}
                  className={
                    "flex-1 px-3 py-2 rounded-lg border text-sm uppercase transition-colors " +
                    (ec === l
                      ? "bg-[#C96B4B]/10 border-[#C96B4B]/50 text-[#E0805C]"
                      : "bg-[#25211D] border-[#342821] hover:border-[#C96B4B]/40")
                  }
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div
            className="aspect-square rounded-xl p-4 flex items-center justify-center"
            style={{ backgroundColor: bg, border: `1px solid #342821` }}
          >
            <canvas ref={canvasRef} className="max-w-full max-h-full" />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => download("png")} className="flex-1">
              <Download className="w-4 h-4" /> PNG
            </Button>
            <Button variant="outline" onClick={() => download("svg")} className="flex-1">
              <Download className="w-4 h-4" /> SVG
            </Button>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-[#11100F] border border-[#342821] rounded-lg text-sm placeholder:text-[#91887D] focus:border-[#C96B4B] outline-none"
      />
    </div>
  );
}
