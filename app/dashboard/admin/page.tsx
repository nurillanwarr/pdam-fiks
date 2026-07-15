// app/dashboard/admin/page.tsx
/**
 * @file app/dashboard/admin/page.tsx
 * @description Dashboard utama untuk role AGENDARIS (Admin/Agendaris). Menampilkan ringkasan data dokumen, tugas aktif, dan metrik sistem.
 * @location Ditampilkan pada URL "/dashboard/admin".
 */
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ROLE_LABELS } from "@/types";
import { UserRole, DocumentStatus } from "@prisma/client";
import {
  FileText, Users, Archive, CheckCircle, Eye, ArrowRight,
  Activity, Clock, Plus, Calendar as CalendarIcon, MessageCircle,
} from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "AGENDARIS") redirect("/dashboard");

  const [
    totalDokumen, totalUser, menungguArsip, arsipFinal,
    menungguKeputusan, keputusanSelesai, jadwalTerdekat, docPerStatus, 
  ] = await Promise.all([
    prisma.suratMasuk.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.suratMasuk.count({ where: { currentStatus: { in: ["MENUNGGU_ARSIP_ADMIN", "KEPUTUSAN_DIREKTUR_SELESAI"] } } }),
    prisma.suratMasuk.count({ where: { currentStatus: "ARSIP_FINAL_TERSIMPAN" } }),
    prisma.suratMasuk.findMany({
      where: { currentStatus: { in: ["MENUNGGU_KEPUTUSAN_DIREKTUR", "DIPROSES_DIREKTUR"] } },
      include: { createdBy: { select: { name: true, divisi: true } } },
      orderBy: { tanggalSurat: "desc" },
      take: 5,
    }),
    prisma.suratMasuk.findMany({
      where: { currentStatus: { in: ["KEPUTUSAN_DIREKTUR_SELESAI", "PERLU_REVISI"] } },
      include: { createdBy: { select: { name: true, divisi: true } } },
      orderBy: { tanggalSurat: "desc" },
      take: 5,
    }),
    prisma.undangan.findMany({
      where: { tanggal: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      include: { 
        suratMasuk: true,
        penerima: { include: { user: { select: { email: true } } } }
      },
      orderBy: { tanggal: "asc" },
      take: 5,
    }),
    prisma.suratMasuk.groupBy({
      by: ["currentStatus"],
      _count: { currentStatus: true },
    }),
  ]);

  const statusCounts = Object.fromEntries(
    docPerStatus.map((d) => [d.currentStatus, d._count.currentStatus])
  );

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Administrator</h1>
          <p className="page-subtitle">Monitoring sistem dan pengelolaan arsip digital</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/admin/buat-surat" className="btn-primary bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4" /> Buat Surat Baru
          </Link>
          <Link href="/dashboard/admin/users" className="btn-secondary">
            <Users className="w-4 h-4" /> Kelola User
          </Link>
          {/* <Link href="/dashboard/admin/arsip" className="btn-primary">
            <Archive className="w-4 h-4" /> Arsip ({menungguArsip})
          </Link> */}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <FadeIn delay={0.1}>
          <StatCard title="Total Dokumen" value={totalDokumen} icon={FileText} color="blue" />
        </FadeIn>
        <FadeIn delay={0.2}>
          <StatCard title="User Aktif" value={totalUser} icon={Users} color="green" />
        </FadeIn>
        <FadeIn delay={0.3}>
          <StatCard title="Antrian Arsip" value={menungguArsip} icon={Clock} color="yellow" subtitle="Perlu diarsipkan" />
        </FadeIn>
        <FadeIn delay={0.4}>
          <StatCard title="Arsip Selesai" value={arsipFinal} icon={CheckCircle} color="purple" />
        </FadeIn>
      </div>

      {/* Alert arsip */}
      {menungguArsip > 0 && (
        <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Archive className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <div>
              <p className="text-sm font-semibold text-teal-900 dark:text-teal-200">
                {menungguArsip} dokumen menunggu pengarsipan
              </p>
              <p className="text-xs text-teal-700 dark:text-teal-400">Scan final sudah ada. Segera arsipkan ke server.</p>
            </div>
          </div>
          <Link href="/dashboard/admin/arsip" className="btn-primary bg-teal-600 hover:bg-teal-700 text-xs">
            Buka Arsip <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menunggu Keputusan Direktur */}
        <FadeIn delay={0.5} className="card flex flex-col h-full">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white">Menunggu Keputusan Direktur</h2>
            <Link href="/dashboard/admin/dokumen" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
              Semua <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {menungguKeputusan.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400 dark:text-slate-500 flex-grow flex items-center justify-center">
              Semua dokumen sudah diproses Direktur.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-slate-800 flex-grow">
              {menungguKeputusan.map((doc) => (
                <div key={doc.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs text-blue-700 dark:text-blue-400">{doc.nomorSurat}</p>
                    <p className="text-sm text-gray-800 dark:text-slate-200 truncate font-medium">{doc.perihal}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      <StatusBadge status={doc.currentStatus} size="sm" />
                    </p>
                  </div>
                  <Link href={`/dashboard/admin/dokumen/${doc.id}`}
                    className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium text-xs flex items-center gap-1">
                    Cek <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </FadeIn>

        {/* Hasil Keputusan Direktur */}
        <FadeIn delay={0.6} className="card flex flex-col h-full border-green-100 dark:border-green-900/30">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-green-50/50 dark:bg-green-950/10 rounded-t-xl">
            <h2 className="font-semibold text-green-900 dark:text-green-300">Hasil Keputusan Direktur</h2>
            <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold dark:bg-green-900 dark:text-green-200">Terbaru</span>
          </div>
          {keputusanSelesai.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400 dark:text-slate-500 flex-grow flex items-center justify-center">
              Belum ada keputusan baru dari Direktur.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-slate-800 flex-grow">
              {keputusanSelesai.map((doc) => (
                <div key={doc.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs text-green-700 dark:text-green-400">{doc.nomorSurat || "Tanpa Nomor"}</p>
                    <p className="text-sm text-gray-800 dark:text-slate-200 truncate font-medium">{doc.perihal}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      <StatusBadge status={doc.currentStatus} size="sm" />
                    </p>
                  </div>
                  <Link href={`/dashboard/admin/dokumen/${doc.id}`}
                    className="p-1.5 hover:bg-green-50 dark:hover:bg-green-900/30 rounded text-green-600 dark:text-green-400 hover:text-green-700 font-medium text-xs flex items-center gap-1">
                    Detail <ArrowRight className="w-3 h-3 text-green-600" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </FadeIn>

        {/* Jadwal Terdekat (Undangan) */}
        <FadeIn delay={0.7} className="card flex flex-col h-full">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white">Jadwal Terdekat (Undangan)</h2>
            <Link href="/dashboard/admin/dokumen" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
              Jadwal <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {jadwalTerdekat.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400 dark:text-slate-500 flex-grow flex items-center justify-center">
              Tidak ada jadwal undangan terdekat.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-slate-800 flex-grow">
              {jadwalTerdekat.map((undangan) => {
                const dateStr = format(new Date(undangan.tanggal), 'yyyyMMdd');
                const gcalTitle = encodeURIComponent(undangan.suratMasuk.perihal);
                const gcalDetails = encodeURIComponent("Terkait surat: " + undangan.suratMasuk.nomorSurat);
                const gcalLocation = encodeURIComponent(undangan.tempat);
                
                // Get all emails from invitees
                const guestEmails = undangan.penerima
                  .map(p => p.user.email)
                  .filter(Boolean)
                  .join(',');
                
                const addGuestsParam = guestEmails ? `&add=${encodeURIComponent(guestEmails)}` : '';
                const gcalLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${gcalTitle}&details=${gcalDetails}&location=${gcalLocation}&dates=${dateStr}T010000Z/${dateStr}T030000Z${addGuestsParam}`;


                return (
                  <div key={undangan.id} className="flex items-start gap-3 px-5 py-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-indigo-500 uppercase leading-none">{format(new Date(undangan.tanggal), 'MMM', { locale: localeId })}</span>
                      <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300 leading-none mt-0.5">{format(new Date(undangan.tanggal), 'dd')}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-slate-200 truncate">{undangan.suratMasuk.perihal}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                        {undangan.jam} • {undangan.tempat}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <a href={gcalLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded text-[10px] font-medium transition-colors">
                          <CalendarIcon className="w-3 h-3 text-blue-500" /> Google Calendar
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </FadeIn>
      </div>

      {/* Status distribution */}
      <FadeIn delay={0.8} className="card p-5">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Distribusi Status Dokumen
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Object.entries(statusCounts).map(([status, count]) => (
            <div key={status} className="text-center p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
              <StatusBadge status={status as DocumentStatus} size="sm" />
            </div>
          ))}
        </div>
      </FadeIn>
    </div>
  );
}
