"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { RotateCcw } from "lucide-react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export function DirectorPullbackButton({ docId, currentStatus }: { docId: string; currentStatus: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  if (currentStatus !== "KEPUTUSAN_DIREKTUR_SELESAI") {
    return null;
  }

  const handlePullback = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${docId}/pullback`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal membatalkan keputusan.");
      toast.success("Keputusan berhasil dibatalkan dan ditarik kembali.");
      setShowModal(false);
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full btn-secondary text-red-600 border-red-200 hover:bg-red-50 justify-center py-2.5 mt-4"
      >
        <RotateCcw className="w-4 h-4 mr-2" />
        Batal Kirim Keputusan / Tarik Kembali
      </button>

      <ConfirmModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handlePullback}
        title="Batalkan Keputusan"
        message="Apakah Anda yakin ingin membatalkan pengiriman keputusan ini ke Agendaris? Dokumen akan ditarik kembali ke meja Anda untuk diproses ulang."
        confirmText="Ya, Batalkan & Tarik"
        type="danger"
        isLoading={loading}
      />
    </>
  );
}
