import { Link } from "react-router-dom";
import { TOOLS } from "../tools/registry";
import { Lock, ShieldCheck, Server, Eye, HardDrive, Users, Code2 } from "lucide-react";

export default function Privacy() {
  return (
    <div className="fade-in max-w-3xl mx-auto">
      <div className="flex items-center gap-2 text-[#C96B4B] mb-3">
        <Lock className="w-5 h-5" />
        <span className="text-xs font-semibold uppercase tracking-wider">Privacy</span>
      </div>
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
        Your files stay on your device.
      </h1>
      <p className="mt-4 text-[#91887D]">
        Xevio is designed to process files locally in your browser whenever
        possible. We built Xevio around the belief that sensitive documents
        shouldn't travel over the internet to reach a utility that does its
        work in milliseconds anyway.
      </p>

      <section className="mt-10 space-y-3">
        {[
          {
            icon: <HardDrive className="w-4 h-4" />,
            title: "No uploads for supported tools",
            body: "Every tool marked as 'Local' processes your files entirely in your browser using client-side JavaScript and WebAssembly. Your PDFs, images, and text never leave your device.",
          },
          {
            icon: <Users className="w-4 h-4" />,
            title: "No account required",
            body: "Xevio works the moment you open it. There is no sign-up, no login, no cloud account, no subscription.",
          },
          {
            icon: <Server className="w-4 h-4" />,
            title: "No cloud storage",
            body: "We don't store your files. We don't have a file server. We don't have a database of your documents. Your data is yours.",
          },
          {
            icon: <Eye className="w-4 h-4" />,
            title: "No analytics on file content",
            body: "Because files are processed locally, we never see them. We don't log filenames, we don't read file contents, we don't build profiles from your usage.",
          },
          {
            icon: <ShieldCheck className="w-4 h-4" />,
            title: "Open source foundations",
            body: "Xevio is built on trusted open-source libraries: pdf-lib, pdf.js, Tesseract.js, jsPDF, and others. You can verify what runs in your browser.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="flex gap-4 p-5 bg-[#191715] border border-[#342821] rounded-xl"
          >
            <div className="w-9 h-9 rounded-lg bg-[#C96B4B]/10 border border-[#C96B4B]/20 flex items-center justify-center text-[#C96B4B] flex-shrink-0">
              {item.icon}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#E8E1D5]">{item.title}</h3>
              <p className="text-sm text-[#91887D] mt-1">{item.body}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight mb-3">
          What's stored locally?
        </h2>
        <p className="text-[#91887D] mb-3">
          Xevio stores a few non-sensitive preferences in your browser's
          localStorage so the experience feels personal:
        </p>
        <ul className="list-disc list-inside text-[#91887D] space-y-1 text-sm">
          <li>Your favorite tools</li>
          <li>Recently used tools</li>
        </ul>
        <p className="text-[#91887D] mt-3 text-sm">
          This data never leaves your browser and is never sent to our servers.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight mb-3">
          About "local" processing
        </h2>
        <p className="text-[#91887D] text-sm">
          We mark tools as <span className="text-[#E8E1D5]">Local</span> when
          their implementation runs entirely in your browser. Some tools may
          use WebAssembly modules or large OCR models that download on first
          use; these still run locally — the models are cached and processing
          happens on your device. We will never mark a tool as local if it
          requires sending files to a server.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight mb-3">Tools</h2>
        <div className="grid sm:grid-cols-2 gap-2">
          {TOOLS.map((t) => (
            <div
              key={t.slug}
              className="flex items-center justify-between p-3 bg-[#191715] border border-[#342821] rounded-lg"
            >
              <span className="text-sm">{t.name}</span>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 uppercase">
                <Lock className="w-3 h-3" /> Local
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-10 pt-6 border-t border-[#342821] flex items-center justify-between flex-wrap gap-3">
        <Link
          to="/"
          className="text-sm text-[#C96B4B] hover:text-[#E0805C]"
        >
          ← Back to tools
        </Link>
        <span className="inline-flex items-center gap-1.5 text-xs text-[#91887D]">
          <Code2 className="w-3.5 h-3.5" />
          Built by Mark Quitaleg
        </span>
      </div>
    </div>
  );
}
