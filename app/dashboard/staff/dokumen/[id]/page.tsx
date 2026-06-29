// app/dashboard/staff/dokumen/[id]/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { ArrowLeft, FileText, Download, User, Calendar, Building } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StatusTimeline } from "@/components/documents/StatusTimeline";
import { FileUpload } from "@/components/documents/FileUpload";
import { StaffActionPanel } from "@/components/documents/StaffActionPanel";
import { DisposisiViewer } from "@/components/documents/DisposisiViewer";
import { FileListViewer } from "@/components/documents/FileListViewer";
import { DECISION_LABELS } from "@/types";
import { DecisionType } from "@prisma/client";
import { UndanganDetail } from "@/components/documents/UndanganDetail";

type Params = { params: Promise<{ id: string }> };

export default async function StaffDocumentDetail(props: Params) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN_STAFF") redirect("/dashboard");

  const doc = await prisma.suratMasuk.findUnique({
    where: { id: params.id },
    include: {
      createdBy: { select: { id: true, name: true, divisi: true, role: true } },
      files: {
        include: { uploadedBy: { select: { name: true } } },
        orderBy: { uploadedAt: "desc" },
      },
      reviews: {
        include: { reviewedBy: { select: { name: true } } },
        orderBy: { reviewedAt: "desc" },
        take: 3,
      },
      decisions: {
        include: { director: { select: { name: true } } },
        orderBy: { decidedAt: "desc" },
        take: 1,
      },
      disposisi: {
        include: {
          dari: { select: { name: true } },
          ke:   { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      statusTimeline: {
        include: { changedBy: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      },
      archive: { include: { archivedBy: { select: { name: true } } } },
      undangan: {
        include: {
          penerima: {
            include: {
              user: {
                select: { id: true, name: true, divisi: true }
              }
            }
          }
        }
      },
    },
  });

  if (!doc) notFound();
  if (doc.createdById !== session.user.id) redirect("/dashboard/staff");

  const latestDecision = doc.decisions[0];
  const latestReview   = doc.reviews[0];
  const latestDisposisi = doc.disposisi[0] ?? null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/staff/dokumen" className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-slate-400" />
        </Link>
        <div>
          <h1 className="page-title">Detail Dokumen</h1>
          <p className="page-subtitle font-mono text-xs">{doc.nomorSurat}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: main info */}
        <div className="lg:col-span-2 space-y-5">

          {/* Info card */}
          <div className="card p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{doc.perihal}</h2>
              <StatusBadge status={doc.currentStatus} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <InfoRow icon={FileText} label="Nomor Surat" value={doc.nomorSurat} mono />
              <InfoRow icon={Calendar} label="Tanggal Surat"
                value={format(new Date(doc.tanggalSurat), "dd MMMM yyyy", { locale: localeId })} />
              <InfoRow icon={User} label="Pembuat"
                value={`${doc.createdBy.name} (${doc.createdBy.divisi ?? "-"})`} />
            </div>

            {doc.deskripsi && (
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Keterangan</p>
                <p className="text-sm text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-800 px-3 py-2 rounded-lg">{doc.deskripsi}</p>
              </div>
            )}
          </div>

          {doc.documentType === "UNDANGAN" && doc.undangan && (
            <UndanganDetail undangan={doc.undangan as any} perihal={doc.perihal} />
          )}

          {/* Review note (jika dikembalikan) */}
          {latestReview?.reviewStatus === "DIKEMBALIKAN" && doc.currentStatus === "PERLU_REVISI" && (
            <div className="card p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 space-y-2">
              <p className="text-sm font-semibold text-red-800 dark:text-red-300">⚠ Catatan Revisi dari Agendaris</p>
              <p className="text-sm text-red-700 dark:text-red-400">{latestReview.reviewNote ?? "Tidak ada catatan khusus."}</p>
              <p className="text-xs text-red-400 dark:text-red-500">
                {format(new Date(latestReview.reviewedAt), "dd MMM yyyy, HH:mm", { locale: localeId })}
              </p>
            </div>
          )}

          {/* Decision */}
          {latestDecision && (
            <div className="card p-4 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 space-y-2">
              <p className="text-sm font-semibold text-purple-900 dark:text-purple-200">
                Keputusan Direktur: {DECISION_LABELS[latestDecision.decisionType as DecisionType]}
              </p>
              {latestDecision.decisionNote && (
                <p className="text-sm text-purple-700 dark:text-purple-300">{latestDecision.decisionNote}</p>
              )}
              <p className="text-xs text-purple-400 dark:text-purple-500">
                oleh {latestDecision.director.name} •{" "}
                {format(new Date(latestDecision.decidedAt), "dd MMM yyyy", { locale: localeId })}
              </p>
            </div>
          )}

          {/* Lembar Disposisi — visible to staff only after Direktur issues a DISPOSISI decision */}
          {latestDisposisi && (
            <DisposisiViewer
              disposisi={latestDisposisi}
              doc={{
                nomorSurat:   doc.nomorSurat,
                perihal:      doc.perihal,
                asalSurat:    doc.asalSurat,
                nomorAgenda:  doc.nomorAgenda,
                tanggalSurat: doc.tanggalSurat,
                tanggalTerima: doc.tanggalTerima,
                documentType: doc.documentType as string,
              }}
            />
          )}

          {/* Files */}
          <FileListViewer 
            files={doc.files} 
            title="File Dokumen" 
            emptyMessage="Belum ada file yang diupload." 
          />

            {/* Upload draft jika masih di awal */}
            {["DRAFT", "PERLU_REVISI"].includes(doc.currentStatus) && (
              <FileUpload documentId={doc.id} fileType="DRAFT" label="Upload File Draft" />
            )}

            {/* Upload scan final */}
            {doc.currentStatus === "MENUNGGU_SCAN_FINAL" && (
              <FileUpload documentId={doc.id} fileType="FINAL_SCAN" label="Upload Scan Final" />
            )}

          {/* Action panel */}
          <StaffActionPanel doc={doc} />
        </div>

        {/* Right: timeline */}
        <div className="space-y-5">
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Riwayat Status</h3>
            <StatusTimeline timeline={doc.statusTimeline} />
          </div>

          {/* Archive info */}
          {doc.archive && (
            <div className="card p-5 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <p className="font-semibold text-green-900 dark:text-green-200 text-sm mb-1">✅ Dokumen Diarsipkan</p>
              <p className="text-xs text-green-700 dark:text-green-400">
                oleh {doc.archive.archivedBy.name}
              </p>
              <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                {doc.archive.serverLocation}
              </p>
            </div>
          )}
        </div>
      </div>
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
      <p className={`text-sm text-gray-900 dark:text-slate-200 ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
