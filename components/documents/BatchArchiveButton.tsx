"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

interface Props {
  documentIds: string[];
}

export function BatchArchiveButton({ documentIds }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleBatchArchive = async () => {
    if (documentIds.length === 0) return;
    
    const confirm = window.confirm(`Apakah Anda yakin ingin mengarsipkan ${documentIds.length} dokumen sekaligus?`);
    if (!confirm) return;

    setLoading(true);
    try {
      const res = await fetch("/api/documents/batch-archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentIds }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal mengarsipkan dokumen.");

      toast.success(data.message || `${documentIds.length} dokumen berhasil diarsipkan.`);
      router.refresh();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  if (documentIds.length === 0) return null;

  return (
    <button
      onClick={handleBatchArchive}
      disabled={loading}
      className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
      Arsipkan Semua ({documentIds.length})
    </button>
  );
}
