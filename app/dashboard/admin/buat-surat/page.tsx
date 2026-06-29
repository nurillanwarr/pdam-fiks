// app/dashboard/admin/buat-surat/page.tsx
"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  FileText, Loader2, ArrowLeft, Send, Calendar, MailOpen,
  Briefcase, Award, Handshake, ScrollText, Plus, MapPin, Clock,
} from "lucide-react";
import { FileUpload } from "@/components/documents/FileUpload";
import { FadeIn } from "@/components/ui/FadeIn";
import { DOCUMENT_TYPE_LABELS } from "@/types";
import type { DocumentType, DocumentCategory } from "@prisma/client";

const DOC_TYPE_OPTIONS: { type: DocumentType; label: string; icon: React.ElementType; color: string }[] = [
  { type: "UNDANGAN", label: "Undangan", icon: Calendar, color: "border-purple-200 bg-purple-50 text-purple-800 hover:border-purple-500" },
  { type: "SURAT_MASUK", label: "Surat Masuk", icon: MailOpen, color: "border-blue-200 bg-blue-50 text-blue-800 hover:border-blue-500" },
  /* { type: "SURAT_TUGAS", label: "Surat Tugas", icon: Briefcase, color: "border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-500" },
  { type: "SURAT_KELUAR", label: "Surat Keluar", icon: Send, color: "border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-500" },
  { type: "SK_DIREKTUR", label: "SK Direktur", icon: Award, color: "border-red-200 bg-red-50 text-red-800 hover:border-red-500" },
  { type: "PERJANJIAN", label: "Perjanjian", icon: Handshake, color: "border-cyan-200 bg-cyan-50 text-cyan-800 hover:border-cyan-500" },
  { type: "PERATURAN_DIREKTUR", label: "Peraturan Direktur", icon: ScrollText, color: "border-orange-200 bg-orange-50 text-orange-800 hover:border-orange-500" }, */
];



function BuatSuratContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedType = searchParams.get("type") as DocumentType | null;

  const [form, setForm] = useState({
    nomorSurat: "",
    perihal: "",
    deskripsi: "",
    asalSurat: "",
    tanggalSurat: new Date().toISOString().split("T")[0],
    documentType: preselectedType || ("SURAT_MASUK" as DocumentType),
    category: "DLL" as DocumentCategory,
    nomorAgenda: "",
    tanggalTerima: new Date().toISOString().split("T")[0],
    tanggalPenyelesaian: "",
  });

  const [undangan, setUndangan] = useState({
    hari: "",
    jam: "",
    tanggal: new Date().toISOString().split("T")[0],
    tempat: "",
    media: "OFFLINE" as "ONLINE" | "OFFLINE",
    detailMedia: "",
    dresscode: "",
    catatanLain: "",
    deadline: new Date().toISOString().split("T")[0],
  });

  const setUnd = (key: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setUndangan((p) => ({ ...p, [key]: e.target.value }));

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [createdDocId, setCreatedDocId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isFileUploaded, setIsFileUploaded] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.perihal.trim() || form.perihal.length < 5)
      newErrors.perihal = "Perihal minimal 5 karakter.";
    if (!form.tanggalSurat) newErrors.tanggalSurat = "Tanggal surat wajib diisi.";

    if (form.documentType === "UNDANGAN") {
      if (!undangan.hari) newErrors.undanganHari = "Hari kegiatan wajib dipilih.";
      if (!undangan.jam) newErrors.undanganJam = "Jam kegiatan wajib diisi.";
      if (!undangan.tanggal) newErrors.undanganTanggal = "Tanggal kegiatan wajib diisi.";
      if (undangan.media === "OFFLINE" && !undangan.tempat.trim()) {
        newErrors.undanganTempat = "Tempat kegiatan wajib diisi untuk media luring.";
      }
      if (undangan.media === "ONLINE" && !undangan.detailMedia.trim()) {
        newErrors.undanganDetailMedia = "Detail media wajib diisi jika daring.";
      }
    }

    setErrors(newErrors);

    // Tampilkan toast error jika ada validasi undangan yang gagal
    if (Object.keys(newErrors).some(k => k.startsWith("undangan"))) {
      toast.error("Mohon lengkapi semua field wajib pada Detail Kegiatan Undangan.");
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload: any = form.documentType === "UNDANGAN"
        ? { ...form, undangan }
        : { ...form };
        
      // Clean up empty strings so Zod .optional() works properly
      if (!payload.nomorSurat) delete payload.nomorSurat;
      if (!payload.deskripsi) delete payload.deskripsi;
      if (!payload.asalSurat) delete payload.asalSurat;
      if (!payload.nomorAgenda) delete payload.nomorAgenda;
      if (!payload.tanggalPenyelesaian) delete payload.tanggalPenyelesaian;

      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal menyimpan.");
      toast.success("Dokumen berhasil dibuat! Silakan upload file.");
      setCreatedDocId(json.data.id);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!createdDocId) return;
    setSubmitting(true);
    try {
      // Actually Agendaris already created the doc and it's MENUNGGU_REVIEW_AGENDARIS.
      // So this "Proses Dokumen" is just redirecting them back to dashboard, 
      // or calling a submit API if needed. Since it's already created, 
      // they just want to go back to dashboard.
      toast.success("Dokumen siap diproses oleh Direktur");
      router.push(`/dashboard/admin/arsip/${createdDocId}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setSubmitting(false);
    }
  };



  const set = (key: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const selectedTypeInfo = DOC_TYPE_OPTIONS.find(t => t.type === form.documentType);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/admin" className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-slate-400" />
        </Link>
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Plus className="w-6 h-6 text-blue-600" />
            Buat Dokumen Baru
          </h1>
          <p className="page-subtitle">Agendaris — Buat surat baru dari 2 jenis dokumen</p>
        </div>
      </div>

      {/* Step 1: Pilih Jenis Surat */}
      <FadeIn delay={0.1} className="card p-6 space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-gray-900 dark:text-white">1. Pilih Jenis Surat</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {DOC_TYPE_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isSelected = form.documentType === opt.type;
            return (
              <button
                key={opt.type}
                onClick={() => setForm(p => ({ ...p, documentType: opt.type }))}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-sm font-medium transition-all cursor-pointer
                    ${isSelected
                    ? `${opt.color} ring-2 ring-offset-1 ring-current shadow-md scale-[1.02]`
                    : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                  }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs text-center leading-tight">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </FadeIn>

      {/* Step 2: Form */}
      <FadeIn delay={0.2} className="card p-6 space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-gray-900 dark:text-white">
            2. Informasi Dokumen
          </h2>
          {selectedTypeInfo && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${selectedTypeInfo.color}`}>
              {selectedTypeInfo.label}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="form-label">Nomor Surat <span className="text-gray-400 dark:text-slate-500 text-xs">(opsional, auto-generate)</span></label>
            <input
              className="form-input"
              placeholder="Contoh: 001/ADM/PDAM/2025"
              value={form.nomorSurat}
              onChange={set("nomorSurat")}
              disabled={!!createdDocId}
            />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="form-label">Tanggal Surat <span className="text-red-500">*</span></label>
            <input
              type="date"
              className="form-input"
              value={form.tanggalSurat}
              onChange={set("tanggalSurat")}
              disabled={!!createdDocId}
            />
            {errors.tanggalSurat && <p className="form-error">{errors.tanggalSurat}</p>}
          </div>
        </div>

        <div>
          <label className="form-label">Perihal <span className="text-red-500">*</span></label>
          <input
            className="form-input"
            placeholder="Perihal / pokok surat"
            value={form.perihal}
            onChange={set("perihal")}
            disabled={!!createdDocId}
          />
          {errors.perihal && <p className="form-error">{errors.perihal}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Nomor Agenda <span className="text-red-500">*</span></label>
            <input
              className="form-input font-mono"
              placeholder="Contoh: 120/AGD/2026"
              value={form.nomorAgenda}
              onChange={set("nomorAgenda")}
              disabled={!!createdDocId}
              type="text"
            />
          </div>
          <div>
            <label className="form-label">Tanggal Terima <span className="text-red-500">*</span></label>
            <input
              type="date"
              className="form-input"
              value={form.tanggalTerima}
              onChange={set("tanggalTerima")}
              disabled={!!createdDocId}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Asal Surat</label>
            <input
              className="form-input"
              placeholder="Contoh: Dinas PU Kota Malang"
              value={form.asalSurat}
              onChange={set("asalSurat")}
              disabled={!!createdDocId}
            />
          </div>
          <div>
            <label className="form-label">Target Tanggal Penyelesaian</label>
            <input
              type="date"
              className="form-input"
              value={form.tanggalPenyelesaian}
              onChange={set("tanggalPenyelesaian")}
              disabled={!!createdDocId} 
            />
          </div>
        </div>

        <div>
          <label className="form-label">Keterangan / Deskripsi</label>
          <textarea
            className="form-input resize-none"
            rows={3}
            placeholder="Tuliskan deskripsi atau keterangan tambahan..."
            value={form.deskripsi}
            onChange={set("deskripsi")}
            disabled={!!createdDocId}
          />
        </div>

        {/* Undangan-specific fields */}
        {form.documentType === "UNDANGAN" && (
          <div className="border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-purple-900 dark:text-purple-200 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Detail Kegiatan Undangan
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Hari <span className="text-red-500">*</span></label>
                <select
                  className="form-input"
                  value={undangan.hari}
                  onChange={setUnd("hari")}
                  disabled={!!createdDocId}
                >
                  <option value="">Pilih hari...</option>
                  <option value="Senin">Senin</option>
                  <option value="Selasa">Selasa</option>
                  <option value="Rabu">Rabu</option>
                  <option value="Kamis">Kamis</option>
                  <option value="Jumat">Jumat</option>
                  <option value="Sabtu">Sabtu</option>
                  <option value="Minggu">Minggu</option>
                </select>
              </div>
              <div>
                <label className="form-label font-semibold text-gray-700 mb-1 block">Jam Acara <span className="text-red-500">*</span></label>

                <div className="relative">
                  <input
                    type="time"
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl hover:border-purple-200 transition-all text-gray-900 font-medium disabled:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none"
                    value={undangan.jam}
                    onChange={setUnd("jam")}
                    disabled={!!createdDocId}
                  />
                  <Clock className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none bg-white" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Tanggal Kegiatan <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  className="form-input"
                  value={undangan.tanggal}
                  onChange={setUnd("tanggal")}
                  disabled={!!createdDocId}
                />
              </div>
              <div>
                <label className="form-label">Deadline Konfirmasi</label>
                <input
                  type="date"
                  className="form-input"
                  value={undangan.deadline}
                  onChange={setUnd("deadline")}
                  disabled={!!createdDocId}
                />
              </div>
            </div>

            <div>
              <label className="form-label">
                Tempat {undangan.media === "OFFLINE" && <span className="text-red-500">*</span>}
              </label>
              <input
                className="form-input"
                placeholder="Contoh: Ruang Rapat Utama Lt. 2"
                value={undangan.tempat}
                onChange={setUnd("tempat")}
                disabled={!!createdDocId}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Media</label>
                <div className="flex gap-2">
                  {(["OFFLINE", "ONLINE"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => !createdDocId && setUndangan(p => ({ ...p, media: m }))}
                      disabled={!!createdDocId}
                      className={`flex-1 px-3 py-2 rounded-lg border text-xs font-medium transition-all text-center cursor-pointer
                        ${undangan.media === m
                          ? "border-purple-500 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 ring-1 ring-purple-300"
                          : "border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-gray-300"
                        }`}
                    >
                      {m === "ONLINE" ? "Daring" : "Luring"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="col-span-2">
                <label className="form-label">Pakaian</label>
                <input
                  className="form-input"
                  placeholder="Contoh: Batik, PDH, dll."
                  value={undangan.dresscode}
                  onChange={setUnd("dresscode")}
                  disabled={!!createdDocId}
                />
              </div>
            </div>

            {undangan.media === "ONLINE" && (
              <div>
                <label className="form-label">Detail Media / Link <span className="text-red-500">*</span></label>
                <input
                  className="form-input"
                  placeholder="Contoh: Zoom Meeting, Google Meet, dll."
                  value={undangan.detailMedia}
                  onChange={setUnd("detailMedia")}
                  disabled={!!createdDocId}
                />
              </div>
            )}

            <div>
              <label className="form-label">Catatan Kegiatan</label>
              <textarea
                className="form-input resize-none"
                rows={2}
                placeholder="Catatan tambahan terkait kegiatan undangan..."
                value={undangan.catatanLain}
                onChange={setUnd("catatanLain")}
                disabled={!!createdDocId}
              />
            </div>
          </div>
        )}


        {!createdDocId && (
          <button
            onClick={handleSave}
            disabled={loading}
            className="btn-primary w-full justify-center"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : "Simpan Dokumen"}
          </button>
        )}
      </FadeIn>

      {/* Step 3: Upload */}
      {createdDocId && (
        <FadeIn delay={0.3} className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">3. Upload File Dokumen</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Upload file scan dokumen (PDF, JPG, atau PNG, maks. 10MB).
          </p>
          <FileUpload
            documentId={createdDocId}
            fileType="FINAL_SCAN" // Agendaris usually uploads FINAL_SCAN or DRAFT, let's use FINAL_SCAN since they are admin
            label="File Scan Dokumen"
            onSuccess={() => setIsFileUploaded(true)}
          />
        </FadeIn>
      )}

      {/* Step 4: Submit / Selesai */}
      {createdDocId && (
        <FadeIn delay={0.4} className="card p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-2">4. Selesai</h2>
          <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
            File dokumen wajib di-upload untuk dapat menyelesaikan proses disposisi.
          </p>
          <div className="flex flex-col gap-3">
            {!isFileUploaded && (
              <p className="text-xs text-red-500 font-semibold animate-pulse">
                * Harap unggah file dokumen terlebih dahulu sebelum menyelesaikan.
              </p>
            )}
            <div className="flex gap-3">
              <Link
                href={`/dashboard/admin/arsip/${createdDocId}`}
                className="btn-secondary flex-1 justify-center"
              >
                Lihat Detail
              </Link>
              <button
                onClick={handleSubmitForReview}
                disabled={submitting || !isFileUploaded}
                className="btn-primary flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" /> Selesai & Teruskan ke Direktur
              </button>
            </div>
          </div>
        </FadeIn>
      )}
    </div>
  );
}

export default function BuatSuratPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>}>
      <BuatSuratContent />
    </Suspense>
  );
}
