import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, successResponse, errorResponse, getClientIp } from "@/lib/auth-helpers";
import { createAuditLog, createStatusTimeline } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, props: Params) {
  const params = await props.params;
  return requireAuth(req, async (user, request) => {
    if (!["AGENDARIS", "ADMIN_STAFF"].includes(user.role)) {
      return errorResponse("Tidak memiliki akses untuk tindakan ini.", 403);
    }

    try {
      const body = await request.json();
      const { note } = body;

      const doc = await prisma.suratMasuk.findUnique({
        where: { id: params.id },
      });

      if (!doc) return errorResponse("Dokumen tidak ditemukan.", 404);

      if (doc.currentStatus !== "KEPUTUSAN_DIREKTUR_SELESAI") {
        return errorResponse("Hanya dapat mengembalikan dokumen yang sudah mendapat keputusan.", 400);
      }

      const prevStatus = doc.currentStatus;
      const nextStatus = "MENUNGGU_KEPUTUSAN_DIREKTUR";

      await prisma.suratMasuk.update({
        where: { id: doc.id },
        data: {
          currentStatus: nextStatus,
          currentHolder: "DIREKTUR",
        },
      });

      await createStatusTimeline({
        suratMasukId: doc.id,
        fromStatus: prevStatus,
        toStatus: nextStatus,
        changedBy: user.id,
        notes: `Agendaris mengembalikan dokumen ke Direktur. Catatan: ${note || "-"}`,
      });

      await createAuditLog({
        userId: user.id,
        suratMasukId: doc.id,
        action: "KEMBALIKAN_KE_DIREKTUR",
        description: `Agendaris mengembalikan dokumen ${doc.nomorSurat} ke Direktur.`,
        metadata: { note },
        ipAddress: getClientIp(request),
      });

      return successResponse(
        { id: doc.id },
        "Berhasil mengembalikan dokumen ke Direktur."
      );
    } catch (error) {
      console.error("[POST /api/documents/[id]/return-to-director]", error);
      return errorResponse("Gagal mengembalikan dokumen ke Direktur.", 500);
    }
  });
}
