import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { PrintButton } from "@/components/documents/PrintButton";

type Params = { params: Promise<{ id: string }> };

export default async function CetakDisposisi(props: Params) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "AGENDARIS") redirect("/dashboard");

  const doc = await prisma.suratMasuk.findUnique({
    where: { id: params.id },
    include: {
      disposisi: {
        include: { dari: { select: { name: true, signature: true, role: true } } },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      decisions: {
        orderBy: { decidedAt: "desc" },
        take: 1,
      },
    },
  });

  if (!doc) notFound();

  const latestDisposisi = doc.disposisi?.[0] ?? null;
  const latestDecision = doc.decisions?.[0] ?? null;
  
  const ROLE_LABELS: Record<string, string> = {
    ADMIN_STAFF: "Admin Staff",
    AGENDARIS: "Agendaris",
    DIREKTUR: "Direktur Utama",
    KABAG: "Kepala Bagian",
    KASUBAG: "Kepala Sub Bagian",
  };
  
  const senderRole = latestDisposisi?.dari?.role ? ROLE_LABELS[latestDisposisi.dari.role] : "Direktur Utama";

  const isMatched = (item: string) => {
    if (!latestDisposisi?.jabatanKe) return false;
    const selected = latestDisposisi.jabatanKe.toLowerCase();
    const cleanItem = item.toLowerCase();
    
    if (cleanItem.includes("adum") && (selected.includes("adum") || selected.includes("keuangan") || selected.includes("administrasi"))) return true;
    if (cleanItem.includes("teknik") && selected.includes("teknik")) return true;
    if (cleanItem.includes("hublang") && (selected.includes("hublang") || selected.includes("hubungan langganan"))) return true;
    if (cleanItem.includes("spi") && selected.includes("spi")) return true;
    if (cleanItem.includes("utara") && selected.includes("utara")) return true;
    if (cleanItem.includes("selatan") && selected.includes("selatan")) return true;
    
    return selected.includes(cleanItem);
  };

  const standardItems = [
    "Kabag Adum dan Keu",
    "Kabag Teknik",
    "Kabag Hublang",
    "Kepala SPI",
    "Kacab. Utara",
    "Kacab. Selatan",
  ];

  return (
    <div className="p-8 max-w-[21cm] mx-auto bg-white min-h-[29.7cm] text-black relative">
      {/* Tombol Navigasi & Print (Sembunyi saat dicetak) */}
      <div className="mb-8 flex items-center justify-between print:hidden">
        <a 
          href={`/dashboard/admin/arsip/${params.id}`}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <span>⬅️</span> Kembali ke Detail
        </a>
        <PrintButton />
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @page { size: A4; margin: 0; }
        body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        #print-area * { box-sizing: border-box; }
      `}} />

      <div id="print-area" style={{ border: '4px solid black', backgroundColor: 'white', color: 'black', fontFamily: 'Arial, sans-serif', width: '100%' }}>
        {/* Header */}
        <div style={{ borderBottom: '4px solid black', padding: '20px 16px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 6px 0', lineHeight: 1.3 }}>
            PERUSAHAAN UMUM DAERAH AIR MINUM TIRTA MAKMUR KABUPATEN SUKOHARJO
          </h1>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '10px', letterSpacing: '2px', textTransform: 'uppercase' }}>
            {doc.documentType === "UNDANGAN" ? "LEMBAR DISPOSISI SURAT UNDANGAN" : "LEMBAR DISPOSISI SURAT MASUK"}
          </h2>
        </div>

        {/* Info rows (Simplified: No vertical and no horizontal separator lines) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '4px solid black', padding: '10px 0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <PrintField label="Tanggal Surat" value={format(new Date(doc.tanggalSurat), "dd MMMM yyyy", { locale: localeId })} />
            <PrintField label="Asal Surat" value={doc.asalSurat ?? "-"} />
            <PrintField label="Tujuan" value={doc.tujuan ?? "-"} />
            <PrintField label="Perihal" value={doc.perihal} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <PrintField label="Tanggal Terima" value={format(new Date(doc.tanggalTerima), "dd MMMM yyyy", { locale: localeId })} />
            <PrintField label="Agenda" value={doc.nomorAgenda ?? "-"} />
            <PrintField label="Nomor Surat" value={doc.nomorSurat} />
          </div>
        </div>

        {/* Bottom Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '16cm' }}>
          {/* Kolom Kiri: Disposisi Kepada + Isi Instruksi (Merged without separator line) */}
          <div style={{ display: 'flex', flexDirection: 'column', borderRight: '3px solid black', padding: '20px', justifyContent: 'space-between' }}>
            <div>
              {/* Disposisi Kepada */}
              <div>
                <p style={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', fontSize: '13px' }}>Disposisi Kepada :</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', marginBottom: '24px' }}>
                  {standardItems.map((item, index) => {
                    const num = index + 1;
                    const active = isMatched(item);
                    return (
                      <div key={item} style={{ display: 'flex', alignItems: 'center', fontWeight: active ? 'bold' : 'normal' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          border: active ? '2px solid #1d4ed8' : '2px solid transparent',
                          color: active ? '#1d4ed8' : '#000',
                          fontWeight: 'bold',
                          marginRight: '8px',
                          fontSize: '13px',
                          backgroundColor: active ? '#eff6ff' : 'transparent',
                        }}>
                          {num}
                        </span>
                        <span style={{ color: active ? '#1d4ed8' : '#000' }}>
                          {item}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Isi Instruksi */}
              <div>
                <p style={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px', fontSize: '13px' }}>Isi Instruksi/Informasi :</p>
                <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '16px', fontWeight: 'bold', color: '#1d4ed8', padding: '0 4px' }}>
                  {latestDisposisi?.instruksi ?? "-"}
                </p>
              </div>

              {/* Keputusan Direktur */}
              <div style={{ marginTop: '20px' }}>
                <p style={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px', fontSize: '13px' }}>Keputusan Direktur :</p>
                <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '16px', fontWeight: 'bold', color: '#1d4ed8', padding: '0 4px' }}>
                  {latestDecision?.decisionType ?? "-"}
                  {latestDecision?.decisionNote ? `\nCatatan: ${latestDecision.decisionNote}` : ""}
                </p>
              </div>
            </div>

            {/* Signature block hidden per request */}
          </div>

          {/* Kolom Kanan: Tanggal Penyelesaian + Catatan (Merged without separator line and no "CATATAN:" label) */}
          <div style={{ display: 'flex', flexDirection: 'column', padding: '20px' }}>
            {/* Top: Tanggal Penyelesaian */}
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', fontSize: '13px' }}>Tanggal Penyelesaian</p>
              <div style={{ paddingBottom: '4px', fontWeight: 'bold', fontSize: '14px', color: '#1d4ed8', minHeight: '24px' }}>
                {latestDisposisi?.tanggalPenyelesaian || latestDisposisi?.tanggalTandaTangan
                  ? format(new Date((latestDisposisi.tanggalPenyelesaian || latestDisposisi.tanggalTandaTangan) as Date), "dd MMMM yyyy", { locale: localeId })
                  : "-"}
              </div>
            </div>

            {/* Bottom: Catatan value & Guidelines */}
            <div style={{ flexGrow: 1 }}>
              {latestDisposisi?.keterangan ? (
                <>
                  <p style={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px', fontSize: '13px' }}>Catatan :</p>
                  <p style={{ whiteSpace: 'pre-wrap', fontSize: '14px', color: '#1d4ed8', fontWeight: 'bold', paddingBottom: '8px', marginBottom: '12px' }}>
                    {latestDisposisi.keterangan}
                  </p>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PrintField({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      padding: '8px 16px',
      display: 'flex',
      alignItems: 'flex-start',
    }}>
      <span style={{ fontWeight: 'bold', width: '120px', flexShrink: 0, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.02em', color: '#374151' }}>{label}</span>
      <span style={{ fontWeight: 'bold', margin: '0 8px', flexShrink: 0, fontSize: '13px', color: '#374151' }}>:</span>
      <span style={{ wordBreak: 'break-all', fontWeight: 'bold', fontSize: '14px', color: '#1d4ed8' }}>
        {value || "-"}
      </span>
    </div>
  );
}
