import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, successResponse, errorResponse, getClientIp } from "@/lib/auth-helpers";
import { createAuditLog, createStatusTimeline } from "@/lib/audit";

export async function POST(req: NextRequest) {
  return requireAuth(req, async (user, request) => {
    if (user.role !== "AGENDARIS") {
      return errorResponse("Hanya Admin yang dapat melakukan pengarsipan.", 403);
    }
    
    try {
      const { documentIds } = await request.json();
      if (!Array.isArray(documentIds) || documentIds.length === 0) {
        return errorResponse("Tidak ada dokumen yang dipilih.", 400);
      }
      
      const docs = await prisma.suratMasuk.findMany({
        where: { 
          id: { in: documentIds }, 
          currentStatus: { in: ["MENUNGGU_ARSIP_ADMIN", "KEPUTUSAN_DIREKTUR_SELESAI"] } 
        },
        include: { archive: true }
      });
      
      const toArchive = docs.filter(d => !d.archive);
      if (toArchive.length === 0) {
        return errorResponse("Tidak ada dokumen valid untuk diarsipkan.", 400);
      }
      
      const now = new Date();
      let archivedCount = 0;
      
      for (const doc of toArchive) {
        const serverLocation = `/arsip/${now.getFullYear()}/${doc.nomorSurat.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
        const prevStatus = doc.currentStatus;
        
        await prisma.$transaction([
          prisma.archive.create({
            data: {
              suratMasukId: doc.id,
              archivedById: user.id,
              serverLocation,
              notes: "Diarsipkan massal oleh sistem",
              bulan: now.getMonth() + 1,
              tahun: now.getFullYear(),
            }
          }),
          prisma.suratMasuk.update({
            where: { id: doc.id },
            data: { currentStatus: "ARSIP_FINAL_TERSIMPAN", currentHolder: "AGENDARIS" }
          })
        ]);
        
        await createStatusTimeline({
          suratMasukId: doc.id,
          fromStatus: prevStatus,
          toStatus: "ARSIP_FINAL_TERSIMPAN",
          changedBy: user.id,
          notes: `Dokumen diarsipkan massal oleh Admin. Lokasi: ${serverLocation}`,
        });
        
        await createAuditLog({
          userId: user.id,
          suratMasukId: doc.id,
          action: "DOCUMENT_ARCHIVED_BATCH",
          description: `Dokumen ${doc.nomorSurat} diarsipkan massal`,
          metadata: { serverLocation },
          ipAddress: getClientIp(request),
        });
        
        archivedCount++;
      }
      
      return successResponse({ archivedCount }, `${archivedCount} dokumen berhasil diarsipkan.`);
    } catch (error) {
      console.error("[POST /api/documents/batch-archive]", error);
      return errorResponse("Gagal mengarsipkan dokumen.", 500);
    }
  });
}
