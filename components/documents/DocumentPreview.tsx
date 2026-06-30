// components/documents/DocumentPreview.tsx
/**
 * @file components/documents/DocumentPreview.tsx
 * @description Komponen UI (modal/embed) untuk menampilkan preview dokumen digital (misal PDF atau gambar) langsung di dalam aplikasi.
 * @location Dipanggil ketika user menekan tombol "Lihat Dokumen" di tabel atau detail dokumen.
 */
"use client";
import { X, ExternalLink, Download, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface DocumentPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
}

export function DocumentPreview({ isOpen, onClose, fileUrl, fileName }: DocumentPreviewProps) {
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => { document.body.style.overflow = "auto"; };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const isPdf = fileUrl.toLowerCase().endsWith(".pdf") || fileName.toLowerCase().endsWith(".pdf");
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl) || /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Content */}
      <div className="relative bg-white dark:bg-slate-900 w-full h-full max-w-7xl rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 dark:text-white truncate">{fileName}</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">Preview Dokumen</p>
          </div>
          <div className="flex items-center gap-2">
            <a 
              href={fileUrl} 
              target="_blank" 
              rel="noreferrer"
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
              title="Buka di tab baru"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
            <a 
              href={fileUrl}
              download={fileName}
              className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
              title="Download file"
            >
              <Download className="w-5 h-5" />
            </a>
            <div className="w-px h-6 bg-gray-200 dark:bg-slate-700 mx-1"></div>
            <button 
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              title="Tutup preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewer Area */}
        <div className="flex-1 bg-gray-100/50 dark:bg-slate-900 relative overflow-hidden flex items-center justify-center">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
              <p className="text-sm text-gray-500 font-medium">Memuat preview...</p>
            </div>
          )}
          
          {isPdf ? (
            <iframe 
              src={`${fileUrl}#view=FitH`}
              className="w-full h-full border-0"
              onLoad={() => setLoading(false)}
              onError={() => setLoading(false)}
            />
          ) : isImage ? (
            <img 
              src={fileUrl} 
              alt={fileName}
              className="max-w-full max-h-full object-contain p-4"
              onLoad={() => setLoading(false)}
              onError={() => setLoading(false)}
            />
          ) : (
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-gray-200 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ExternalLink className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Preview tidak tersedia</h4>
              <p className="text-gray-500 dark:text-slate-400 mb-4 max-w-sm mx-auto">
                File dengan format ini tidak dapat dipreview langsung. Silakan download untuk melihat isinya.
              </p>
              <a 
                href={fileUrl}
                download={fileName}
                onClick={() => setLoading(false)}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Download File
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
