// components/documents/ArsipFilter.tsx
/**
 * @file components/documents/ArsipFilter.tsx
 * @description Komponen UI untuk filter pencarian dan pengurutan (sorting) daftar arsip di tabel.
 * @location Dirender di halaman daftar arsip ("/dashboard/admin/arsip").
 */
"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const BULAN = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];

export function ArsipFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const bulan = params.get("bulan") ?? "";
  const tahun = params.get("tahun") ?? "";

  const update = useCallback((key: string, val: string) => {
    const sp = new URLSearchParams(params.toString());
    if (val) sp.set(key, val);
    else sp.delete(key);
    router.push(`?${sp.toString()}`);
  }, [params, router]);

  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => thisYear - i);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Filter:</span>
      <select
        value={bulan}
        onChange={(e) => update("bulan", e.target.value)}
        className="form-input py-1.5 text-sm w-36"
      >
        <option value="">Semua Bulan</option>
        {BULAN.map((b, i) => (
          <option key={i + 1} value={String(i + 1)}>{b}</option>
        ))}
      </select>
      <select
        value={tahun}
        onChange={(e) => update("tahun", e.target.value)}
        className="form-input py-1.5 text-sm w-28"
      >
        <option value="">Semua Tahun</option>
        {years.map((y) => (
          <option key={y} value={String(y)}>{y}</option>
        ))}
      </select>
      <select
        value={params.get("prioritas") ?? ""}
        onChange={(e) => update("prioritas", e.target.value)}
        className="form-input py-1.5 text-sm w-32"
      >
        <option value="">Semua Prioritas</option>
        <option value="true">Penting</option>
        <option value="false">Normal</option>
      </select>
      {(bulan || tahun || params.get("prioritas")) && (
        <button
          onClick={() => router.push("?")}
          className="text-xs text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 underline"
        >
          Reset
        </button>
      )}
      <div className="w-px h-5 bg-gray-300 dark:bg-slate-700 mx-1" />
      <button
        onClick={() => {
          const sp = new URLSearchParams(params.toString());
          window.open(`/api/documents/export?${sp.toString()}`, "_blank");
        }}
        className="flex items-center gap-1.5 btn-secondary py-1.5 px-3 text-xs"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
        Export Excel
      </button>
    </div>
  );
}
