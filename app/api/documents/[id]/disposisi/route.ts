// app/api/documents/[id]/disposisi/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, successResponse, errorResponse, getClientIp } from "@/lib/auth-helpers";
import { createAuditLog, createStatusTimeline } from "@/lib/audit";
import { DocumentStatus, DocumentCategory } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

const JABATAN_VALID = [
  "Kabag Admin dan Keu",
  "Kabag Teknik",
  "Kabag Hublang",
  "Kepala SPI",
  "Kacab. Utara",
  "Kacab. Selatan",
];

// POST /api/documents/[id]/disposisi
// - AGENDARIS : update metadata dokumen + teruskan ke Direktur (tanpa buat LembarDisposisi)
// - DIREKTUR  : buat / update LembarDisposisi dengan jabatanKe + instruksi
export async function POST(req: NextRequest, props: Params) {
  const params = await props.params;
  return requireAuth(req, async (user, request) => {
    if (!["AGENDARIS", "DIREKTUR"].includes(user.role)) {
      return errorResponse("Tidak memiliki akses untuk tindakan disposisi.", 403);
    }

    try {
      const body = await request.json();

      // ── AGENDARIS: Teruskan dokumen ke Direktur (update metadata saja) ──
      if (user.role === "AGENDARIS") {
        const {
          nomorSurat, perihal, asalSurat, nomorAgenda, tanggalSurat, tanggalTerima, documentType, category, tanggalPenyelesaian, undangan
        } = body as {
          nomorSurat?: string;
          perihal?: string;
          asalSurat?: string;
          nomorAgenda?: string;
          tanggalSurat?: string;
          tanggalTerima?: string;
          category?: string;
          tanggalPenyelesaian?: string;
          documentType?: string;
          undangan?: {
            hari: string;
            tanggalMulai: string;
            tanggalSelesai: string;
            jam: string;
            tempat: string;
            media?: "ONLINE" | "OFFLINE";
            dresscode?: string;
            catatanLain?: string;
            undanganType?: "INTERNAL" | "EXTERNAL";
            pengirimExternal?: string;
            kontakExternal?: string;
            penerimaIds?: string[];
          };
        };

        const doc = await prisma.suratMasuk.findUnique({ where: { id: params.id } });
        if (!doc) return errorResponse("Dokumen tidak ditemukan.", 404);

        if (doc.currentStatus !== "MENUNGGU_REVIEW_AGENDARIS") {
          return errorResponse("Dokumen tidak dalam tahap review Agendaris.", 400);
        }

        const prevStatus = doc.currentStatus;

        await prisma.suratMasuk.update({
          where: { id: doc.id },
          data: {
            currentStatus: "MENUNGGU_KEPUTUSAN_DIREKTUR" as DocumentStatus,
            currentHolder: "DIREKTUR",
            ...(nomorSurat && { nomorSurat }),
            ...(perihal && { perihal }),
            ...(asalSurat && { asalSurat }),
            ...(nomorAgenda && { nomorAgenda }),
            ...(tanggalSurat && { tanggalSurat: new Date(tanggalSurat) }),
            ...(tanggalTerima && { tanggalTerima: new Date(tanggalTerima) }),
            ...(category && { category: category as DocumentCategory }),
            ...(tanggalPenyelesaian && { tanggalPenyelesaian: new Date(tanggalPenyelesaian) }),
            ...(documentType && { documentType: documentType as any }),
          },
        });

        // Handle nested Undangan creation / update
        if (documentType === "UNDANGAN" && undangan) {
          const uRecord = await prisma.undangan.upsert({
            where: { suratMasukId: doc.id },
            create: {
              suratMasukId: doc.id,
              hari: undangan.hari,
              tanggal: new Date(undangan.tanggalMulai),
              jam: undangan.jam,
              tempat: undangan.tempat,
              media: undangan.media ?? "OFFLINE",
              dresscode: undangan.dresscode ?? null,
              catatanLain: undangan.catatanLain ?? null,
              deadline: new Date(undangan.tanggalSelesai),
              undanganType: undangan.undanganType ?? "INTERNAL",
              pengirimExternal: undangan.pengirimExternal ?? null,
              kontakExternal: undangan.kontakExternal ?? null,
            },
            update: {
              hari: undangan.hari,
              tanggal: new Date(undangan.tanggalMulai),
              jam: undangan.jam,
              tempat: undangan.tempat,
              media: undangan.media ?? "OFFLINE",
              dresscode: undangan.dresscode ?? null,
              catatanLain: undangan.catatanLain ?? null,
              deadline: new Date(undangan.tanggalSelesai),
              undanganType: undangan.undanganType ?? "INTERNAL",
              pengirimExternal: undangan.pengirimExternal ?? null,
              kontakExternal: undangan.kontakExternal ?? null,
            },
          });

          // Sync penerima
          if (undangan.penerimaIds && Array.isArray(undangan.penerimaIds)) {
            await prisma.undanganPenerima.deleteMany({
              where: { undanganId: uRecord.id },
            });

            if (undangan.penerimaIds.length > 0) {
              await prisma.undanganPenerima.createMany({
                data: undangan.penerimaIds.map((uid) => ({
                  undanganId: uRecord.id,
                  userId: uid,
                })),
              });

              // Simulate Email sending in background
              const recipientUsers = await prisma.user.findMany({
                where: { id: { in: undangan.penerimaIds } },
                select: { email: true, name: true },
              });

              console.log("=========================================");
              console.log("📧 SIMULASI PENGIRIMAN EMAIL NOTIFIKASI");
              console.log(`Undangan: ${perihal || doc.perihal}`);
              console.log(`Waktu: ${undangan.hari}, ${undangan.tanggalMulai} s/d ${undangan.tanggalSelesai}`);
              console.log(`Tempat: ${undangan.tempat} (${undangan.media})`);
              console.log("Daftar Penerima:");
              recipientUsers.forEach((u) => {
                console.log(`  - ${u.name} <${u.email}>`);
              });
              console.log("Status: Berhasil Terkirim Via SMTP");
              console.log("=========================================");
            }
          }
        }

        await createStatusTimeline({
          suratMasukId: doc.id,
          fromStatus: prevStatus,
          toStatus: "MENUNGGU_KEPUTUSAN_DIREKTUR",
          changedBy: user.id,
          notes: "Agendaris meneruskan dokumen beserta lembar disposisi ke Direktur.",
        });

        await createAuditLog({
          userId: user.id,
          suratMasukId: doc.id,
          action: "DOKUMEN_DITERUSKAN_KE_DIREKTUR",
          description: `Agendaris meneruskan dokumen ${doc.nomorSurat} ke Direktur`,
          metadata: { nomorSurat, perihal, asalSurat, nomorAgenda },
          ipAddress: getClientIp(request),
        });

        // Send Email & WA Notification
        import("@/lib/notification-sender").then(({ notifyDirekturNewDocument }) => {
          notifyDirekturNewDocument(doc.id, user.name).catch(console.error);
        });

        return successResponse(
          { id: doc.id },
          "Dokumen berhasil diteruskan ke Direktur. Direktur akan mengisi lembar disposisi."
        );
      }

      // ── DIREKTUR: Buat / update LembarDisposisi ──
      const {
        jabatanKe, instruksi, keterangan, tanggalPenyelesaian, tanggalInstruksi,
      } = body as {
        jabatanKe: string;
        instruksi?: string;
        keterangan?: string;
        tanggalPenyelesaian?: string;
        tanggalInstruksi?: string;
      };

      // Tanggal instruksi wajib diisi oleh Direktur
      if (!tanggalInstruksi) {
        return errorResponse("Tanggal instruksi wajib diisi oleh Direktur.", 400);
      }

      if (!jabatanKe) {
        return errorResponse(
          `Pilih penerima disposisi yang valid: ${JABATAN_VALID.join(", ")}.`,
          400
        );
      }
      
      const selectedJabatans = jabatanKe.split(",").map(j => j.trim());
      const allValid = selectedJabatans.every(j => JABATAN_VALID.includes(j));
      if (!allValid) {
        return errorResponse(
          `Pilih penerima disposisi yang valid: ${JABATAN_VALID.join(", ")}.`,
          400
        );
      }

      const doc = await prisma.suratMasuk.findUnique({ where: { id: params.id } });
      if (!doc) return errorResponse("Dokumen tidak ditemukan.", 404);

      const validStatuses = ["MENUNGGU_KEPUTUSAN_DIREKTUR", "DIPROSES_DIREKTUR", "KEPUTUSAN_DIREKTUR_SELESAI"];
      if (!validStatuses.includes(doc.currentStatus)) {
        return errorResponse("Dokumen tidak dalam tahap keputusan Direktur.", 400);
      }

      const prevStatus = doc.currentStatus;

      // Cek apakah sudah ada LembarDisposisi untuk dokumen ini
      const existing = await prisma.lembarDisposisi.findFirst({
        where: { suratMasukId: doc.id },
        orderBy: { createdAt: "desc" },
      });

      let disposisi;
      const dispoData = {
        jabatanKe,
        instruksi,
        keterangan,
        tanggalInstruksi: new Date(tanggalInstruksi),
        tanggalPenyelesaian: tanggalPenyelesaian ? new Date(tanggalPenyelesaian) : null,
        dariId: user.id,
      };

      if (existing) {
        disposisi = await prisma.lembarDisposisi.update({
          where: { id: existing.id },
          data: dispoData,
        });
      } else {
        disposisi = await prisma.lembarDisposisi.create({
          data: {
            suratMasukId: doc.id,
            ...dispoData,
          },
        });
      }

      // Update tanggalInstruksi dan tanggalPenyelesaian di dokumen utama
      await prisma.suratMasuk.update({
        where: { id: doc.id },
        data: {
          tanggalInstruksi: new Date(tanggalInstruksi),
          tanggalPenyelesaian: tanggalPenyelesaian ? new Date(tanggalPenyelesaian) : null,
        },
      });

      await createStatusTimeline({
        suratMasukId: doc.id,
        fromStatus: prevStatus,
        toStatus: prevStatus, // Status tidak berubah, hanya disposisi tersimpan
        changedBy: user.id,
        notes: `Direktur mengisi lembar disposisi. Kepada: ${jabatanKe}. Instruksi: ${instruksi}`,
      });

      await createAuditLog({
        userId: user.id,
        suratMasukId: doc.id,
        action: "DISPOSISI_DIISI_DIREKTUR",
        description: `Direktur mengisi lembar disposisi untuk ${doc.nomorSurat}. Kepada: ${jabatanKe}`,
        metadata: { jabatanKe, instruksi },
        ipAddress: getClientIp(request),
      });

      return successResponse(disposisi, "Lembar disposisi berhasil disimpan.");
    } catch (error) {
      console.error("[POST /api/documents/[id]/disposisi]", error);
      return errorResponse("Gagal memproses disposisi.", 500);
    }
  });
}
