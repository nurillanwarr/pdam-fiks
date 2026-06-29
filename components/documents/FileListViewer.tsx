/**
 * @file components/documents/FileListViewer.tsx
 * @description Komponen client untuk menampilkan daftar lampiran file dengan fitur preview (modal) dan download.
 * @location Dirender di halaman detail dokumen bagi semua pengguna untuk melihat file fisik hasil upload.
 */
"use client";

import { useState } from "react";
import { FileText, Download, Eye } from "lucide-react";
import { DocumentPreview } from "./DocumentPreview";

interface FileItem {
  id: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize?: number | null;
  uploadedBy?: { name: string } | null;
}

interface FileListViewerProps {
  files: FileItem[];
  title?: string;
  emptyMessage?: string;
}

export function FileListViewer({ files, title, emptyMessage = "Tidak ada file terlampir." }: FileListViewerProps) {
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string } | null>(null);

  if (files.length === 0) {
    return (
      <div className="card p-5 space-y-3">
        {title && <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>}
        <p className="text-sm text-gray-400 dark:text-slate-500 italic">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="card p-5 space-y-3">
      {title && <h3 className="font-semibold text-gray-900">{title}</h3>}
      <div className="space-y-2">
        {files.map((file) => (
          <div 
            key={file.id} 
            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-700 group hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
          >
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600 shrink-0" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-slate-200 truncate">{file.fileName}</p>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase font-semibold">
                {file.fileType} {file.fileSize ? `· ${(file.fileSize / 1024).toFixed(0)} KB` : ""}
                {file.uploadedBy ? ` · Oleh: ${file.uploadedBy.name}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPreviewFile({ url: file.filePath, name: file.fileName })}
                className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4" /> Preview
              </button>
              <a
                href={file.filePath}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                title="Unduh"
              >
                <Download className="w-4 h-4" />
              </a>
            </div>
          </div>
        ))}
      </div>

      <DocumentPreview 
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        fileUrl={previewFile?.url || ""}
        fileName={previewFile?.name || ""}
      />

      {/* Embedded PDF Viewer for the first FINAL_SCAN or any PDF */}
      {files.map((file) => {
        const isPdf = file.fileName.toLowerCase().endsWith(".pdf") || file.fileType.toLowerCase().includes("pdf") || file.filePath.toLowerCase().endsWith(".pdf");
        if (isPdf) {
          return (
            <div key={`embed-${file.id}`} className="mt-4 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden h-[600px] w-full">
              <div className="bg-gray-100 dark:bg-slate-800 p-2 text-xs font-semibold text-gray-500 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
                <span>Preview: {file.fileName}</span>
                <a href={file.filePath} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">Buka Penuh</a>
              </div>
              <iframe 
                src={file.filePath} 
                className="w-full h-full border-none bg-gray-50 dark:bg-slate-900" 
                title={file.fileName}
              />
            </div>
          );
        }
        return null;
      }).filter(Boolean)[0] /* Only show the first PDF inline to avoid clutter */}
    </div>
  );
}
