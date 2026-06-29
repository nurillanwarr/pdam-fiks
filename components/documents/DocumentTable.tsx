// components/documents/DocumentTable.tsx
/**
 * @file components/documents/DocumentTable.tsx
 * @description Komponen tabel reusable untuk menampilkan daftar dokumen. Mendukung pengurutan, penampilan status, dan navigasi ke halaman detail.
 * @location Dirender di berbagai halaman yang menampilkan list dokumen (misal: "/dashboard/staff", "/dashboard/direktur").
 */
"use client";
import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Eye, ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { DocumentListItem, DOCUMENT_TYPE_LABELS, DOCUMENT_TYPE_COLORS } from "@/types";
import type { DocumentType } from "@prisma/client";

interface Props {
  documents: DocumentListItem[];
  basePath?: string;
  emptyTitle?: string;
  emptyDesc?: string;
  showCreator?: boolean;
  showDocType?: boolean;
}

export function DocumentTable({
  documents,
  basePath = "/dashboard",
  emptyTitle = "Tidak ada dokumen",
  emptyDesc = "Belum ada dokumen yang tersedia.",
  showCreator = true,
  showDocType = false,
}: Props) {
  if (!documents.length) {
    return <EmptyState title={emptyTitle} description={emptyDesc} />;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-800">
      <table className="w-full text-base">
        <thead>
          <tr>
            <th className="table-th rounded-tl-xl">No. Surat</th>
            <th className="table-th">No. Agenda</th>
            <th className="table-th">Perihal</th>
            {showCreator && <th className="table-th">Dari</th>}
            {showDocType && <th className="table-th">Jenis</th>}
            <th className="table-th">Tanggal</th>
            <th className="table-th">Status</th>
            <th className="table-th rounded-tr-xl text-center">Aksi</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-100 dark:divide-slate-800">
          {documents.map((doc) => (
            <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
              <td className="table-td font-mono text-sm font-medium text-blue-700 dark:text-blue-400 whitespace-nowrap">
                {doc.nomorSurat}
              </td>
              <td className="table-td font-mono text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                {doc.nomorAgenda ?? "-"}
              </td>
              <td className="table-td max-w-xs">
                <p className="truncate font-medium text-gray-900 dark:text-white">{doc.perihal}</p>
              </td>
              {showCreator && (
                <td className="table-td whitespace-nowrap">
                  <p className="font-medium text-gray-900 dark:text-slate-200">{doc.createdBy.name}</p>
                  <p className="text-sm text-gray-400 dark:text-slate-500">{doc.createdBy.divisi ?? "-"}</p>
                </td>
              )}
              {showDocType && (
                <td className="table-td">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DOCUMENT_TYPE_COLORS[doc.documentType] ?? "bg-gray-100 text-gray-700"}`}>
                    {DOCUMENT_TYPE_LABELS[doc.documentType] ?? "Surat"}
                  </span>
                </td>
              )}
              <td className="table-td whitespace-nowrap text-gray-500 dark:text-slate-500">
                {format(new Date(doc.tanggalSurat), "dd MMM yyyy", { locale: localeId })}
              </td>
              <td className="table-td">
                <StatusBadge status={doc.currentStatus} size="sm" />
              </td>
              <td className="table-td text-center">
                <Link
                  href={`${basePath}/dokumen/${doc.id}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium
                             text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Detail
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
