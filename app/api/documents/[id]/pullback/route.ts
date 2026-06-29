// app/api/documents/[id]/pullback/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, successResponse, errorResponse, getClientIp } from "@/lib/auth-helpers";
import { createAuditLog, createStatusTimeline } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, props: Params) {
  const params = await props.params;
  return requireAuth(req, async (user, request) => {
    if (user.role !== "AGENDARIS") {
      return errorResponse("Hanya Agendaris yang dapat menarik dokumen.", 403);
    }

    try {
      const doc = await prisma.suratMasuk.findUnique({
        where: { id: params.id },
      });

      if (!doc) return errorResponse("Dokumen tidak ditemukan.", 404);

      if (doc.currentStatus !== "MENUNGGU_KEPUTUSAN_DIREKTUR") {
        return errorResponse(
          `Dokumen tidak dapat ditarik dari status "${doc.currentStatus}".`,
          400
        );
      }

      const prevStatus = doc.currentStatus;
      const updated = await prisma.suratMasuk.update({
        where: { id: params.id },
        data: {
          currentStatus: "MENUNGGU_REVIEW_AGENDARIS",
          currentHolder: user.id,
        },
      });

      await createStatusTimeline({
        suratMasukId: doc.id,
        fromStatus: prevStatus,
        toStatus: "MENUNGGU_REVIEW_AGENDARIS",
        changedBy: user.id,
        notes: "Dokumen ditarik kembali oleh Agendaris dari meja Direktur",
      });

      await createAuditLog({
        userId: user.id,
        suratMasukId: doc.id,
        action: "DOCUMENT_PULLBACK",
        description: `Agendaris menarik dokumen ${doc.nomorSurat} dari meja Direktur`,
        ipAddress: getClientIp(request),
      });

      return successResponse(updated, "Dokumen berhasil ditarik kembali.");
    } catch (error) {
      console.error("[POST /api/documents/[id]/pullback]", error);
      return errorResponse("Gagal menarik dokumen.", 500);
    }
  });
}
