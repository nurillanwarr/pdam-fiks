/**
 * @file types/index.ts
 * @description Definisi tipe data (interfaces & types) global untuk aplikasi.
 * Menyediakan standarisasi struktur data untuk dokumen, user, timeline, 
 * serta mapping label dan warna untuk status dokumen.
 * Mendukung 7 jenis surat: Undangan, Surat Masuk, Surat Tugas,
 * Surat Keluar, SK Direktur, Perjanjian, Peraturan Direktur.
 */
// types/index.ts

import {
  UserRole,
  DocumentStatus,
  DecisionType,
  FileType,
  ReviewStatus,
  DocumentType,
  UndanganType,
  DocumentCategory,
  UndanganMedia,
} from "@prisma/client";

export type { UserRole, DocumentStatus, DecisionType, FileType, ReviewStatus, DocumentType, UndanganType, DocumentCategory, UndanganMedia };

// ─────────────────────────────────────────────
//  USER TYPES
// ─────────────────────────────────────────────

export interface UserPayload {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  divisi?: string | null;
  title?: string | null;
  image?: string | null;
}

export interface UserSession extends UserPayload {
  accessToken?: string;
}

// ─────────────────────────────────────────────
//  DOCUMENT TYPES
// ─────────────────────────────────────────────

export interface DocumentListItem {
  id: string;
  nomorSurat: string;
  nomorAgenda?: string | null;
  perihal: string;
  tujuan?: string | null;
  asalSurat: string | null;
  tanggalSurat: Date | string;
  currentStatus: DocumentStatus;
  documentType: DocumentType;
  category: DocumentCategory;
  createdAt: Date | string;
  createdBy: {
    id: string;
    name: string;
    divisi: string | null;
    email?: string | null;
  };
}

export interface DocumentDetail extends DocumentListItem {
  deskripsi?: string | null;
  nomorAgenda: string | null;
  tanggalTerima: Date | string;
  tanggalInstruksi?: Date | string | null;
  tanggalPenyelesaian?: Date | string | null;
  files: DocumentFileItem[];
  reviews: ReviewItem[];
  decisions: DecisionItem[];
  statusTimeline: TimelineItem[];
  archive: ArchiveItem | null;
  jadwalDirekturs?: JadwalItem[];
  disposisi?: DisposisiItem[];
  undangan?: UndanganItem | null;
}

export interface DocumentFileItem {
  id: string;
  fileType: FileType;
  fileName: string;
  filePath: string;
  fileSize: number | null;
  mimeType: string | null;
  uploadedAt: Date | string;
  uploadedBy: { name: string };
}

export interface ReviewItem {
  id: string;
  reviewNote: string | null;
  reviewStatus: ReviewStatus;
  reviewedAt: Date | string;
  reviewedBy: { name: string };
}

export interface DecisionItem {
  id: string;
  decisionType: DecisionType;
  decisionNote: string | null;
  tempat: string | null;
  tanggalTandaTangan: Date | string | null;
  parafDirektur: string | null;
  tanggalInstruksi: Date | string | null;
  batalTandaTangan: boolean;
  decidedAt: Date | string;
  director: { name: string };
}

export interface TimelineItem {
  id: string;
  fromStatus: DocumentStatus | null;
  toStatus: DocumentStatus;
  changedBy: { name: string };
  notes: string | null;
  createdAt: Date | string;
}

export interface ArchiveItem {
  id: string;
  serverLocation: string | null;
  archivedAt: Date | string;
  archivedBy: { name: string };
  bulan: number;
  tahun: number;
  notes?: string | null;
}

export interface JadwalItem {
  id: string;
  jadwalKirim: Date | string;
  isUrgen: boolean;
  isSent: boolean;
  sentAt: Date | string | null;
}

export interface DisposisiItem {
  id: string;
  jabatanKe: string | null;
  instruksi: string | null;
  keterangan: string | null;
  tempat: string | null;
  tanggalTandaTangan: Date | string | null;
  parafDariId: string | null;
  tanggalInstruksi: Date | string | null;
  tanggalPenyelesaian: Date | string | null;
  dari: { name: string };
  ke: { name: string } | null;
  createdAt: Date | string;
}

export interface UndanganItem {
  id: string;
  hari: string;
  tanggal: Date | string;
  jam: string;
  tempat: string;
  media: UndanganMedia;
  dresscode: string | null;
  catatanLain: string | null;
  deadline: Date | string;
  undanganType: UndanganType;
  pengirimExternal: string | null;
  kontakExternal: string | null;
  penerima: {
    id: string;
    undanganId: string;
    userId: string;
    sudahBaca: boolean;
    user: {
      id: string;
      name: string;
      divisi: string | null;
    };
  }[];
}

// ─────────────────────────────────────────────
//  API RESPONSE TYPES
// ─────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─────────────────────────────────────────────
//  FORM/REQUEST TYPES
// ─────────────────────────────────────────────

export interface CreateDocumentInput {
  nomorSurat: string;
  perihal: string;
  asalSurat?: string;
  tanggalSurat: string; // ISO date string
  documentType?: DocumentType;
}

export interface ReviewDocumentInput {
  documentId: string;
  reviewStatus: ReviewStatus;
  reviewNote?: string;
}

export interface DirectorDecisionInput {
  documentId: string;
  decisionType: DecisionType;
  decisionNote?: string;
  tempat?: string;
  tanggalInstruksi?: string;
  batalTandaTangan?: boolean;
}

export interface ArchiveDocumentInput {
  documentId: string;
  serverLocation?: string;
  notes?: string;
}

// ─────────────────────────────────────────────
//  STATUS LABEL MAPPING
// ─────────────────────────────────────────────

export const STATUS_LABELS: Record<DocumentStatus, string> = {
  DRAFT: "Draft",
  MENUNGGU_REVIEW_AGENDARIS: "Menunggu Review Agendaris",
  PERLU_REVISI: "Perlu Revisi",
  DIJADWALKAN_KE_DIREKTUR: "Dijadwalkan Ke Direktur",
  MENUNGGU_KEPUTUSAN_DIREKTUR: "Menunggu Keputusan Direktur",
  DIPROSES_DIREKTUR: "Diproses Direktur",
  KEPUTUSAN_DIREKTUR_SELESAI: "Keputusan Direktur Selesai",
  MENUNGGU_PENGAMBILAN_STAFF: "Menunggu Pengambilan Staff",
  MENUNGGU_SCAN_FINAL: "Menunggu Scan Final",
  MENUNGGU_ARSIP_ADMIN: "Menunggu Arsip Admin",
  ARSIP_FINAL_TERSIMPAN: "Arsip Final Tersimpan",
};

export const STATUS_COLORS: Record<DocumentStatus, string> = {
  DRAFT: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
  MENUNGGU_REVIEW_AGENDARIS: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-500",
  PERLU_REVISI: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  DIJADWALKAN_KE_DIREKTUR: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400",
  MENUNGGU_KEPUTUSAN_DIREKTUR: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400",
  DIPROSES_DIREKTUR: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400",
  KEPUTUSAN_DIREKTUR_SELESAI: "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400",
  MENUNGGU_PENGAMBILAN_STAFF: "bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-400",
  MENUNGGU_SCAN_FINAL: "bg-lime-100 dark:bg-lime-900/30 text-lime-800 dark:text-lime-400",
  MENUNGGU_ARSIP_ADMIN: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-400",
  ARSIP_FINAL_TERSIMPAN: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400",
};

export const DECISION_LABELS: Record<DecisionType, string> = {
  DISETUJUI: "Disetujui — Dikembalikan ke Agendaris",
  DITOLAK: "Ditolak",
  REVISI: "Perlu Revisi",
  DISPOSISI: "Disposisi",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN_STAFF: "Admin Staff",
  AGENDARIS:   "Agendaris",
  DIREKTUR:    "Direktur Utama",
  KABAG:       "Kepala Bagian",
  KASUBAG:     "Kepala Sub Bagian",
};

// ─────────────────────────────────────────────
//  DOCUMENT TYPE LABELS & COLORS (7 jenis surat)
// ─────────────────────────────────────────────

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  UNDANGAN:           "Undangan",
  SURAT_MASUK:        "Surat Masuk",
  SURAT_TUGAS:        "Surat Tugas",
  SURAT_KELUAR:       "Surat Keluar",
  SK_DIREKTUR:        "SK Direktur",
  PERJANJIAN:         "Perjanjian",
  PERATURAN_DIREKTUR: "Peraturan Direktur",
};

export const DOCUMENT_TYPE_COLORS: Record<DocumentType, string> = {
  UNDANGAN:           "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400",
  SURAT_MASUK:        "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400",
  SURAT_TUGAS:        "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400",
  SURAT_KELUAR:       "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400",
  SK_DIREKTUR:        "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400",
  PERJANJIAN:         "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-400",
  PERATURAN_DIREKTUR: "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400",
};

export const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  UNDANGAN:    "Undangan",
  PEMBELIAN:   "Pembelian",
  KERJASAMA:   "Kerjasama",
  KEPEGAWAIAN: "Kepegawaian",
  KEUANGAN:    "Keuangan",
  PERIZINAN:   "Perizinan",
  PENGADAAN:   "Pengadaan",
  HUKUM:       "Hukum",
  TEKNIK:      "Teknik",
  DLL:         "Dan Lain-Lain",
};
