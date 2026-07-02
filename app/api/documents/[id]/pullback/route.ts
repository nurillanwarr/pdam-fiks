// app/api/documents/[id]/pullback/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, successResponse, errorResponse, getClientIp } from "@/lib/auth-helpers";
import { createAuditLog, createStatusTimeline } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, props: Params) {
  const params = await props.params;
  return requireAuth(req, async (user, request) => {
    if (!["AGENDARIS", "DIREKTUR"].includes(user.role)) {
      return errorResponse("Tidak memiliki akses untuk menarik dokumen.", 403);
    }

    try {
      const doc = await prisma.suratMasuk.findUnique({
        where: { id: params.id },
      });

      if (!doc) return errorResponse("Dokumen tidak ditemukan.", 404);

      const prevStatus = doc.currentStatus;
      
      let nextStatus = "";
      let nextHolder = "";
      let auditDesc = "";

      if (user.role === "AGENDARIS") {
        if (doc.currentStatus !== "MENUNGGU_KEPUTUSAN_DIREKTUR") {
          return errorResponse(`Dokumen tidak dapat ditarik dari status "${doc.currentStatus}".`, 400);
        }
        nextStatus = "MENUNGGU_REVIEW_AGENDARIS";
        nextHolder = user.id;
        auditDesc = `Agendaris menarik dokumen ${doc.nomorSurat} dari meja Direktur`;
      } else if (user.role === "DIREKTUR") {
        if (doc.currentStatus !== "KEPUTUSAN_DIREKTUR_SELESAI") {
          return errorResponse(`Hanya dapat menarik dokumen yang statusnya telah Selesai diputuskan.`, 400);
        }
        nextStatus = "DIPROSES_DIREKTUR";
        nextHolder = "DIREKTUR";
        auditDesc = `Direktur membatalkan keputusan dan menarik kembali dokumen ${doc.nomorSurat}`;
      }

      const updated = await prisma.suratMasuk.update({
        where: { id: params.id },
        data: {
          currentStatus: nextStatus as any,
          currentHolder: nextHolder,
        },
      });

      await createStatusTimeline({
        suratMasukId: doc.id,
        fromStatus: prevStatus,
        toStatus: nextStatus as any,
        changedBy: user.id,
        notes: auditDesc,
      });

      await createAuditLog({
        userId: user.id,
        suratMasukId: doc.id,
        action: "DOCUMENT_PULLBACK",
        description: auditDesc,
        ipAddress: getClientIp(request),
      });

      return successResponse(updated, "Dokumen berhasil ditarik kembali.");
    } catch (error) {
      console.error("[POST /api/documents/[id]/pullback]", error);
      return errorResponse("Gagal menarik dokumen.", 500);
    }
  });
}
