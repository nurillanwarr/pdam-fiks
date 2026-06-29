// app/dashboard/admin/arsip/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Archive, Eye, CheckCircle, ArrowLeft } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ArsipFilter } from "@/components/documents/ArsipFilter";
import { Suspense } from "react";
import { FadeIn } from "@/components/ui/FadeIn";

type Props = { searchParams: Promise<{ bulan?: string; tahun?: string; prioritas?: string }> };

export default async function AdminArsipPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "AGENDARIS") redirect("/dashboard");

  const { bulan, tahun, prioritas } = await searchParams;
  const bulanNum = bulan ? parseInt(bulan) : undefined;
  const tahunNum = tahun ? parseInt(tahun) : undefined;

  const archiveFilter = {
    ...(bulanNum ? { bulan: bulanNum } : {}),
    ...(tahunNum ? { tahun: tahunNum } : {}),
  };

  const [antrianDocs, archivedDocs] = await Promise.all([
    prisma.suratMasuk.findMany({
      where: { currentStatus: { in: ["MENUNGGU_ARSIP_ADMIN", "KEPUTUSAN_DIREKTUR_SELESAI"] } },
      include: {
        createdBy: { select: { name: true, divisi: true } },
        files: { where: { fileType: "FINAL_SCAN" }, select: { filePath: true, fileName: true } },
        decisions: {
          include: { director: { select: { name: true } } },
          orderBy: { decidedAt: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "asc" },
    }),
    prisma.suratMasuk.findMany({
      where: {
        currentStatus: "ARSIP_FINAL_TERSIMPAN",
        ...(Object.keys(archiveFilter).length > 0 ? { archive: archiveFilter } : {}),
        ...(prioritas === "true" ? { isImportant: true } : prioritas === "false" ? { isImportant: false } : {}),
      },
      include: {
        createdBy: { select: { name: true, divisi: true } },
        archive: { select: { archivedAt: true, serverLocation: true, bulan: true, tahun: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
  ]);

  // Group archived docs by documentType
  const DOCUMENT_TYPE_LABELS: Record<string, string> = {
    SURAT_MASUK: "Surat Masuk",
    UNDANGAN: "Undangan",
    SURAT_TUGAS: "Surat Tugas",
    SURAT_KELUAR: "Surat Keluar",
    SK_DIREKTUR: "SK Direktur",
    PERJANJIAN: "Perjanjian",
    PERATURAN_DIREKTUR: "Peraturan Direktur",
  };
  const groupedArchive = archivedDocs.reduce((acc, doc) => {
    const type = doc.documentType ?? "SURAT_MASUK";
    if (!acc[type]) acc[type] = [];
    acc[type].push(doc);
    return acc;
  }, {} as Record<string, typeof archivedDocs>);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/admin" className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="page-title">Pengarsipan Digital</h1>
          <p className="page-subtitle">Kelola dan arsipkan dokumen final ke database/server</p>
        </div>
      </div>

      {/* Antrian Arsip */}
      <FadeIn delay={0.1} className="card">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Archive className="w-5 h-5 text-teal-600" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Antrian Arsip</h2>
            {antrianDocs.length > 0 && (
              <span className="px-2 py-0.5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 text-xs font-bold rounded-full">
                {antrianDocs.length}
              </span>
            )}
          </div>
        </div>

        {antrianDocs.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={CheckCircle}
              title="Tidak ada antrian arsip"
              description="Semua dokumen sudah diarsipkan."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-th">No. Surat</th>
                  <th className="table-th">Perihal</th>
                  <th className="table-th">Dari</th>
                  <th className="table-th">Keputusan Direktur</th>
                  <th className="table-th">Lihat Berkas</th>
                  <th className="table-th text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-100 dark:divide-slate-800">
                {antrianDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                    <td className="table-td font-mono text-xs text-blue-700 dark:text-blue-400 whitespace-nowrap">
                      {doc.nomorSurat}
                    </td>
                    <td className="table-td max-w-xs">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{doc.perihal}</p>
                        {doc.isImportant && (
                          <span className="px-1.5 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-bold rounded">PENTING</span>
                        )}
                      </div>
                    </td>
                    <td className="table-td whitespace-nowrap">
                      <p className="font-medium">{doc.createdBy.name}</p>
                      <p className="text-xs text-gray-400">{doc.createdBy.divisi ?? "-"}</p>
                    </td>
                    <td className="table-td">
                      {doc.decisions[0] ? (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          doc.decisions[0].decisionType === "DISETUJUI"
                            ? "bg-green-100 text-green-700"
                            : doc.decisions[0].decisionType === "DITOLAK"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {doc.decisions[0].decisionType}
                        </span>
                      ) : <span className="text-gray-400 text-xs">-</span>}
                    </td>
                    <td className="table-td">
                      <a
                        href={`/dashboard/admin/arsip/${doc.id}/cetak-gabungan`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1 font-medium bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded w-fit"
                      >
                        <Eye className="w-3.5 h-3.5" /> Pratinjau
                      </a>
                    </td>
                    <td className="table-td text-center">
                      <Link
                        href={`/dashboard/admin/arsip/${doc.id}`}
                        className="btn-primary text-xs px-3 py-1.5"
                      >
                        <Archive className="w-3.5 h-3.5" /> Arsipkan
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </FadeIn>

      {/* Riwayat arsip — dikelompokkan per jenis surat */}
      <FadeIn delay={0.2} className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Riwayat Arsip Tersimpan</h2>
        <Suspense>
          <ArsipFilter />
        </Suspense>
      </FadeIn>

      {archivedDocs.length === 0 ? (
        <FadeIn delay={0.3} className="card p-4">
          <EmptyState title="Belum ada arsip" description="Dokumen yang diarsipkan akan muncul di sini." />
        </FadeIn>
      ) : (
        Object.entries(groupedArchive).map(([type, docs], index) => (
          <FadeIn key={type} delay={0.3 + (index * 0.1)} className="card">
            <div className="px-5 py-3 border-b border-gray-100 dark:border-slate-800 flex items-center gap-2">
              <Archive className="w-4 h-4 text-teal-600" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Arsip {DOCUMENT_TYPE_LABELS[type] ?? type}
              </h3>
              <span className="ml-auto px-2 py-0.5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 text-xs font-bold rounded-full">
                {docs.length}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="table-th">No. Surat</th>
                    <th className="table-th">Perihal</th>
                    <th className="table-th">Dari</th>
                    <th className="table-th">Tanggal Arsip</th>
                    <th className="table-th text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-100 dark:divide-slate-800">
                  {docs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                      <td className="table-td font-mono text-xs text-blue-700 dark:text-blue-400">{doc.nomorSurat}</td>
                      <td className="table-td max-w-xs">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-medium">{doc.perihal}</p>
                          {doc.isImportant && (
                            <span className="px-1.5 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-bold rounded">PENTING</span>
                          )}
                        </div>
                      </td>
                      <td className="table-td">{doc.createdBy.name}</td>
                      <td className="table-td whitespace-nowrap text-gray-500 dark:text-gray-400">
                        {doc.archive
                          ? format(new Date(doc.archive.archivedAt), "dd MMM yyyy", { locale: localeId })
                          : "-"}
                      </td>
                      <td className="table-td text-center">
                        <Link
                          href={`/dashboard/admin/arsip/${doc.id}`}
                          className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-2.5 py-1.5 rounded-lg transition-colors font-medium border border-blue-100 dark:border-blue-900/50"
                        >
                          <Eye className="w-3.5 h-3.5" /> Detail
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FadeIn>
        ))
      )}
    </div>
  );
}
