// app/api/documents/[id]/upload/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, successResponse, errorResponse, getClientIp } from "@/lib/auth-helpers";
import { createAuditLog, createStatusTimeline } from "@/lib/audit";
import { validateFile, saveUploadedFile } from "@/lib/upload";
import { FileType } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

// POST /api/documents/[id]/upload
// Upload file: draft (Staff) atau final scan (Staff setelah keputusan)
export async function POST(req: NextRequest, props: Params) {
  const params = await props.params;
  return requireAuth(req, async (user, request) => {
    try {
      const doc = await prisma.suratMasuk.findUnique({ where: { id: params.id } });
      if (!doc) return errorResponse("Dokumen tidak ditemukan.", 404);

      // Hanya creator atau admin yang boleh upload
      if (user.role !== "AGENDARIS" && doc.createdById !== user.id) {
        return errorResponse("Anda tidak memiliki hak upload ke dokumen ini.", 403);
      }

      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const fileTypeRaw = formData.get("fileType") as string | null;

      if (!file) return errorResponse("File tidak ditemukan dalam request.", 400);
      if (!fileTypeRaw || !["DRAFT", "FINAL_SCAN", "ATTACHMENT"].includes(fileTypeRaw)) {
        return errorResponse("fileType tidak valid. Gunakan: DRAFT, FINAL_SCAN, ATTACHMENT.", 400);
      }

      const fileType = fileTypeRaw as FileType;

      // Validasi hak upload berdasarkan fileType & status
      if (fileType === "FINAL_SCAN") {
        const allowedFinalScanStatuses = [
          "MENUNGGU_SCAN_FINAL",
          "KEPUTUSAN_DIREKTUR_SELESAI",
          "MENUNGGU_PENGAMBILAN_STAFF",
        ];
        
        // Agendaris also allowed to upload final scan during initial creation
        if (user.role === "AGENDARIS") {
          allowedFinalScanStatuses.push(
            "MENUNGGU_REVIEW_AGENDARIS",
            "MENUNGGU_KEPUTUSAN_DIREKTUR",
            "MENUNGGU_ARSIP_ADMIN"
          );
        }

        if (!allowedFinalScanStatuses.includes(doc.currentStatus)) {
          return errorResponse(
            "Upload scan final hanya diizinkan saat status: Menunggu Scan Final / Keputusan Selesai.",
            400
          );
        }
      } else if (fileType === "DRAFT") {
        if (!["DRAFT", "PERLU_REVISI"].includes(doc.currentStatus) && user.role !== "AGENDARIS") {
          return errorResponse("Upload draft hanya diizinkan saat status DRAFT atau Perlu Revisi.", 400);
        }
      }

      // Validasi tipe & ukuran file
      const validation = validateFile(file.type, file.size);
      if (!validation.valid) return errorResponse(validation.error!, 400);

      // Baca buffer dan simpan
      const buffer = Buffer.from(await file.arrayBuffer());
      const uploaded = await saveUploadedFile(buffer, file.name, file.type, "documents");

      // Simpan record ke database
      const docFile = await prisma.documentFile.create({
        data: {
          suratMasukId: doc.id,
          fileType,
          fileName: uploaded.fileName,
          filePath: uploaded.filePath,
          fileSize: uploaded.fileSize,
          mimeType: uploaded.mimeType,
          uploadedById: user.id,
        },
      });

      // Jika final scan → ubah status ke MENUNGGU_ARSIP_ADMIN (Kecuali jika ini adalah upload awal oleh Agendaris)
      if (fileType === "FINAL_SCAN" && doc.currentStatus !== "MENUNGGU_REVIEW_AGENDARIS") {
        const prevStatus = doc.currentStatus;
        await prisma.suratMasuk.update({
          where: { id: doc.id },
          data: {
            currentStatus: "MENUNGGU_ARSIP_ADMIN",
            currentHolder: "AGENDARIS",
          },
        });

        await createStatusTimeline({
          suratMasukId: doc.id,
          fromStatus: prevStatus,
          toStatus: "MENUNGGU_ARSIP_ADMIN",
          changedBy: user.id,
          notes: "Scan final diupload. Menunggu pengarsipan Admin.",
        });
      }

      await createAuditLog({
        userId: user.id,
        suratMasukId: doc.id,
        action: `FILE_UPLOADED_${fileType}`,
        description: `File ${fileType} diupload: ${file.name}`,
        metadata: { fileName: file.name, fileSize: file.size, mimeType: file.type },
        ipAddress: getClientIp(request),
      });

      return successResponse(docFile, "File berhasil diupload.", 201);
    } catch (error) {
      console.error("[POST /api/documents/[id]/upload]", error);
      return errorResponse("Gagal mengupload file.", 500);
    }
  });
}
