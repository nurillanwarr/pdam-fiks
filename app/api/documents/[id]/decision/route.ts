// app/api/documents/[id]/decision/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, successResponse, errorResponse, getClientIp } from "@/lib/auth-helpers";
import { createAuditLog, createStatusTimeline } from "@/lib/audit";
import { directorDecisionSchema } from "@/lib/validations";
import { DocumentStatus } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

// POST /api/documents/[id]/decision
// Direktur memberikan keputusan
// Wajib mengisi tanggalInstruksi
// Checkbox batalTandaTangan untuk skip auto-sign barcode
export async function POST(req: NextRequest, props: Params) {
  const params = await props.params;
  return requireAuth(req, async (user, request) => {
    if (user.role !== "DIREKTUR") {
      return errorResponse("Hanya Direktur Utama yang dapat memberikan keputusan.", 403);
    }

    try {
      const body = await request.json();
      const parsed = directorDecisionSchema.safeParse(body);

      if (!parsed.success) {
        return errorResponse("Validasi gagal. Pastikan tanggal instruksi telah diisi.", 422);
      }

      const { decisionType, decisionNote, autoSign, tanggalInstruksi, batalTandaTangan } = parsed.data;

      const doc = await prisma.suratMasuk.findUnique({ 
        where: { id: params.id },
        include: { files: true } 
      });
      if (!doc) return errorResponse("Dokumen tidak ditemukan.", 404);

      const validStatuses = ["MENUNGGU_KEPUTUSAN_DIREKTUR", "DIPROSES_DIREKTUR", "KEPUTUSAN_DIREKTUR_SELESAI"];
      if (!validStatuses.includes(doc.currentStatus)) {
        return errorResponse(
          `Dokumen tidak dalam tahap keputusan Direktur. Status: ${doc.currentStatus}`,
          400
        );
      }

      if (!decisionNote || decisionNote.trim() === "") {
        return errorResponse("Catatan / Instruksi wajib diisi.", 422);
      }

      const prevStatus = doc.currentStatus;

      // Logika Penentuan Status Selanjutnya
      let nextStatus = "KEPUTUSAN_DIREKTUR_SELESAI";
      const nextHolder = "AGENDARIS";
      let auditExtraDescription = "";

      // AUTO-SIGN LOGIC — skip jika batalTandaTangan = true
      if (decisionType === "DISETUJUI" && autoSign && !batalTandaTangan) {
        const draftFile = doc.files.find((f: { fileType: string }) => f.fileType === "DRAFT");
        if (draftFile) {
          try {
            // Kita butuh fs and path, and protocol relative to host
            const fs = await import("fs/promises");
            const path = await import("path");
            const { stampQRCode } = await import("@/lib/pdf-stamper");
            
            const filePath = path.join(process.cwd(), "public", draftFile.filePath);
            const pdfBuffer = await fs.readFile(filePath);

            const protocol = request.headers.get("x-forwarded-proto") || "http";
            const host = request.headers.get("host") || "localhost:3000";
            const baseUrl = `${protocol}://${host}`;

            const stampedBuffer = await stampQRCode({ 
              docId: doc.id, 
              pdfBuffer, 
              baseUrl 
            });

            // Timpa file aslinya / buat final scan secara maya
            // Untuk kesederhanaan, kita save ke nama yang sama tapi sebagai FINAL_SCAN record
            const { saveUploadedFile } = await import("@/lib/upload");
            const uploaded = await saveUploadedFile(Buffer.from(stampedBuffer), "signed_" + draftFile.fileName, draftFile.mimeType || "application/pdf");
            
            await prisma.documentFile.create({
              data: {
                suratMasukId: doc.id,
                fileType: "FINAL_SCAN",
                fileName: uploaded.fileName,
                filePath: uploaded.filePath,
                fileSize: uploaded.fileSize,
                mimeType: uploaded.mimeType,
                uploadedById: user.id, // direktur yg trigger
              }
            });

            auditExtraDescription = " (Tanda Tangan Elektronik berhasil distamp)";
          } catch (signError) {
            console.error("Gagal auto-sign:", signError);
            // Tetap biarkan berjalan namun fallback ke manual
            auditExtraDescription = " (Peringatan: Gagal melakukan pembubuhan otomatis)";
          }
        } else {
          auditExtraDescription = " (Peringatan: Gagal TTD, tidak ada file Draft PDF)";
        }
      } else if (decisionType === "REVISI" || decisionType === "DITOLAK") {
         nextStatus = "PERLU_REVISI";
      }

      // Jika batalTandaTangan, tambahkan catatan
      if (batalTandaTangan) {
        auditExtraDescription += " (Tanda tangan dibatalkan oleh Direktur)";
      }

      // Record ke database
      // Cek apakah sudah ada decision sebelumnya
      const existingDecision = await prisma.directorDecision.findFirst({
        where: { suratMasukId: doc.id },
        orderBy: { decidedAt: "desc" }
      });

      const decisionData = {
        suratMasukId: doc.id,
        directorId: user.id,
        decisionType,
        decisionNote,
        tanggalInstruksi: new Date(tanggalInstruksi),
        batalTandaTangan: batalTandaTangan ?? false,
      };

      const [decision, updatedDoc] = await prisma.$transaction([
        existingDecision 
          ? prisma.directorDecision.update({
              where: { id: existingDecision.id },
              data: decisionData,
            })
          : prisma.directorDecision.create({
              data: decisionData,
            }),
        prisma.suratMasuk.update({
          where: { id: doc.id },
          data: {
            currentStatus: nextStatus as DocumentStatus,
            currentHolder: nextHolder,
            tanggalInstruksi: new Date(tanggalInstruksi),
          },
        }),
      ]);

      const decisionLabels: Record<string, string> = {
        DISETUJUI: "Disetujui",
        DITOLAK: "Ditolak",
        REVISI: "Perlu Revisi",
        DISPOSISI: "Disposisi",
      };

      await createStatusTimeline({
        suratMasukId: doc.id,
        fromStatus: prevStatus,
        toStatus: nextStatus as DocumentStatus,
        changedBy: user.id,
        notes: `Direktur memberikan keputusan: ${decisionLabels[decisionType]}. ${decisionNote ?? ""}${auditExtraDescription}`,
      });

      await createAuditLog({
        userId: user.id,
        suratMasukId: doc.id,
        action: `DIRECTOR_DECISION_${decisionType}`,
        description: `Direktur memberi keputusan ${decisionType} untuk dokumen ${doc.nomorSurat}`,
        metadata: { decisionType, decisionNote, tanggalInstruksi, batalTandaTangan },
        ipAddress: getClientIp(request),
      });

      return successResponse(
        { decision, document: updatedDoc },
        `Keputusan "${decisionLabels[decisionType]}" berhasil disimpan dan dokumen dikembalikan ke Agendaris.`
      );
    } catch (error) {
      console.error("[POST /api/documents/[id]/decision]", error);
      return errorResponse("Gagal menyimpan keputusan.", 500);
    }
  });
}
