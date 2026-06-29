/**
 * @file components/documents/DisposisiViewer.tsx
 * @description Komponen untuk menampilkan daftar atau riwayat disposisi (perjalanan dokumen) beserta instruksi yang diberikan pada suatu dokumen.
 * @location Dirender di berbagai halaman detail dokumen bagi user yang terkait (Admin, Kabag, dll).
 */
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { GitBranch } from "lucide-react";

interface DisposisiData {
  id: string;
  jabatanKe: string | null;
  instruksi: string | null;
  keterangan: string | null;
  tanggalTandaTangan: Date | string | null;
  tanggalPenyelesaian?: Date | string | null;
  dari: { name: string; signature?: string | null; role?: string | null };
  ke: { name: string } | null;
  createdAt: Date | string;
}

interface DocMeta {
  nomorSurat: string;
  perihal: string;
  asalSurat: string | null;
  nomorAgenda: string | null;
  tanggalSurat: Date | string;
  tanggalTerima: Date | string;
  documentType?: string;
}

interface DisposisiViewerProps {
  disposisi: DisposisiData;
  doc: DocMeta;
  actions?: React.ReactNode;
}

const fmtDate = (d?: Date | string | null) =>
  d ? format(new Date(d as string), "dd MMMM yyyy", { locale: localeId }) : "-";

export function DisposisiViewer({ disposisi, doc, actions }: DisposisiViewerProps) {
  const isMatched = (item: string) => {
    if (!disposisi.jabatanKe) return false;
    const selected = disposisi.jabatanKe.toLowerCase();
    const cleanItem = item.toLowerCase();
    
    if (cleanItem.includes("admin") && (selected.includes("admin") || selected.includes("adum") || selected.includes("keuangan") || selected.includes("administrasi"))) return true;
    if (cleanItem.includes("teknik") && selected.includes("teknik")) return true;
    if (cleanItem.includes("hublang") && (selected.includes("hublang") || selected.includes("hubungan langganan"))) return true;
    if (cleanItem.includes("spi") && selected.includes("spi")) return true;
    if (cleanItem.includes("utara") && selected.includes("utara")) return true;
    if (cleanItem.includes("selatan") && selected.includes("selatan")) return true;
    
    return selected.includes(cleanItem);
  };

  const standardItems = [
    "Kabag Admin dan Keu",
    "Kabag Teknik",
    "Kabag Hublang",
    "Kepala SPI",
    "Kacab. Utara",
    "Kacab. Selatan",
  ];

  const ROLE_LABELS: Record<string, string> = {
    ADMIN_STAFF: "Admin Staff",
    AGENDARIS: "Agendaris",
    DIREKTUR: "Direktur Utama",
    KABAG: "Kepala Bagian",
    KASUBAG: "Kepala Sub Bagian",
  };
  
  const senderRole = disposisi?.dari?.role ? ROLE_LABELS[disposisi.dari.role] : "Direktur Utama";

  return (
    <div className="card p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-blue-600" />
          {doc.documentType === "UNDANGAN" ? "Lembar Disposisi Surat Undangan" : "Lembar Disposisi Surat Masuk"}
        </h3>
        {actions}
      </div>

      {/* High-Fidelity Formal Layout */}
      <div className="border-4 border-gray-900 rounded-lg overflow-hidden bg-white text-black font-sans">
        
        {/* Header */}
        <div className="border-b-4 border-gray-900 py-4 px-4 text-center">
          <p className="text-sm font-extrabold text-gray-800 uppercase tracking-wide leading-snug">
            PERUSAHAAN UMUM DAERAH AIR MINUM TIRTA MAKMUR KABUPATEN SUKOHARJO
          </p>
          <p className="text-lg font-black mt-2 tracking-widest text-gray-900">
            {doc.documentType === "UNDANGAN" ? "LEMBAR DISPOSISI SURAT UNDANGAN" : "LEMBAR DISPOSISI SURAT MASUK"}
          </p>
        </div>

        {/* Info Rows (Simplified: No vertical columns divider and no horizontal row separator lines) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 border-b-4 border-gray-900 py-2 bg-gray-50/50">
          {/* Left Column */}
          <div className="flex flex-col gap-1">
            <PrintFieldViewer label="Tanggal Surat" value={fmtDate(doc.tanggalSurat)} />
            <PrintFieldViewer label="Asal Surat" value={doc.asalSurat ?? "-"} />
            <PrintFieldViewer label="Perihal" value={doc.perihal} />
          </div>
          {/* Right Column */}
          <div className="flex flex-col gap-1">
            <PrintFieldViewer label="Tanggal Terima" value={fmtDate(doc.tanggalTerima)} />
            <PrintFieldViewer label="Agenda" value={doc.nomorAgenda ?? "-"} />
            <PrintFieldViewer label="Nomor Surat" value={doc.nomorSurat} />
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x-4 divide-gray-900 min-h-[14rem]">
          {/* Left Column (Merged Disposisi Kepada + Isi Instruksi without divider line) */}
          <div className="p-4 flex flex-col justify-between">
            <div>
              {/* Disposisi Kepada */}
              <div className="mb-6">
                <p className="font-extrabold text-gray-800 mb-4 text-xs uppercase tracking-wide">
                  Disposisi Kepada :
                </p>
                <div className="flex flex-col gap-2 text-sm text-gray-900">
                  {standardItems.map((item, index) => {
                    const num = index + 1;
                    const active = isMatched(item);
                    return (
                      <div key={item} className={`flex items-center ${active ? "font-bold" : ""}`}>
                        <span className={`inline-flex items-center justify-center w-[22px] h-[22px] rounded-full border-2 text-xs font-bold mr-2
                          ${active 
                            ? "border-blue-600 text-blue-600 bg-blue-50" 
                            : "border-transparent text-gray-700"}`}>
                          {num}
                        </span>
                        <span className={active ? "text-blue-600 font-bold" : "text-gray-700"}>
                          {item}
                          {active && disposisi.ke?.name && (
                            <span className="ml-1.5 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">
                              {disposisi.ke.name}
                            </span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Isi Instruksi */}
              <div>
                <p className="font-extrabold text-gray-800 mb-3 text-xs uppercase tracking-wide">
                  ISI INSTRUKSI / INFORMASI :
                </p>
                <p className="text-base font-extrabold text-blue-600 whitespace-pre-wrap leading-relaxed">
                  {disposisi.instruksi ?? "-"}
                </p>
              </div>
            </div>

            {/* Signature block hidden per request */}
          </div>

          {/* Right Column (Merged Tanggal Penyelesaian + Catatan value without divider and no "CATATAN:" label) */}
          <div className="p-4 flex flex-col justify-between">
            <div>
              {/* Tanggal Penyelesaian */}
              <div className="mb-6">
                <p className="font-extrabold text-gray-800 mb-2.5 text-xs uppercase tracking-wide">
                  Tanggal Penyelesaian :
                </p>
                <div className="border-gray-500 pb-1 font-bold text-sm text-blue-600 min-h-[1.5rem]">
                  {fmtDate(disposisi.tanggalPenyelesaian || disposisi.tanggalTandaTangan)}
                </div>
              </div>

              {/* Catatan value */}
              {disposisi.keterangan ? (
                <p className="text-sm font-bold text-blue-600 border-gray-500 pb-2 mb-4">
                  {disposisi.keterangan}
                </p>
              ) : null}

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function PrintFieldViewer({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 flex items-start">
      <span className="font-extrabold text-[12px] text-gray-700 shrink-0 w-[110px] uppercase tracking-wide">{label}</span>
      <span className="font-extrabold text-[12px] text-gray-700 shrink-0 mx-1">:</span>
      <span className="word-break break-all font-bold text-sm text-blue-600 grow pl-1">
        {value || "-"}
      </span>
    </div>
  );
}
