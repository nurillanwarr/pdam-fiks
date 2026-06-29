import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, errorResponse } from "@/lib/auth-helpers";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import ExcelJS from "exceljs";

export async function GET(req: NextRequest) {
  return requireAuth(req, async (user, request) => {
    try {
      const { searchParams } = new URL(request.url);
      
      const documentType = searchParams.get("documentType");
      const status = searchParams.get("status");
      const bulan = searchParams.get("bulan");
      const tahun = searchParams.get("tahun");
      const search = searchParams.get("search");
      
      // Build filters
      const where: any = {};
      if (documentType) where.documentType = documentType;
      if (status) where.currentStatus = status;

      if (search) {
        where.OR = [
          { nomorSurat: { contains: search, mode: "insensitive" } },
          { perihal: { contains: search, mode: "insensitive" } },
          { asalSurat: { contains: search, mode: "insensitive" } },
        ];
      }

      if (bulan || tahun) {
        // If we are filtering by month/year, we assume it's for archived documents
        where.currentStatus = "ARSIP_FINAL_TERSIMPAN";
        where.archive = { is: {} };
        if (bulan) where.archive.is.bulan = parseInt(bulan);
        if (tahun) where.archive.is.tahun = parseInt(tahun);
      }

      // Fetch documents
      const documents = await prisma.suratMasuk.findMany({
        where,
        include: {
          undangan: true,
          createdBy: { select: { name: true, divisi: true } },
          decisions: {
            orderBy: { decidedAt: "desc" },
            take: 1,
            select: { decisionType: true, decisionNote: true, director: { select: { name: true } } }
          },
          disposisi: {
            include: { ke: { select: { name: true, divisi: true, role: true } } },
            orderBy: { createdAt: "asc" }
          },
          archive: { select: { serverLocation: true, archivedAt: true } }
        },
        orderBy: { updatedAt: "desc" }
      });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Laporan Dokumen");

      // Title
      worksheet.mergeCells('A1', 'H1');
      worksheet.getCell('A1').value = `LAPORAN DOKUMEN ${documentType || ""}`.trim();
      worksheet.getCell('A1').font = { bold: true, size: 14 };

      // Empty row
      worksheet.addRow([]);

      // Headers
      const headers = [
        "NO",
        "NO SURAT",
        "TGL SURAT",
        "NO. AGENDA",
        "TGL. TERIMA",
        "ASAL SURAT",
        "PERIHAL"
      ];

      if (documentType !== "SURAT_MASUK") {
        headers.push("KETERANGAN");
      }
      headers.push("INSTRUKSI DISPOSISI", "PENERIMA DISPOSISI");

      const headerRow = worksheet.addRow(headers);
      headerRow.font = { bold: true };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.eachCell((cell) => {
        cell.border = {
          top: {style:'thin'},
          left: {style:'thin'},
          bottom: {style:'thin'},
          right: {style:'thin'}
        };
      });

      // Rows
      documents.forEach((doc, index) => {
        let keterangan = doc.deskripsi || "-";
        
        if (doc.documentType === "UNDANGAN" && doc.undangan) {
           const u = doc.undangan;
           const jam = u.jam || "";
           const tempat = u.tempat || "";
           const date = u.tanggal ? format(new Date(u.tanggal), "dd MMMM yyyy", { locale: localeId }) : "";
           
           const ketLines = [
             `HARI : ${u.hari || "-"}, ${date}`,
             `PUKUL : ${jam}`,
           ];
           
           if (u.media === "ONLINE" && u.detailMedia) {
             ketLines.push(`MEDIA : ${u.detailMedia}`);
           } else {
             ketLines.push(`TEMPAT : ${tempat}`);
           }
           
           if (u.dresscode) ketLines.push(`PAKAIAN : ${u.dresscode}`);
           if (u.catatanLain) ketLines.push(`CATATAN : ${u.catatanLain}`);
           
           keterangan = ketLines.join("\n");
        }

        const rowValues = [
          index + 1,
          doc.nomorSurat,
          format(new Date(doc.tanggalSurat), "dd MMM yyyy", { locale: localeId }),
          doc.nomorAgenda || "-",
          format(new Date(doc.tanggalTerima), "dd MMM yyyy", { locale: localeId }),
          doc.asalSurat || "-",
          doc.perihal
        ];

        if (documentType !== "SURAT_MASUK") {
          rowValues.push(keterangan);
        }

        // Aggregate instruksi & penerima
        const allInstruksi: string[] = [];
        const allPenerima: string[] = [];
        
        if (doc.decisions && doc.decisions.length > 0) {
          const d = doc.decisions[0];
          if (d.decisionNote) allInstruksi.push(`[Direktur]: ${d.decisionNote}`);
        }
        
        if (doc.disposisi && (doc as any).disposisi.length > 0) {
          (doc as any).disposisi.forEach((disp: any) => {
            if (disp.instruksi && disp.ke) allInstruksi.push(`[${disp.ke.role}]: ${disp.instruksi}`);
            else if (disp.instruksi) allInstruksi.push(disp.instruksi);
            
            if (disp.ke) {
              allPenerima.push(disp.ke.name + (disp.ke.divisi ? ` (${disp.ke.divisi})` : ""));
            } else if (disp.jabatanKe) {
              allPenerima.push(disp.jabatanKe);
            }
          });
        }
        
        rowValues.push(allInstruksi.length > 0 ? allInstruksi.join("\n") : "-");
        rowValues.push(allPenerima.length > 0 ? Array.from(new Set(allPenerima)).join(", ") : "-");

        const row = worksheet.addRow(rowValues);

        row.alignment = { vertical: 'top', wrapText: true };
        row.eachCell((cell) => {
          cell.border = {
            top: {style:'thin'},
            left: {style:'thin'},
            bottom: {style:'thin'},
            right: {style:'thin'}
          };
        });
      });

      // Adjust column widths
      worksheet.getColumn(1).width = 5;  // NO
      worksheet.getColumn(2).width = 25; // NO SURAT
      worksheet.getColumn(3).width = 15; // TGL SURAT
      worksheet.getColumn(4).width = 15; // NO. AGENDA
      worksheet.getColumn(5).width = 15; // TGL. TERIMA
      worksheet.getColumn(6).width = 25; // ASAL SURAT
      worksheet.getColumn(7).width = 40; // PERIHAL

      let nextCol = 8;
      if (documentType !== "SURAT_MASUK") {
        worksheet.getColumn(nextCol).width = 50; // KETERANGAN
        nextCol++;
      }
      worksheet.getColumn(nextCol).width = 40; // INSTRUKSI
      worksheet.getColumn(nextCol + 1).width = 30; // PENERIMA

      const buffer = await workbook.xlsx.writeBuffer();
      const filename = `Laporan_Dokumen_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`;

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}"`
        }
      });
    } catch (error) {
      console.error("[GET /api/documents/export]", error);
      return errorResponse("Gagal mengexport data dokumen.", 500);
    }
  });
}
