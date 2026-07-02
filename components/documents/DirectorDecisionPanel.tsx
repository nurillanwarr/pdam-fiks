// components/documents/DirectorDecisionPanel.tsx
/**
 * @file components/documents/DirectorDecisionPanel.tsx
 * @description Komponen panel bagi Direktur untuk memberikan keputusan (Setuju/Tolak) pada suatu dokumen beserta input tanda tangan digital.
 * @location Dirender di halaman review dokumen Direktur ("/dashboard/direktur/review/[id]").
 */
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { CheckCircle, RotateCcw, Loader2, XCircle, Calendar } from "lucide-react";
import { DecisionType } from "@prisma/client";
import { DECISION_LABELS } from "@/types";

interface DocProps { id: string; currentStatus: string; }

// Tambahkan "KEPUTUSAN_DIREKTUR_SELESAI" agar Direktur bisa mengubah keputusan yang sudah dikirim
const VALID_STATUSES = ["MENUNGGU_KEPUTUSAN_DIREKTUR", "DIPROSES_DIREKTUR", "KEPUTUSAN_DIREKTUR_SELESAI"];

const DECISION_OPTIONS: { type: DecisionType; label: string; icon: React.ElementType; cls: string }[] = [
  { type: "DISETUJUI", label: "Disetujui — Kembalikan ke Agendaris", icon: CheckCircle, cls: "btn-success" },
  { type: "REVISI",    label: "Minta Revisi",                         icon: RotateCcw,   cls: "bg-yellow-600 hover:bg-yellow-700 text-white inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-50 transition-colors" },
];

export function DirectorDecisionPanel({ doc }: { doc: DocProps }) {
  const router = useRouter();
  const [selected, setSelected] = useState<DecisionType | null>(null);
  const [loading, setLoading] = useState(false);

  const [autoSign, setAutoSign] = useState(false);
  const [batalTandaTangan, setBatalTandaTangan] = useState(false);
  const [tanggalInstruksi, setTanggalInstruksi] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [decisionNote, setDecisionNote] = useState("");
  const [instruksiError, setInstruksiError] = useState("");
  const [noteError, setNoteError] = useState("");

  if (!VALID_STATUSES.includes(doc.currentStatus)) {
    return null;
  }

  const submit = async () => {
    if (!selected) { toast.error("Pilih jenis keputusan terlebih dahulu."); return; }
    
    // Validate tanggal instruksi
    let hasError = false;
    if (!tanggalInstruksi) {
      setInstruksiError("Tanggal instruksi wajib diisi.");
      hasError = true;
    } else {
      setInstruksiError("");
    }

    if (!decisionNote.trim()) {
      setNoteError("Instruksi / Catatan wajib diisi.");
      hasError = true;
    } else {
      setNoteError("");
    }

    if (hasError) {
      toast.error("Harap lengkapi form sebelum mengirim keputusan.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${doc.id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          decisionType: selected, 
          decisionNote,
          autoSign: batalTandaTangan ? false : autoSign,
          tanggalInstruksi,
          batalTandaTangan,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal menyimpan keputusan.");
      toast.success(json.message ?? "Keputusan berhasil disimpan!");
      router.push("/dashboard/direktur");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-5 space-y-4">
      <h3 className="font-semibold text-gray-900 dark:text-white">
        {doc.currentStatus === "KEPUTUSAN_DIREKTUR_SELESAI" ? "Ubah Keputusan" : "Berikan Keputusan"}
      </h3>

      {/* Tanggal Instruksi — WAJIB */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 space-y-2">
        <label className="form-label flex items-center gap-1.5 text-amber-900 dark:text-amber-200">
          <Calendar className="w-4 h-4 text-amber-600" />
          Tanggal Instruksi <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          className={`form-input text-sm ${instruksiError ? "border-red-400" : ""}`}
          value={tanggalInstruksi}
          onChange={(e) => { setTanggalInstruksi(e.target.value); setInstruksiError(""); }}
        />
        {instruksiError && <p className="text-xs text-red-600">{instruksiError}</p>}
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Tanggal instruksi <strong>wajib</strong> diisi oleh Direktur untuk setiap keputusan.
        </p>
      </div>

      {/* Decision type selection */}
      <div className="grid grid-cols-2 gap-3">
        {DECISION_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isSelected = selected === opt.type;
          return (
            <button
              key={opt.type}
              onClick={() => {
                setSelected(opt.type);
                if (opt.type !== "DISETUJUI") {
                  setAutoSign(false);
                  setBatalTandaTangan(false);
                }
              }}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all
                ${isSelected
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-200"
                  : "border-gray-200 dark:border-slate-700 hover:border-gray-300 text-gray-700 dark:text-slate-300"
                }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Input Instruksi / Catatan */}
      <div className="space-y-1.5 mt-2">
        <label className="form-label font-medium text-gray-700 dark:text-gray-300">
          Catatan / Instruksi <span className="text-red-500">*</span>
        </label>
        <textarea
          className={`form-input w-full resize-none ${noteError ? "border-red-400" : ""}`}
          rows={3}
          placeholder="Tuliskan catatan atau instruksi keputusan..."
          value={decisionNote}
          onChange={(e) => { setDecisionNote(e.target.value); setNoteError(""); }}
          disabled={loading}
        />
        {noteError && <p className="text-xs text-red-600">{noteError}</p>}
      </div>

      {/* Selected indicator & Auto Sign / Batal TTD */}
      {selected && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 space-y-3">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
            Keputusan dipilih: <span className="text-blue-700 dark:text-blue-400">{DECISION_LABELS[selected]}</span>
          </p>
          
          {selected === "DISETUJUI" && (
            <div className="space-y-3 pt-2 border-t border-blue-100">
              {/* Auto Sign */}
              <label className="flex items-start gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="mt-1"
                  checked={autoSign}
                  onChange={(e) => {
                    setAutoSign(e.target.checked);
                    if (e.target.checked) setBatalTandaTangan(false);
                  }}
                  disabled={loading || batalTandaTangan}
                />
                <span className="text-sm text-blue-900 dark:text-blue-200">
                  <strong className="block">Bubuhkan Tanda Tangan Barcode (Otomatis)</strong>
                  <span className="text-xs text-blue-700 dark:text-blue-400">Sistem akan menanamkan QR Code persetujuan di dokumen PDF.</span>
                </span>
              </label>

              {/* Batal Tanda Tangan */}
              <label className="flex items-start gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="mt-1"
                  checked={batalTandaTangan}
                  onChange={(e) => {
                    setBatalTandaTangan(e.target.checked);
                    if (e.target.checked) setAutoSign(false);
                  }}
                  disabled={loading}
                />
                <span className="text-sm text-red-800">
                  <strong className="block flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> Batal Tanda Tangan
                  </strong>
                  <span className="text-xs text-red-600">Membatalkan pengisian barcode dan tanda tangan elektronik. Dokumen akan diproses tanpa TTD otomatis.</span>
                </span>
              </label>
            </div>
          )}
        </div>
      )}


      <button
        onClick={submit}
        disabled={loading || !selected}
        className="btn-primary w-full justify-center py-2.5"
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan Keputusan...</>
          : doc.currentStatus === "KEPUTUSAN_DIREKTUR_SELESAI" ? "Perbarui & Simpan Keputusan" : "Simpan & Kembalikan ke Agendaris"}
      </button>
    </div>
  );
}
