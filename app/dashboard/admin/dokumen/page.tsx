// app/dashboard/admin/dokumen/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DocumentTable } from "@/components/documents/DocumentTable";
import { Pagination } from "@/components/ui/Pagination";
import { ArrowLeft, FileText, Search, Calendar, MailOpen, Send, Briefcase, Award, Handshake, ScrollText, Layers } from "lucide-react";
import Link from "next/link";
import { Prisma, DocumentType } from "@prisma/client";
import { Suspense } from "react";
import { DOCUMENT_TYPE_LABELS } from "@/types";

const PAGE_SIZE = 15;

// Tab configuration with icons and colors
const TABS: { key: string; label: string; icon: string; documentType?: DocumentType; color: string; darkColor: string }[] = [
  { key: "SEMUA",             label: "Semua",              icon: "layers",                                       color: "bg-blue-600",    darkColor: "dark:bg-blue-500" },
  { key: "SURAT_MASUK",       label: "Surat Masuk",        icon: "mailopen", documentType: "SURAT_MASUK",        color: "bg-blue-600",    darkColor: "dark:bg-blue-500" },
  { key: "UNDANGAN",          label: "Undangan",           icon: "calendar", documentType: "UNDANGAN",           color: "bg-purple-600",  darkColor: "dark:bg-purple-500" },
];

type Params = { searchParams: Promise<{ q?: string; date?: string; page?: string; type?: string }> };

export default async function AdminSemuaDokumenPage(props: Params) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "AGENDARIS") redirect("/dashboard");

  const searchParams = await props.searchParams;
  const q = searchParams.q ?? "";
  const date = searchParams.date ?? "";
  const page = Math.max(1, parseInt(searchParams.page ?? "1") || 1);
  const activeType = searchParams.type ?? "SEMUA";

  const where: Prisma.SuratMasukWhereInput = {
    currentStatus: { not: "ARSIP_FINAL_TERSIMPAN" }
  };


  // Filter by document type
  const activeTab = TABS.find((t) => t.key === activeType);
  if (activeTab?.documentType) {
    where.documentType = activeTab.documentType;
  }

  if (q) {
    where.OR = [
      { perihal: { contains: q, mode: "insensitive" } },
      { asalSurat: { contains: q, mode: "insensitive" } },
      { nomorSurat: { contains: q, mode: "insensitive" } },
      { createdBy: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    where.tanggalSurat = {
      gte: startOfDay,
      lte: endOfDay,
    };
  }

  // Get counts per document type (for tab badges)
  const [totalItems, documents, typeCounts] = await Promise.all([
    prisma.suratMasuk.count({ where }),
    prisma.suratMasuk.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true, divisi: true } },
      },
      orderBy: { tanggalSurat: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.suratMasuk.groupBy({
      by: ["documentType"],
      _count: { id: true },
    }),
  ]);

  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  // Build count map
  const countMap: Record<string, number> = { SEMUA: 0 };
  typeCounts.forEach((tc) => {
    countMap[tc.documentType] = tc._count.id;
    countMap.SEMUA = (countMap.SEMUA ?? 0) + tc._count.id;
  });

  // Build search params string without type and page
  const baseParams = new URLSearchParams();
  if (q) baseParams.set("q", q);
  if (date) baseParams.set("date", date);
  const baseParamsStr = baseParams.toString();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/admin" className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-slate-400" />
          </Link>
          <div>
            <h1 className="page-title flex items-center gap-2">
              <Layers className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              Pusat Dokumen
            </h1>
            <p className="page-subtitle">
              Lihat dan kelola semua dokumen berdasarkan jenis surat.
            </p>
          </div>
        </div>
      </div>

      {/* Document Type Tabs */}
      <div className="overflow-x-auto pb-1">
        <div className="flex gap-2 min-w-max">
          {TABS.map((tab) => {
            const isActive = activeType === tab.key;
            const count = countMap[tab.key] ?? 0;
            const href = `/dashboard/admin/dokumen?type=${tab.key}${baseParamsStr ? `&${baseParamsStr}` : ""}`;
            return (
              <Link
                key={tab.key}
                href={href}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap
                  ${isActive
                    ? `${tab.color} ${tab.darkColor} text-white shadow-lg shadow-blue-600/20`
                    : "bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700"
                  }
                `}
              >
                {tab.label}
                <span className={`
                  text-xs px-1.5 py-0.5 rounded-full font-bold
                  ${isActive ? "bg-white/20 text-white" : "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400"}
                `}>
                  {count}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <form className="card p-4">
        <input type="hidden" name="type" value={activeType} />
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4">
          {/* Search Input */}
          <div className="md:col-span-6 relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
            </div>
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Cari perihal, pengirim, atau nomor surat..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-lg text-sm transition-all outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder-gray-400 dark:placeholder-slate-500 text-gray-800 dark:text-white"
            />
          </div>

          {/* Date Input */}
          <div className="md:col-span-4 relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Calendar className="h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
            </div>
            <input
              type="date"
              name="date"
              defaultValue={date}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-lg text-sm transition-all outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-gray-700 dark:text-white"
            />
          </div>

          {/* Action Buttons */}
          <div className="md:col-span-2 flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all shadow-sm shadow-blue-600/20 active:scale-[0.98]"
            >
              Cari
            </button>
            {(q || date) && (
              <Link
                href={`/dashboard/admin/dokumen?type=${activeType}`}
                className="py-2.5 px-3 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-600 dark:text-slate-300 text-sm font-medium rounded-lg transition-all"
              >
                Reset
              </Link>
            )}
          </div>
        </div>
      </form>

      {/* Document Table */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {activeTab?.label ?? "Semua"} 
              <span className="text-gray-400 dark:text-slate-500 font-normal ml-2">({totalItems} dokumen)</span>
            </h2>
          </div>
        </div>
        <div className="p-4 space-y-4">
          <DocumentTable
            documents={documents}
            basePath="/dashboard/admin"
            showCreator={true}
            showDocType={activeType === "SEMUA"}
            emptyTitle={q || date ? "Pencarian tidak ditemukan" : "Tidak ada dokumen"}
            emptyDesc={
              q || date
                ? "Tidak ada dokumen yang sesuai dengan kata kunci atau tanggal pencarian."
                : activeTab?.documentType
                  ? `Belum ada dokumen berjenis "${activeTab.label}" di sistem.`
                  : "Sistem belum memiliki dokumen satupun."
            }
          />
          <Suspense>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={PAGE_SIZE}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
