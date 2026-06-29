// components/documents/AdminArsipDetailClient.tsx
/**
 * @file components/documents/AdminArsipDetailClient.tsx
 * @description Komponen klien utama untuk menampilkan rincian dari suatu arsip/surat bagi admin. Menggabungkan timeline status, viewer disposisi, dan action panel.
 * @location Dirender di halaman "/dashboard/admin/arsip/[id]".
 */
"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { ArrowLeft, FileText, Download, Calendar, User, Printer, Eye, Pencil, Trash2, Clock, Users, MessageCircle } from "lucide-react";
import toast from "react-hot-toast";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { StatusTimeline } from "@/components/documents/StatusTimeline";
import { AdminArchivePanel } from "@/components/documents/AdminArchivePanel";
import { AgendarisActionPanel } from "@/components/documents/AgendarisActionPanel";
import { FileListViewer } from "@/components/documents/FileListViewer";
import { DisposisiViewer } from "@/components/documents/DisposisiViewer";
import { EditDokumenModal } from "@/components/documents/EditDokumenModal";
import { DECISION_LABELS, DocumentDetail } from "@/types";
import { DecisionType } from "@prisma/client";

export default function AdminArsipDetailClient({ doc, staffUsers }: { 
  doc: DocumentDetail; 
  staffUsers: { id: string; name: string; divisi: string | null }[]; 
}) {

  const latestDecision = doc.decisions[0];
  const latestDisposisi = doc.disposisi?.[0] ?? null;
  const draftFiles = doc.files.filter((f) => f.fileType === "DRAFT");
  const scanFiles = doc.files.filter((f) => f.fileType === "FINAL_SCAN");

  const router = useRouter();
  const pathname = usePathname();
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showWaModal, setShowWaModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [waReminderText, setWaReminderText] = useState("");

  // Tentukan back url yang sesuai
  const backUrl = pathname.includes("/dokumen") 
    ? "/dashboard/admin/dokumen" 
    : "/dashboard/admin/arsip";

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/documents/${doc.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal menghapus dokumen");
      toast.success("Dokumen berhasil dihapus!");
      router.push(backUrl);
    } catch (error: any) {
      toast.error(error.message);
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href={backUrl} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-slate-400" />
          </Link>
          <div>
            <h1 className="page-title">Detail & Pengarsipan Dokumen</h1>
            <p className="page-subtitle font-mono text-xs">{doc.nomorSurat}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/50 transition-colors"
          >
            <Pencil className="w-4 h-4" /> Edit
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            disabled={isDeleting}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/50 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> {isDeleting ? "Menghapus..." : "Hapus"}
          </button>
          
          <ConfirmModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleDelete}
            title="Hapus Dokumen"
            message="Apakah Anda yakin ingin menghapus dokumen ini secara permanen? Aksi ini tidak dapat dibatalkan."
            confirmText="Hapus Permanen"
            type="danger"
            isLoading={isDeleting}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left */}
        <div className="lg:col-span-2 space-y-5">
          {/* Info card */}
          <div className="card p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{doc.perihal}</h2>
              <StatusBadge status={doc.currentStatus} />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <InfoRow icon={FileText} label="Nomor Surat" value={doc.nomorSurat} mono />
              <InfoRow icon={Calendar} label="Tanggal Surat"
                value={format(new Date(doc.tanggalSurat), "dd MMMM yyyy", { locale: localeId })} />
              <InfoRow icon={FileText} label="Nomor Agenda" value={doc.nomorAgenda ?? "-"} mono />
              <InfoRow icon={Calendar} label="Tanggal Terima"
                value={doc.tanggalTerima ? format(new Date(doc.tanggalTerima), "dd MMMM yyyy", { locale: localeId }) : "-"} />
              <InfoRow icon={User} label="Pembuat"
                value={`${doc.createdBy.name} (${doc.createdBy.divisi ?? "-"})`} />
              <InfoRow icon={User} label="Email" value={doc.createdBy.email ?? "-"} />
            </div>

            {doc.deskripsi && (
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Keterangan</p>
                <p className="text-sm text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-800 px-3 py-2 rounded-lg">{doc.deskripsi}</p>
              </div>
            )}
          </div>

          {/* Undangan Info & GCal Button */}
          {doc.undangan && (
            <div className="card p-5 space-y-4 bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-800/50">
              <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Detail Undangan
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <InfoRow icon={Calendar} label="Jadwal" value={`${doc.undangan.hari}, ${format(new Date(doc.undangan.tanggal), "dd MMMM yyyy", { locale: localeId })}`} />
                <InfoRow icon={Clock} label="Jam" value={doc.undangan.jam} />
                <InfoRow icon={FileText} label="Tempat" value={doc.undangan.tempat} />
                <InfoRow icon={Users} label="Media" value={doc.undangan.media} />
              </div>
              
              <div className="flex gap-2 pt-2 border-t border-indigo-100 dark:border-indigo-800/50">
                <a 
                  href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(doc.perihal || "")}&details=${encodeURIComponent("Terkait surat: " + doc.nomorSurat)}&location=${encodeURIComponent(doc.undangan.tempat)}&dates=${format(new Date(doc.undangan.tanggal), "yyyyMMdd")}T010000Z/${format(new Date(doc.undangan.tanggal), "yyyyMMdd")}T030000Z${doc.undangan.penerima?.length ? `&add=${encodeURIComponent(doc.undangan.penerima.map((p: any) => p.user?.email).filter(Boolean).join(","))}` : ""}`}
                  target="_blank" 
                  rel="noreferrer" 
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-medium transition-colors"
                >
                  <Calendar className="w-3.5 h-3.5" /> Tambahkan ke Google Calendar
                </a>
              </div>
            </div>
          )}

          {/* Keputusan Direktur */}
          {latestDecision && (
            <div className="card p-4 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 space-y-2">
              <p className="text-sm font-semibold text-purple-900 dark:text-purple-200">
                Keputusan Direktur: {DECISION_LABELS[latestDecision.decisionType as DecisionType]}
              </p>
              {latestDecision.decisionNote && (
                <p className="text-sm text-purple-700 dark:text-purple-300">{latestDecision.decisionNote}</p>
              )}
              <p className="text-xs text-purple-400 dark:text-purple-500">
                {latestDecision.director.name} ·{" "}
                {format(new Date(latestDecision.decidedAt), "dd MMM yyyy, HH:mm", { locale: localeId })}
              </p>
            </div>
          )}

          {/* Files - Draft */}
          <FileListViewer 
            files={draftFiles} 
            title="File Draft" 
            emptyMessage="Belum ada file draft." 
          />
          
          {/* Files - Scan Final */}
          <FileListViewer 
            files={scanFiles} 
            title="File Scan Final" 
            emptyMessage="Belum ada file scan final. Pastikan Staff sudah mengupload scan." 
          />

          {/* Lembar Disposisi (tampil setelah Direktur memberikan keputusan, HANYA untuk SURAT_MASUK) */}
          {["KEPUTUSAN_DIREKTUR_SELESAI", "ARSIP_FINAL_TERSIMPAN"].includes(doc.currentStatus) && 
           doc.documentType === "SURAT_MASUK" && 
           latestDisposisi && (
            <DisposisiViewer
              disposisi={latestDisposisi}
              doc={doc}
              actions={
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/dashboard/admin/arsip/${doc.id}/cetak-disposisi`}
                    target="_blank"
                    className="inline-flex items-center justify-center gap-2 text-sm font-medium px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl transition-all shadow-sm shadow-blue-200 dark:shadow-none hover:-translate-y-0.5"
                  >
                    <Printer className="w-4 h-4" /> Cetak Lembar Disposisi
                  </Link>
                  <Link
                    href={`/dashboard/admin/arsip/${doc.id}/cetak-gabungan`}
                    target="_blank"
                    className="inline-flex items-center justify-center gap-2 text-sm font-medium px-4 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-xl transition-all shadow-sm shadow-emerald-200 dark:shadow-none hover:-translate-y-0.5"
                  >
                    <Printer className="w-4 h-4" /> Cetak Gabungan (Surat + Disposisi)
                  </Link>
                </div>
              }
            />
          )}

          {/* Review action */}
          <AgendarisActionPanel
            doc={doc}
            staffUsers={staffUsers}
            existingDisposisi={latestDisposisi ? { jabatanKe: latestDisposisi.jabatanKe, instruksi: latestDisposisi.instruksi, keterangan: latestDisposisi.keterangan } : null}
          />

          {/* Archive action */}
          {!doc.archive ? (
            <AdminArchivePanel doc={doc} hasScanFile={scanFiles.length > 0} />
          ) : (
            <div className="card p-5 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 space-y-3">
              <h3 className="font-semibold text-green-900 dark:text-green-200 flex items-center gap-2">
                ✅ Dokumen Sudah Diarsipkan
              </h3>
              <div className="text-sm text-green-800 dark:text-green-300 space-y-1">
                <p><span className="font-medium">Diarsipkan oleh:</span> {doc.archive.archivedBy.name}</p>
                <p><span className="font-medium">Tanggal:</span>{" "}
                  {format(new Date(doc.archive.archivedAt), "dd MMMM yyyy, HH:mm", { locale: localeId })}</p>
                <p><span className="font-medium">Lokasi:</span>{" "}
                  <code className="bg-green-100 dark:bg-green-900/40 px-1.5 rounded text-xs">{doc.archive.serverLocation}</code></p>
                {doc.archive.notes && <p><span className="font-medium">Catatan:</span> {doc.archive.notes}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Right */}
        <div className="space-y-5">
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Riwayat Status</h3>
            <StatusTimeline timeline={doc.statusTimeline} />
          </div>
        </div>
      </div>

      {/* Spacing bottom */}
      <div className="h-10" />

      {showEditModal && (
        <EditDokumenModal doc={doc} onClose={() => setShowEditModal(false)} />
      )}



    </div>
  );
}

function InfoRow({ icon: Icon, label, value, mono }: {
  icon: React.ElementType; label: string; value: string; mono?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-0.5">
        <Icon className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />
        <p className="text-xs font-medium text-gray-500 dark:text-slate-400">{label}</p>
      </div>
      <p className={`text-sm text-gray-900 dark:text-slate-200 break-all ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}



function DisposisiRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-1 px-3 py-2">
      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 shrink-0 w-28">{label}</span>
      <span className="text-xs text-gray-500 dark:text-slate-500 shrink-0">:</span>
      <span className={`text-xs text-gray-900 dark:text-white ml-1 ${mono ? "font-mono" : ""} truncate`}>{value}</span>
    </div>
  );
}
