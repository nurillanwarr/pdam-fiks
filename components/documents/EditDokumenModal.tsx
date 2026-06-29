/**
 * @file components/documents/EditDokumenModal.tsx
 * @description Komponen modal untuk mengedit data dokumen (metadata seperti perihal, deskripsi, dll) yang sudah ada di sistem.
 * @location Dirender di halaman detail dokumen bagi user yang memiliki akses edit (seperti Admin atau pengirim awal).
 */
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Calendar, FileText, X } from "lucide-react";
import toast from "react-hot-toast";

export function EditDokumenModal({ doc, onClose }: { doc: any; onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    nomorSurat: doc.nomorSurat || "",
    perihal: doc.perihal || "",
    deskripsi: doc.deskripsi || "",
    tujuan: doc.tujuan || "",
    asalSurat: doc.asalSurat || "",
    tanggalSurat: doc.tanggalSurat ? new Date(doc.tanggalSurat).toISOString().split("T")[0] : "",
  });

  const [undangan, setUndangan] = useState(
    doc.documentType === "UNDANGAN" && doc.undangan
      ? {
          hari: doc.undangan.hari || "",
          jam: doc.undangan.jam || "",
          tanggal: doc.undangan.tanggal ? new Date(doc.undangan.tanggal).toISOString().split("T")[0] : "",
          tempat: doc.undangan.tempat || "",
          media: doc.undangan.media || "OFFLINE",
          detailMedia: doc.undangan.detailMedia || "",
          dresscode: doc.undangan.dresscode || "",
          catatanLain: doc.undangan.catatanLain || "",
          deadline: doc.undangan.deadline ? new Date(doc.undangan.deadline).toISOString().split("T")[0] : "",
        }
      : {
          hari: "", jam: "", tanggal: "", tempat: "", media: "OFFLINE", detailMedia: "", dresscode: "", catatanLain: "", deadline: ""
        }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.perihal.trim() || form.perihal.length < 5) newErrors.perihal = "Perihal minimal 5 karakter.";
    if (!form.tanggalSurat) newErrors.tanggalSurat = "Tanggal surat wajib diisi.";

    if (doc.documentType === "UNDANGAN") {
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
    if (Object.keys(newErrors).some(k => k.startsWith("undangan"))) {
      toast.error("Mohon lengkapi semua field wajib pada Detail Kegiatan Undangan.");
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload: any = doc.documentType === "UNDANGAN" ? { ...form, undangan } : { ...form };

      if (!payload.nomorSurat) delete payload.nomorSurat;
      if (!payload.deskripsi) delete payload.deskripsi;
      if (!payload.tujuan) delete payload.tujuan;
      if (!payload.asalSurat) delete payload.asalSurat;

      const res = await fetch(`/api/documents/${doc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal menyimpan perubahan.");
      toast.success("Dokumen berhasil diperbarui!");
      router.refresh();
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Edit Dokumen</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-5 flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="form-label">Nomor Surat</label>
              <input
                className="form-input"
                value={form.nomorSurat}
                onChange={(e) => setForm({ ...form, nomorSurat: e.target.value })}
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="form-label">Tanggal Surat <span className="text-red-500">*</span></label>
              <input
                type="date"
                className="form-input"
                value={form.tanggalSurat}
                onChange={(e) => setForm({ ...form, tanggalSurat: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Perihal <span className="text-red-500">*</span></label>
            <input
              className="form-input"
              value={form.perihal}
              onChange={(e) => setForm({ ...form, perihal: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="form-label">Asal Surat</label>
              <input
                className="form-input"
                value={form.asalSurat}
                onChange={(e) => setForm({ ...form, asalSurat: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Keterangan / Deskripsi</label>
            <textarea
              className="form-input resize-none"
              rows={3}
              value={form.deskripsi}
              onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
            />
          </div>

          {doc.documentType === "UNDANGAN" && (
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
                    onChange={(e) => setUndangan({ ...undangan, hari: e.target.value })}
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
                  <label className="form-label">Jam <span className="text-red-500">*</span></label>
                  <input
                    type="time"
                    className="form-input"
                    value={undangan.jam}
                    onChange={(e) => setUndangan({ ...undangan, jam: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Tanggal Kegiatan <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    className="form-input"
                    value={undangan.tanggal}
                    onChange={(e) => setUndangan({ ...undangan, tanggal: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Deadline Konfirmasi</label>
                  <input
                    type="date"
                    className="form-input"
                    value={undangan.deadline}
                    onChange={(e) => setUndangan({ ...undangan, deadline: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label font-semibold text-gray-700 mb-1 block">
                  Tempat {undangan.media === "OFFLINE" && <span className="text-red-500">*</span>}
                </label>
                <input
                  className="form-input"
                  value={undangan.tempat}
                  onChange={(e) => setUndangan({ ...undangan, tempat: e.target.value })}
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
                        onClick={() => setUndangan({ ...undangan, media: m })}
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
                    value={undangan.dresscode}
                    onChange={(e) => setUndangan({ ...undangan, dresscode: e.target.value })}
                  />
                </div>
              </div>

              {undangan.media === "ONLINE" && (
                <div>
                  <label className="form-label">Detail Media / Link <span className="text-red-500">*</span></label>
                  <input
                    className="form-input"
                    value={undangan.detailMedia}
                    onChange={(e) => setUndangan({ ...undangan, detailMedia: e.target.value })}
                  />
                </div>
              )}

              <div>
                <label className="form-label">Catatan Kegiatan</label>
                <textarea
                  className="form-input resize-none"
                  rows={2}
                  value={undangan.catatanLain}
                  onChange={(e) => setUndangan({ ...undangan, catatanLain: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <button onClick={onClose} className="btn-secondary" disabled={loading}>
            Batal
          </button>
          <button onClick={handleSave} disabled={loading} className="btn-primary">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simpan Perubahan"}
          </button>
        </div>
      </div>
    </div>
  );
}
