// components/documents/DirectorDisposisiPanel.tsx
/**
 * @file components/documents/DirectorDisposisiPanel.tsx
 * @description Komponen panel bagi Direktur untuk mendisposisikan surat/dokumen ke bagian lain (misal: Kabag/Kasubag) dengan memberikan instruksi.
 * @location Dirender di halaman disposisi Direktur ("/dashboard/direktur/disposisi/[id]").
 */
// Panel untuk Direktur mengisi Lembar Disposisi (Disposisi Kepada + Instruksi)
// Tanggal Instruksi WAJIB, Tanggal Penyelesaian diperluas
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { GitBranch, Loader2, CheckCircle, Calendar, AlertTriangle } from "lucide-react";

const JABATAN_OPTIONS = [
  "Kabag Admin dan Keu",
  "Kabag Teknik",
  "Kabag Hublang",
  "Kepala SPI",
  "Kacab. Utara",
  "Kacab. Selatan",
];

const INSTRUKSI_OPTIONS = [
  "Selesaikan / Tindak Lanjuti",
  "Tanggapan / Saran",
  "Untuk Diketahui / Diperhatikan",
  "Siapkan Laporan / Konsep",
  "Mewakili Saya",
  "Bicarakan dengan Saya",
  "Edarkan",
];

interface DirectorDisposisiPanelProps {
  docId: string;
  existingDisposisi?: {
    id: string;
    jabatanKe: string | null;
    instruksi: string | null;
    keterangan: string | null;
    tanggalTandaTangan: Date | string | null;
    tanggalInstruksi?: Date | string | null;
    tanggalPenyelesaian?: Date | string | null;
  } | null;
}

export function DirectorDisposisiPanel({ docId, existingDisposisi }: DirectorDisposisiPanelProps) {
  const router = useRouter();
  const [jabatanKe, setJabatanKe] = useState<string[]>(() => {
    if (!existingDisposisi?.jabatanKe) return [];
    return existingDisposisi.jabatanKe.split(",").map(j => j.trim());
  });
  const [selectedInstruksi, setSelectedInstruksi] = useState<string[]>(() => {
    if (!existingDisposisi?.instruksi) return [];
    const parts = existingDisposisi.instruksi.split("\n");
    return parts.map(p => p.replace(/^- /, "").trim()).filter(p => INSTRUKSI_OPTIONS.includes(p));
  });
  const [customInstruksi, setCustomInstruksi] = useState(() => {
    if (!existingDisposisi?.instruksi) return "";
    const parts = existingDisposisi.instruksi.split("\n");
    return parts.filter(p => !INSTRUKSI_OPTIONS.includes(p.replace(/^- /, "").trim())).join("\n");
  });
  const [keterangan, setKeterangan] = useState(existingDisposisi?.keterangan ?? "");

  // Tanggal Instruksi — WAJIB
  const [tanggalInstruksi, setTanggalInstruksi] = useState(() => {
    if (existingDisposisi?.tanggalInstruksi) {
      return new Date(existingDisposisi.tanggalInstruksi as string).toISOString().split("T")[0];
    }
    return new Date().toISOString().split("T")[0];
  });

  // Tanggal Penyelesaian — diperluas
  const [tanggalPenyelesaian, setTanggalPenyelesaian] = useState(
    existingDisposisi?.tanggalPenyelesaian
      ? new Date(existingDisposisi.tanggalPenyelesaian as string).toISOString().split("T")[0]
      : existingDisposisi?.tanggalTandaTangan
      ? new Date(existingDisposisi.tanggalTandaTangan as string).toISOString().split("T")[0]
      : ""
  );

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = async () => {
    const newErrors: Record<string, string> = {};

    if (jabatanKe.length === 0) {
      newErrors.jabatanKe = "Pilih penerima disposisi.";
    }

    if (!tanggalInstruksi) {
      newErrors.tanggalInstruksi = "Tanggal instruksi wajib diisi.";
    }

    const lines = [
      ...selectedInstruksi.map(i => `- ${i}`),
      ...(customInstruksi.trim() ? [customInstruksi.trim()] : [])
    ];
    
    const finalInstruksi = lines.join("\n");

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast.error("Lengkapi form disposisi terlebih dahulu.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${docId}/disposisi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jabatanKe: jabatanKe.join(", "),
          instruksi: finalInstruksi,
          keterangan: keterangan || undefined,
          tanggalInstruksi,
          tanggalPenyelesaian: tanggalPenyelesaian || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal menyimpan disposisi.");
      toast.success(json.message ?? "Lembar disposisi berhasil disimpan!");
      setSaved(true);
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-5 space-y-5">
      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
        <GitBranch className="w-4 h-4 text-blue-600" />
        Isi Lembar Disposisi
        {saved && (
          <span className="ml-auto flex items-center gap-1 text-xs text-green-600 font-normal">
            <CheckCircle className="w-3.5 h-3.5" /> Tersimpan
          </span>
        )}
      </h3>

      {/* Tanggal Instruksi — WAJIB */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
        <label className="text-xs font-semibold text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-amber-600" />
          Tanggal Instruksi <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          className={`form-input text-sm ${errors.tanggalInstruksi ? "border-red-400" : ""}`}
          value={tanggalInstruksi}
          onChange={(e) => { setTanggalInstruksi(e.target.value); setErrors(p => ({ ...p, tanggalInstruksi: "" })); }}
          disabled={loading}
        />
        {errors.tanggalInstruksi && <p className="text-xs text-red-600">{errors.tanggalInstruksi}</p>}
        <p className="text-xs text-amber-700">
          <AlertTriangle className="w-3 h-3 inline mr-1" />
          Tanggal instruksi <strong>wajib</strong> diisi oleh Direktur. Tanggal penyelesaian ditentukan oleh Agendaris.
        </p>
      </div>

      {/* Disposisi Kepada */}
      <div>
        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
          Disposisi Kepada <span className="text-red-500">*</span>
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {JABATAN_OPTIONS.map((jabatan) => (
            <label
              key={jabatan}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer text-xs transition-colors ${
                jabatanKe.includes(jabatan)
                  ? "border-blue-500 bg-blue-50 text-blue-900 font-medium ring-1 ring-blue-400"
                  : "border-gray-200 hover:border-gray-300 text-gray-700"
              }`}
            >
              <input
                type="checkbox"
                checked={jabatanKe.includes(jabatan)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setJabatanKe([...jabatanKe, jabatan]);
                  } else {
                    setJabatanKe(jabatanKe.filter(j => j !== jabatan));
                  }
                }}
                className="accent-blue-600 shrink-0"
                disabled={loading}
              />
              {jabatan}
            </label>
          ))}
        </div>
        {errors.jabatanKe && <p className="text-xs text-red-600 mt-1">{errors.jabatanKe}</p>}
      </div>



      {/* Tanggal Penyelesaian + Catatan — DIPERLUAS ke bawah */}
      <div className="space-y-4">
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            Tanggal Penyelesaian
          </label>
          <div className="form-input w-full bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 cursor-not-allowed border-dashed flex items-center h-10 px-3">
            {tanggalPenyelesaian ? format(new Date(tanggalPenyelesaian), "dd MMMM yyyy", { locale: localeId }) : "Belum ditentukan oleh Agendaris"}
          </div>
          <p className="text-[10px] text-slate-500 italic">
            Tanggal ini ditentukan oleh Agendaris pada saat pembuatan lembar disposisi.
          </p>
        </div>

        <div>
          <label className="form-label">Catatan Tambahan</label>
          <textarea
            className="form-input resize-none"
            rows={4}
            placeholder="Catatan tambahan untuk penerima disposisi (opsional)..."
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      <button
        onClick={submit}
        disabled={loading}
        className="btn-primary w-full justify-center py-2.5"
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan Disposisi...</>
          : <><GitBranch className="w-4 h-4" /> Simpan Lembar Disposisi</>
        }
      </button>
    </div>
  );
}
