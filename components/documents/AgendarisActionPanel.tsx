// components/documents/AgendarisActionPanel.tsx
/**
 * @file components/documents/AgendarisActionPanel.tsx
 * @description Komponen aksi bagi Agendaris untuk memproses dokumen (menerima, menolak, meneruskan ke Direktur).
 * @location Dirender di halaman detail inbox agendaris ("/dashboard/admin/inbox/[id]").
 */
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Send, RotateCcw, Bell, Loader2, GitBranch, Clock, Archive, FileText } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface StaffUser { id: string; name: string; divisi: string | null }
interface DocProps {
  id: string;
  currentStatus: string;
  nomorSurat?: string;
  perihal?: string;
  tanggalSurat?: Date | string;
  tanggalTerima?: Date | string;
  asalSurat?: string | null;
  nomorAgenda?: string | null;
  documentType?: string;
  files?: any[];
  category?: string;
  undangan?: {
    hari: string;
    tanggal: Date | string;
    deadline: Date | string;
    jam: string;
    tempat: string;
    media: "ONLINE" | "OFFLINE";
    dresscode: string | null;
    catatanLain: string | null;
    undanganType: "INTERNAL" | "EXTERNAL";
    pengirimExternal: string | null;
    kontakExternal: string | null;
    penerima: { userId: string }[];
  } | null;
}

type Mode = "idle" | "teruskan" | "kembalikan" | "disposisi_masuk" | "disposisi_undangan";
type WaktuKirim = "LANGSUNG" | "BESOK_PAGI" | "BESOK_SIANG" | "LUSA_PAGI" | "LUSA_SIANG";

const WAKTU_OPTIONS: { value: WaktuKirim; label: string }[] = [
  { value: "LANGSUNG",    label: "Langsung sekarang" },
  { value: "BESOK_PAGI",  label: "Besok pagi (07:00)" },
  { value: "BESOK_SIANG", label: "Besok siang (09:00)" },
  { value: "LUSA_PAGI",   label: "Lusa pagi (07:00)" },
  { value: "LUSA_SIANG",  label: "Lusa siang (09:00)" },
];

export function AgendarisActionPanel({
  doc,
  staffUsers = [],
  existingDisposisi = null,
}: {
  doc: DocProps;
  staffUsers?: StaffUser[];
  existingDisposisi?: {
    jabatanKe: string | null;
    instruksi: string | null;
    keterangan: string | null;
  } | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>("idle");

  // Teruskan state
  const [reviewNote, setReviewNote] = useState("");
  const [waktu, setWaktu] = useState<WaktuKirim>("LANGSUNG");
  const [isUrgen, setIsUrgen] = useState(false);

  // Kembalikan state
  const [revisiNote, setRevisiNote] = useState("");

  // Disposisi state — dihapus (Agendaris tidak mengisi disposisi kepada/instruksi)
  // Hanya meneruskan dokumen ke Direktur

  // Editable document fields (Agendaris dapat mengoreksi saat buat disposisi)
  const toDateInput = (d?: Date | string) =>
    d ? new Date(d as string).toISOString().split("T")[0] : "";
  const [editNomorSurat, setEditNomorSurat] = useState(doc.nomorSurat ?? "");
  const [editPerihal, setEditPerihal] = useState(doc.perihal ?? "");
  const [editTanggalSurat, setEditTanggalSurat] = useState(toDateInput(doc.tanggalSurat));
  const [editTanggalTerima, setEditTanggalTerima] = useState(toDateInput(doc.tanggalTerima));
  const [editAsalSurat, setEditAsalSurat] = useState(doc.asalSurat ?? "");
  const [editNomorAgenda, setEditNomorAgenda] = useState(doc.nomorAgenda ?? "");
  const [editCategory, setEditCategory] = useState(doc.category ?? "DLL");
  const [editTanggalPenyelesaian, setEditTanggalPenyelesaian] = useState("");

  // States for Undangan
  const [uHari, setUHari] = useState(doc.undangan?.hari ?? "");
  const [uTanggalMulai, setUTanggalMulai] = useState(toDateInput(doc.undangan?.tanggal));
  const [uTanggalSelesai, setUTanggalSelesai] = useState(toDateInput(doc.undangan?.deadline));
  const [uJam, setUJam] = useState(doc.undangan?.jam ?? "");
  const [uTempat, setUTempat] = useState(doc.undangan?.tempat ?? "");
  const [uMedia, setUMedia] = useState<"ONLINE" | "OFFLINE">(doc.undangan?.media ?? "OFFLINE");
  const [uDresscode, setUDresscode] = useState(doc.undangan?.dresscode ?? "");
  const [uCatatanLain, setUCatatanLain] = useState(doc.undangan?.catatanLain ?? "");
  const [uUndanganType, setUUndanganType] = useState<"INTERNAL" | "EXTERNAL">(doc.undangan?.undanganType ?? "INTERNAL");
  const [uPengirimExternal, setUPengirimExternal] = useState(doc.undangan?.pengirimExternal ?? "");
  const [uKontakExternal, setUKontakExternal] = useState(doc.undangan?.kontakExternal ?? "");
  const [uPenerimaIds, setUPenerimaIds] = useState<string[]>(
    doc.undangan?.penerima?.map((p) => p.userId) ?? []
  );

  const reset = () => {
    setMode("idle");
    setReviewNote(""); setRevisiNote("");
    setWaktu("LANGSUNG"); setIsUrgen(false);
    setEditNomorSurat(doc.nomorSurat ?? "");
    setEditPerihal(doc.perihal ?? "");
    setEditTanggalSurat(toDateInput(doc.tanggalSurat));
    setEditTanggalTerima(toDateInput(doc.tanggalTerima));
    setEditAsalSurat(doc.asalSurat ?? "");
    setEditNomorAgenda(doc.nomorAgenda ?? "");
    setEditTanggalPenyelesaian("");
    
    // Undangan reset
    setUHari(doc.undangan?.hari ?? "");
    setUTanggalMulai(toDateInput(doc.undangan?.tanggal));
    setUTanggalSelesai(toDateInput(doc.undangan?.deadline));
    setUJam(doc.undangan?.jam ?? "");
    setUTempat(doc.undangan?.tempat ?? "");
    setUMedia(doc.undangan?.media ?? "OFFLINE");
    setUDresscode(doc.undangan?.dresscode ?? "");
    setUCatatanLain(doc.undangan?.catatanLain ?? "");
    setUUndanganType(doc.undangan?.undanganType ?? "INTERNAL");
    setUPengirimExternal(doc.undangan?.pengirimExternal ?? "");
    setUKontakExternal(doc.undangan?.kontakExternal ?? "");
    setUPenerimaIds(doc.undangan?.penerima?.map((p) => p.userId) ?? []);
  };

  const submitTeruskan = async () => {
    setLoading(true);
    try {
      const endpoint = `/api/documents/${doc.id}/jadwal`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ waktu, isUrgen, catatan: reviewNote || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal.");
      toast.success(json.message ?? "Berhasil!");
      router.push("/dashboard/admin/inbox");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally { setLoading(false); }
  };

  const submitKembalikan = async () => {
    if (!revisiNote.trim()) {
      toast.error("Harap isi catatan revisi untuk Staff.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${doc.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewStatus: "DIKEMBALIKAN", reviewNote: revisiNote }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal.");
      toast.success(json.message ?? "Dokumen dikembalikan ke Staff.");
      router.push("/dashboard/admin/inbox");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally { setLoading(false); }
  };

  const submitDisposisi = async () => {
    if (mode === "disposisi_undangan") {
      const isTempatInvalid = uMedia === "OFFLINE" && !uTempat;
      if (!uHari || !uTanggalMulai || !uTanggalSelesai || !uJam || isTempatInvalid) {
        toast.error(`Harap isi semua kolom wajib acara undangan (Hari, Tanggal Mulai/Selesai, Jam${uMedia === "OFFLINE" ? ", Tempat" : ""}).`);
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${doc.id}/disposisi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Hanya metadata dokumen — disposisi kepada + instruksi diisi oleh Direktur
          nomorSurat: editNomorSurat || undefined,
          perihal: editPerihal || undefined,
          asalSurat: editAsalSurat || undefined,
          nomorAgenda: editNomorAgenda || undefined,
          tanggalSurat: editTanggalSurat || undefined,
          tanggalTerima: editTanggalTerima || undefined,
          category: editCategory,
          tanggalPenyelesaian: editTanggalPenyelesaian || undefined,
          documentType: mode === "disposisi_undangan" ? "UNDANGAN" : "SURAT_MASUK",
          ...(mode === "disposisi_undangan" && {
            undangan: {
              hari: uHari,
              tanggalMulai: uTanggalMulai,
              tanggalSelesai: uTanggalSelesai,
              jam: uJam,
              tempat: uTempat,
              media: uMedia,
              dresscode: uDresscode || null,
              catatanLain: uCatatanLain || null,
              undanganType: uUndanganType,
              pengirimExternal: uUndanganType === "EXTERNAL" ? uPengirimExternal : null,
              kontakExternal: uUndanganType === "EXTERNAL" ? uKontakExternal : null,
              penerimaIds: uPenerimaIds,
            }
          })
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal.");
      toast.success(json.message ?? "Dokumen diteruskan ke Direktur!");
      router.push("/dashboard/admin/inbox");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally { setLoading(false); }
  };

  const fmtDate = (d?: Date | string) =>
    d ? format(new Date(d as string), "dd MMMM yyyy", { locale: localeId }) : "-";

  // ─── MENUNGGU REVIEW ────────────────────────────────────────
  if (doc.currentStatus === "MENUNGGU_REVIEW_AGENDARIS") {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden transition-all hover:shadow-md">
        <div className="border-b border-gray-100 dark:border-slate-800 bg-gradient-to-r from-gray-50 dark:from-slate-800 to-white dark:to-slate-900 px-6 py-4">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2.5">
            <span className="w-1.5 h-5 rounded-full bg-blue-500 shadow-sm"></span>
            Tindakan Review
          </h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 ml-4">
            Pilih tindakan untuk memproses dokumen ini ke tahap selanjutnya.
          </p>
        </div>

        <div className="p-6 space-y-6">
        {mode === "idle" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => setMode("teruskan")}
              className="relative flex flex-col items-center justify-center p-6 gap-3 rounded-2xl border-2 border-emerald-100 dark:border-emerald-900/50 bg-gradient-to-b from-emerald-50 dark:from-emerald-900/20 to-white dark:to-slate-900 text-emerald-800 dark:text-emerald-300 shadow-sm hover:border-emerald-500 hover:shadow-md hover:-translate-y-1 transition-all duration-200 overflow-hidden group"
            >
              <div className="absolute inset-0 bg-emerald-500 opacity-0 group-hover:opacity-5 transition-opacity" />
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-600 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white shadow-sm transition-all duration-300">
                <Send className="w-6 h-6 ml-1" />
              </div>
              <div className="text-center">
                <div className="font-bold text-sm mb-1">Teruskan ke Direktur</div>
                <div className="text-xs text-emerald-600/80">Kirim jadwal pengiriman</div>
              </div>
            </button>

            <button
              onClick={() => setMode("kembalikan")}
              className="relative flex flex-col items-center justify-center p-6 gap-3 rounded-2xl border-2 border-rose-100 dark:border-rose-900/50 bg-gradient-to-b from-rose-50 dark:from-rose-900/20 to-white dark:to-slate-900 text-rose-800 dark:text-rose-300 shadow-sm hover:border-rose-500 hover:shadow-md hover:-translate-y-1 transition-all duration-200 overflow-hidden group"
            >
              <div className="absolute inset-0 bg-rose-500 opacity-0 group-hover:opacity-5 transition-opacity" />
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-rose-100 text-rose-600 group-hover:scale-110 group-hover:bg-rose-500 group-hover:text-white shadow-sm transition-all duration-300">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div className="text-center">
                <div className="font-bold text-sm mb-1">Kembalikan ke Staff</div>
                <div className="text-xs text-rose-600/80">Revisi draf dokumen</div>
              </div>
            </button>

            <button
              onClick={() => setMode("disposisi_masuk")}
              className="relative flex flex-col items-center justify-center p-6 gap-3 rounded-2xl border-2 border-blue-100 dark:border-blue-900/50 bg-gradient-to-b from-blue-50 dark:from-blue-900/20 to-white dark:to-slate-900 text-blue-800 dark:text-blue-300 shadow-sm hover:border-blue-500 hover:shadow-md hover:-translate-y-1 transition-all duration-200 overflow-hidden group"
            >
              <div className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-5 transition-opacity" />
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white shadow-sm transition-all duration-300">
                <GitBranch className="w-6 h-6" />
              </div>
              <div className="text-center">
                <div className="font-bold text-sm mb-1">Disposisi Surat Masuk</div>
                <div className="text-xs text-blue-600/80">Lembar surat masuk</div>
              </div>
            </button>

            <button
              onClick={() => setMode("disposisi_undangan")}
              className="relative flex flex-col items-center justify-center p-6 gap-3 rounded-2xl border-2 border-purple-100 dark:border-purple-900/50 bg-gradient-to-b from-purple-50 dark:from-purple-900/20 to-white dark:to-slate-900 text-purple-800 dark:text-purple-300 shadow-sm hover:border-purple-500 hover:shadow-md hover:-translate-y-1 transition-all duration-200 overflow-hidden group"
            >
              <div className="absolute inset-0 bg-purple-500 opacity-0 group-hover:opacity-5 transition-opacity" />
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-purple-100 text-purple-600 group-hover:scale-110 group-hover:bg-purple-500 group-hover:text-white shadow-sm transition-all duration-300">
                <GitBranch className="w-6 h-6" />
              </div>
              <div className="text-center">
                <div className="font-bold text-sm mb-1">Disposisi Undangan</div>
                <div className="text-xs text-purple-600/80">Lembar surat undangan</div>
              </div>
            </button>
          </div>
        )}

        {/* ─── Teruskan ke Direktur ─── */}
        {mode === "teruskan" && (
          <div className="space-y-4">
            <div>
              <label className="form-label flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-500" /> Jadwal Pengiriman
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {WAKTU_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer text-sm transition-colors ${
                      waktu === opt.value
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-200 font-medium"
                        : "border-gray-200 dark:border-slate-700 hover:border-gray-300 text-gray-700 dark:text-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      className="accent-blue-600"
                      name="waktu"
                      value={opt.value}
                      checked={waktu === opt.value}
                      onChange={() => setWaktu(opt.value)}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-slate-300">
              <input
                type="checkbox"
                className="accent-red-600"
                checked={isUrgen}
                onChange={(e) => setIsUrgen(e.target.checked)}
              />
              <span className="font-medium text-red-700 dark:text-red-400">Tandai sebagai URGEN</span>
            </label>

            <textarea
              className="form-input resize-none"
              rows={3}
              placeholder="Catatan untuk Direktur (opsional)..."
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
            />
            <div className="flex gap-2">
              <button onClick={reset} className="btn-secondary flex-1 justify-center">Batal</button>
              <button
                onClick={submitTeruskan}
                disabled={loading}
                className="btn-success flex-1 justify-center"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" />...</>
                  : <><Send className="w-4 h-4" /> {waktu === "LANGSUNG" ? "Teruskan Sekarang" : "Simpan Jadwal"}</>
                }
              </button>
            </div>
          </div>
        )}

        {/* ─── Kembalikan ke Staff ─── */}
        {mode === "kembalikan" && (
          <div className="space-y-3">
            <p className="text-sm text-red-700 font-medium">
              Dokumen akan dikembalikan ke Staff untuk diperbaiki.
            </p>
            <textarea
              className="form-input resize-none border-red-300 focus:ring-red-400"
              rows={4}
              placeholder="Tuliskan catatan revisi yang jelas untuk Staff... (wajib)"
              value={revisiNote}
              onChange={(e) => setRevisiNote(e.target.value)}
            />
            <div className="flex gap-2">
              <button onClick={reset} className="btn-secondary flex-1 justify-center">Batal</button>
              <button
                onClick={submitKembalikan}
                disabled={loading}
                className="btn-danger flex-1 justify-center"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" />...</>
                  : <><RotateCcw className="w-4 h-4" /> Kembalikan ke Staff</>
                }
              </button>
            </div>
          </div>
        )}

        {/* ─── Lembar Disposisi ─── */}
        {(mode === "disposisi_masuk" || mode === "disposisi_undangan") && (
          <div className="space-y-4">
            {/* Formal Lembar Disposisi form */}
            <div className="border-2 border-gray-400 rounded-lg overflow-hidden text-sm bg-white">

              {/* Header */}
              <div className="border-b-2 border-gray-400 py-3 px-4 text-center">
                <p className="text-[11px] font-bold text-gray-800 uppercase tracking-wide leading-snug">
                  PERUSAHAAN UMUM DAERAH AIR MINUM TIRTA MAKMUR KABUPATEN SUKOHARJO
                </p>
                <p className="text-base font-bold mt-1 tracking-widest text-gray-900">
                  {mode === "disposisi_undangan" ? "LEMBAR DISPOSISI SURAT UNDANGAN" : "LEMBAR DISPOSISI SURAT MASUK"}
                </p>
              </div>

              {/* Info rows: Tanggal Surat (static) + editable fields */}
              <div className="divide-y divide-gray-300 border-b-2 border-gray-400">
                {/* Row 1: Tanggal Surat (editable) | Tanggal Terima (editable) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-300">
                  <FormEditRow label="Tanggal Surat">
                    <input
                      type="date"
                      className="form-input text-xs py-1"
                      value={editTanggalSurat}
                      onChange={(e) => setEditTanggalSurat(e.target.value)}
                    />
                  </FormEditRow>
                  <FormEditRow label="Tanggal Terima">
                    <input
                      type="date"
                      className="form-input text-xs py-1"
                      value={editTanggalTerima}
                      onChange={(e) => setEditTanggalTerima(e.target.value)}
                    />
                  </FormEditRow>
                </div>
                {/* Row 2: Asal Surat | Agenda */}
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-300">
                  <FormEditRow label="Asal Surat">
                    <input
                      className="form-input text-xs py-1"
                      placeholder="Asal surat..."
                      value={editAsalSurat}
                      onChange={(e) => setEditAsalSurat(e.target.value)}
                    />
                  </FormEditRow>
                  <FormEditRow label="Agenda">
                    <input
                      className="form-input text-xs py-1 font-mono"
                      placeholder="No. agenda..."
                      value={editNomorAgenda}
                      onChange={(e) => setEditNomorAgenda(e.target.value)}
                    />
                  </FormEditRow>
                </div>
                {/* Row 3: Perihal | Nomor Surat */}
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-300">
                  <FormEditRow label="Perihal">
                    <textarea
                      className="form-input text-xs py-1 resize-none"
                      rows={2}
                      placeholder="Perihal surat..."
                      value={editPerihal}
                      onChange={(e) => setEditPerihal(e.target.value)}
                    />
                  </FormEditRow>
                  <FormEditRow label="Nomor Surat">
                    <input
                      className="form-input text-xs py-1 font-mono"
                      placeholder="Nomor surat..."
                      value={editNomorSurat}
                      onChange={(e) => setEditNomorSurat(e.target.value)}
                    />
                  </FormEditRow>
                </div>

              </div>

              {/* Acara Undangan Details Form (Only for Undangan) */}
              {mode === "disposisi_undangan" && (
                <div className="bg-purple-50/50 dark:bg-purple-950/10 p-4 border-b-2 border-gray-400 dark:border-slate-700 space-y-4 text-xs">
                  <h4 className="font-bold text-purple-950 dark:text-purple-300 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                    Form Acara Undangan
                  </h4>
                  
                  {/* Hari, Jam & Media */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 dark:text-slate-400 uppercase mb-1">Hari</label>
                      <input
                        className="form-input text-xs py-1"
                        placeholder="Contoh: Senin"
                        value={uHari}
                        onChange={(e) => setUHari(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 dark:text-slate-400 uppercase mb-1">Jam Acara</label>
                      <input
                        className="form-input text-xs py-1 font-mono"
                        placeholder="Contoh: 09:00"
                        value={uJam}
                        onChange={(e) => setUJam(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 dark:text-slate-400 uppercase mb-1">Media</label>
                      <select
                        className="form-input text-xs py-1"
                        value={uMedia}
                        onChange={(e) => setUMedia(e.target.value as any)}
                      >
                        <option value="OFFLINE">OFFLINE</option>
                        <option value="ONLINE">ONLINE</option>
                      </select>
                    </div>
                  </div>

                  {/* Tanggal Mulai & Tanggal Selesai */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 dark:text-slate-400 uppercase mb-1">Tanggal Mulai (Start Date)</label>
                      <input
                        type="date"
                        className="form-input text-xs py-1"
                        value={uTanggalMulai}
                        onChange={(e) => setUTanggalMulai(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 dark:text-slate-400 uppercase mb-1">Tanggal Selesai (End Date)</label>
                      <input
                        type="date"
                        className="form-input text-xs py-1"
                        value={uTanggalSelesai}
                        onChange={(e) => setUTanggalSelesai(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Tempat & Dresscode */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 dark:text-slate-400 uppercase mb-1">
                        Tempat / Ruangan {uMedia === "OFFLINE" && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        className="form-input text-xs py-1"
                        placeholder="Contoh: Ruang Rapat Utama"
                        value={uTempat}
                        onChange={(e) => setUTempat(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 dark:text-slate-400 uppercase mb-1">Dresscode</label>
                      <input
                        className="form-input text-xs py-1"
                        placeholder="Contoh: Batik Sukoharjo"
                        value={uDresscode}
                        onChange={(e) => setUDresscode(e.target.value)}
                      />
                    </div>
                  </div>



                  {/* Catatan Lain */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 dark:text-slate-400 uppercase mb-1">Catatan Tambahan</label>
                    <textarea
                      className="form-input text-xs py-1 resize-none"
                      rows={2}
                      placeholder="Info/catatan tambahan acara..."
                      value={uCatatanLain}
                      onChange={(e) => setUCatatanLain(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Disposisi Kepada + Tanggal Penyelesaian & Catatan — READ-ONLY untuk Agendaris */}
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-300 border-b-2 border-gray-400 dark:border-slate-700">
                {/* Left: Disposisi Kepada — diisi Direktur */}
                <div className="p-3">
                  <p className="font-bold text-gray-800 mb-2 text-xs uppercase tracking-wide">
                    Disposisi Kepada :
                  </p>
                  <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2.5 space-y-1">
                    {[
                      "Kabag Admin dan Keu",
                      "Kabag Teknik",
                      "Kabag Hublang",
                      "Kepala SPI",
                      "Kacab. Utara",
                      "Kacab. Selatan",
                    ].map((j, i) => (
                      <div key={j} className="flex items-center gap-2 opacity-40 cursor-not-allowed">
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-400 shrink-0" />
                        <span className="text-xs text-gray-600">{i + 1}. {j}</span>
                      </div>
                    ))}
                    <p className="text-[10px] text-blue-500 mt-1.5 italic font-medium">
                      ✦ Diisi oleh Direktur
                    </p>
                  </div>
                </div>

                {/* Right: Tanggal Instruksi + Penyelesaian + Catatan — read-only */}
                  <div className="p-3 space-y-3">
                    <div>
                      <p className="font-bold text-gray-800 mb-1.5 text-xs uppercase tracking-wide">
                        Tanggal Instruksi :
                      </p>
                      <div className="form-input text-xs bg-amber-50 text-amber-600 cursor-not-allowed border-dashed border-amber-300">
                        Wajib diisi oleh Direktur
                      </div>
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 mb-1.5 text-xs uppercase tracking-wide">
                        Tanggal Penyelesaian :
                      </p>
                      <input
                        type="date"
                        className="form-input text-xs py-1 w-full"
                        value={editTanggalPenyelesaian}
                        onChange={(e) => setEditTanggalPenyelesaian(e.target.value)}
                      />
                      <p className="text-[9px] text-blue-500 mt-1 font-medium italic">
                        ✦ Diisi oleh Agendaris
                      </p>
                    </div>
                  <div>
                    <p className="font-bold text-gray-800 mb-1.5 text-xs uppercase tracking-wide">
                      Catatan :
                    </p>
                    {existingDisposisi?.keterangan ? (
                      <div className="form-input resize-none text-xs bg-blue-50 text-blue-800 border-blue-300 min-h-[4rem] flex items-start pt-1 whitespace-pre-wrap">
                        {existingDisposisi.keterangan}
                      </div>
                    ) : (
                      <div className="form-input resize-none text-xs bg-gray-50 text-gray-400 cursor-not-allowed border-dashed h-16 flex items-start pt-1">
                        Diisi oleh Direktur
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Info banner */}
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-800">
              <span className="shrink-0 mt-0.5">ℹ️</span>
              {existingDisposisi?.jabatanKe ? (
                <span>Direktur telah mengisi lembar disposisi. Teruskan dokumen ke Direktur untuk konfirmasi keputusan.</span>
              ) : (
                <span>Setelah diteruskan, <strong>Direktur</strong> akan mengisi Disposisi Kepada, Catatan, dan Tanggal Instruksi.</span>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button onClick={reset} className="btn-secondary flex-1 justify-center">Batal</button>
              <button
                onClick={submitDisposisi}
                disabled={loading}
                className="btn-primary flex-1 justify-center"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
                  : <><Send className="w-4 h-4" /> Teruskan ke Direktur</>
                }
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    );
  }

  // ─── SETELAH KEPUTUSAN DIREKTUR (Legacy - Belum Diarsipkan) ──
  if (doc.currentStatus === "KEPUTUSAN_DIREKTUR_SELESAI") {
    return (
      <div className="card p-5 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 space-y-3">
        <h3 className="font-semibold text-emerald-900 dark:text-emerald-200">Keputusan Selesai</h3>
        <p className="text-sm text-emerald-700 dark:text-emerald-400">
          Direktur telah memberikan keputusan. Karena sistem tidak lagi menggunakan staff admin, silakan simpan dokumen ini ke arsip.
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={async () => {
              setLoading(true);
              try {
                const res = await fetch(`/api/documents/${doc.id}/archive`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ serverLocation: "-", notes: "Diarsipkan otomatis oleh Agendaris" }),
                });
                const json = await res.json();
                if (!res.ok) throw new Error(json.error ?? "Gagal mengarsipkan.");
                toast.success("Dokumen berhasil disimpan ke arsip!");
                router.refresh();
              } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="btn-primary bg-emerald-600 hover:bg-emerald-700 flex-1 justify-center"
          >
            {loading ? "Menyimpan..." : <><Archive className="w-4 h-4" /> Simpan ke Arsip</>}
          </button>
        </div>
      </div>
    );
  }

  // ─── SETELAH KEPUTUSAN DIREKTUR (Otomatis Masuk Arsip) ──────
  if (doc.currentStatus === "ARSIP_FINAL_TERSIMPAN") {
    return (
      <div className="card p-5 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 space-y-3">
        <h3 className="font-semibold text-emerald-900 dark:text-emerald-200">
          ✅ Dokumen Telah Diarsipkan
        </h3>
        <p className="text-sm text-emerald-700 dark:text-emerald-400">
          Direktur telah memberikan keputusan dan dokumen ini otomatis tersimpan di arsip.
          {(!doc.documentType || doc.documentType === "SURAT_MASUK") && " Anda dapat mencetak berkas gabungan untuk diteruskan ke pihak terkait."}
        </p>
        {(!doc.documentType || doc.documentType === "SURAT_MASUK") && (
          <a
            href={`/dashboard/admin/arsip/${doc.id}/cetak-gabungan`}
            target="_blank"
            className="btn-primary bg-emerald-600 hover:bg-emerald-700 w-full justify-center"
          >
            <Clock className="w-4 h-4" /> Download / Cetak Berkas Gabungan
          </a>
        )}
      </div>
    );
  }

  // ─── PANTAUAN DI DIREKTUR ────────────────────────────────────
  if (["MENUNGGU_KEPUTUSAN_DIREKTUR", "DIPROSES_DIREKTUR", "DIJADWALKAN_KE_DIREKTUR"].includes(doc.currentStatus)) {
    return (
      <div className="card p-5 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 space-y-3">
        <h3 className="font-semibold text-yellow-900 dark:text-yellow-200">Pantauan Direktur</h3>
        <p className="text-sm text-yellow-800 dark:text-yellow-300">
          {doc.currentStatus === "DIJADWALKAN_KE_DIREKTUR"
            ? "Dokumen sudah dijadwalkan — menunggu waktu pengiriman ke Direktur."
            : doc.currentStatus === "DIPROSES_DIREKTUR"
            ? "Direktur sudah membuka dokumen ini, menunggu keputusannya."
            : "Dokumen saat ini berada di meja Direktur menunggu keputusan."}
        </p>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              setLoading(true);
              try {
                const res = await fetch(`/api/documents/${doc.id}/remind-director`, { method: "POST" });
                const json = await res.json();
                if (!res.ok) throw new Error(json.error ?? "Gagal");
                toast.success("Pengingat berhasil dikirim ke Direktur!");
                router.refresh();
              } catch (e: unknown) {
                toast.error(e instanceof Error ? e.message : "Gagal");
              } finally { setLoading(false); }
            }}
            disabled={loading}
            className="btn-primary flex-1 justify-center bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            {loading ? "Mengirim..." : "Ingatkan Direktur"}
          </button>
          
          {doc.currentStatus === "MENUNGGU_KEPUTUSAN_DIREKTUR" && (
            <button
              onClick={async () => {
                if (!confirm("Yakin ingin menarik dokumen ini? Direktur tidak akan bisa memprosesnya sampai Anda meneruskannya kembali.")) return;
                setLoading(true);
                try {
                  const res = await fetch(`/api/documents/${doc.id}/pullback`, { method: "POST" });
                  const json = await res.json();
                  if (!res.ok) throw new Error(json.error ?? "Gagal");
                  toast.success("Dokumen berhasil ditarik!");
                  router.refresh();
                } catch (e: unknown) {
                  toast.error(e instanceof Error ? e.message : "Gagal menarik dokumen");
                } finally { setLoading(false); }
              }}
              disabled={loading}
              className="btn-secondary flex-1 justify-center text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            >
              <RotateCcw className="w-4 h-4 mr-1" /> Tarik Dokumen
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
}

function FormInfoRow({
  label,
  value,
  multiline,
  mono,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-1 px-3 py-2">
      <span className="text-xs font-semibold text-gray-600 shrink-0 w-28">{label}</span>
      <span className="text-xs text-gray-500 shrink-0">:</span>
      <span
        className={`text-xs text-gray-900 ml-1 ${mono ? "font-mono" : ""} ${multiline ? "whitespace-pre-wrap break-words" : "truncate"}`}
      >
        {value}
      </span>
    </div>
  );
}

function FormEditRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 px-3 py-2">
      <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">{label}</span>
      {children}
    </div>
  );
}
