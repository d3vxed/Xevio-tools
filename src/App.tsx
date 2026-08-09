import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./Layout";
import Home from "./Home";
import { Loader2 } from "lucide-react";
import { ErrorBoundary } from "./ErrorBoundary";   // ← add

/* Lazy-loaded tool pages */
const MergePDF = lazy(() => import("./tools/merge-pdf"));
const SplitPDF = lazy(() => import("./tools/split-pdf"));
const CompressPDF = lazy(() => import("./tools/compress-pdf"));
const PDFToImages = lazy(() => import("./tools/pdf-to-images"));
const ImagesToPDF = lazy(() => import("./tools/images-to-pdf"));
const RemoveBackground = lazy(() => import("./tools/remove-background"));
const ImageCompressor = lazy(() => import("./tools/image-compressor"));
const ImageResizer = lazy(() => import("./tools/image-resizer"));
const ImageConverter = lazy(() => import("./tools/image-converter"));
const ImageCropper = lazy(() => import("./tools/image-cropper"));
const ScreenshotMockup = lazy(() => import("./tools/screenshot-mockup"));
const OCR = lazy(() => import("./tools/ocr"));
const JSONFormatter = lazy(() => import("./tools/json-formatter"));
const CSVViewer = lazy(() => import("./tools/csv-viewer"));
const QRGenerator = lazy(() => import("./tools/qr-generator"));
const PasswordGenerator = lazy(() => import("./tools/password-generator"));

const Privacy = lazy(() => import("./pages/Privacy"));
const NotFound = lazy(() => import("./pages/NotFound"));

function Loading() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="flex items-center gap-2 text-[#91887D]">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading…</span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
    <ErrorBoundary>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="/tools/merge-pdf" element={<MergePDF />} />
            <Route path="/tools/split-pdf" element={<SplitPDF />} />
            <Route path="/tools/compress-pdf" element={<CompressPDF />} />
            <Route path="/tools/pdf-to-images" element={<PDFToImages />} />
            <Route path="/tools/images-to-pdf" element={<ImagesToPDF />} />
            <Route path="/tools/remove-background" element={<RemoveBackground />} />
            <Route path="/tools/image-compressor" element={<ImageCompressor />} />
            <Route path="/tools/image-resizer" element={<ImageResizer />} />
            <Route path="/tools/image-converter" element={<ImageConverter />} />
            <Route path="/tools/image-cropper" element={<ImageCropper />} />
            <Route path="/tools/screenshot-mockup" element={<ScreenshotMockup />} />
            <Route path="/tools/ocr" element={<OCR />} />
            <Route path="/tools/json-formatter" element={<JSONFormatter />} />
            <Route path="/tools/csv-viewer" element={<CSVViewer />} />
            <Route path="/tools/qr-generator" element={<QRGenerator />} />
            <Route path="/tools/password-generator" element={<PasswordGenerator />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
