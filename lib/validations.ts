/**
 * @file lib/validations.ts
 * @description Definisi skema validasi data menggunakan Zod.
 * Digunakan baik di sisi client (form) maupun server (API) untuk memastikan 
 * integritas data input (login, pembuatan user, surat, review, dan keputusan).
 */
// lib/validations.ts
import { z } from "zod";

// ─── Auth ───────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

// ─── Users (Admin CRUD) ─────────────────────────────────────

export const createUserSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100),
  email: z.string().email("Format email tidak valid"),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .regex(/[A-Z]/, "Harus ada huruf kapital")
    .regex(/[0-9]/, "Harus ada angka"),
  role: z.enum(["ADMIN_STAFF", "AGENDARIS", "DIREKTUR", "KABAG", "KASUBAG"]),
  divisi: z.string().max(100).optional(),
});

export const updateUserSchema = createUserSchema
  .omit({ password: true })
  .extend({
    password: z
      .string()
      .min(8, "Password minimal 8 karakter")
      .optional()
      .or(z.literal("")),
    isActive: z.boolean().optional(),
  });

// ─── Documents ──────────────────────────────────────────────

export const createDocumentSchema = z.object({
  nomorSurat: z
    .string()
    .min(3, "Nomor surat terlalu pendek")
    .max(100, "Nomor surat terlalu panjang")
    .optional(),
  perihal: z.string().min(5, "Perihal minimal 5 karakter").max(500),
  deskripsi: z.string().max(2000).optional(),
  tujuan: z.string().max(200).optional(),
  asalSurat: z.string().max(200).optional(),
  tanggalSurat: z.string().refine((d) => !isNaN(Date.parse(d)), {
    message: "Format tanggal tidak valid (gunakan ISO date)",
  }),
  documentType: z.enum([
    "UNDANGAN", "SURAT_MASUK", "SURAT_TUGAS", "SURAT_KELUAR",
    "SK_DIREKTUR", "PERJANJIAN", "PERATURAN_DIREKTUR",
  ]).optional().default("SURAT_MASUK"),
  category: z.enum([
    "UNDANGAN", "PEMBELIAN", "KERJASAMA", "KEPEGAWAIAN",
    "KEUANGAN", "PERIZINAN", "PENGADAAN", "HUKUM", "TEKNIK", "DLL",
  ]).optional().default("DLL"),
  nomorAgenda: z.string().max(100).optional().or(z.literal("")),
  tanggalTerima: z.string().refine((d) => !d || !isNaN(Date.parse(d)), {
    message: "Format tanggal terima tidak valid",
  }).optional().or(z.literal("")),
  tanggalPenyelesaian: z.string().refine((d) => !d || !isNaN(Date.parse(d)), {
    message: "Format tanggal penyelesaian tidak valid",
  }).optional().or(z.literal("")),
});

export const updateDocumentSchema = createDocumentSchema.partial();

// ─── Undangan (Tambahan untuk buat undangan) ────────────────

export const createUndanganSchema = z.object({
  hari: z.string().min(1, "Hari wajib diisi"),
  tanggal: z.string().refine((d) => !isNaN(Date.parse(d)), {
    message: "Format tanggal tidak valid",
  }),
  jam: z.string().min(1, "Jam wajib diisi"),
  tempat: z.string().min(1, "Tempat wajib diisi"),
  media: z.enum(["ONLINE", "OFFLINE"]).default("OFFLINE"),
  detailMedia: z.string().max(200).optional(),
  dresscode: z.string().max(100).optional(),
  catatanLain: z.string().max(1000).optional(),
  deadline: z.string().refine((d) => !isNaN(Date.parse(d)), {
    message: "Format deadline tidak valid",
  }),
  undanganType: z.enum(["INTERNAL", "EXTERNAL"]).default("INTERNAL"),
  pengirimExternal: z.string().max(200).optional(),
  kontakExternal: z.string().max(100).optional(),
});

// ─── Review (Agendaris) ─────────────────────────────────────

export const reviewDocumentSchema = z.object({
  reviewStatus: z.enum(["DITERUSKAN", "DIKEMBALIKAN"]),
  reviewNote: z.string().max(1000).optional(),
});

// ─── Decision (Direktur) ────────────────────────────────────

export const directorDecisionSchema = z.object({
  decisionType: z.enum(["DISETUJUI", "DITOLAK", "REVISI", "DISPOSISI"]),
  decisionNote: z.string().max(2000).optional(),
  autoSign: z.boolean().optional(),
  tanggalInstruksi: z.string().refine((d) => !isNaN(Date.parse(d)), {
    message: "Tanggal instruksi wajib diisi dengan format yang valid",
  }),
  batalTandaTangan: z.boolean().optional().default(false),
});

// ─── Archive (Admin) ─────────────────────────────────────────

export const archiveDocumentSchema = z.object({
  serverLocation: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
});

// ─── Handover Confirmation ───────────────────────────────────

export const confirmHandoverSchema = z.object({
  handoverLogId: z.string().min(1),
});

// ─── Utility ─────────────────────────────────────────────────

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type CreateUndanganInput = z.infer<typeof createUndanganSchema>;
export type ReviewDocumentInput = z.infer<typeof reviewDocumentSchema>;
export type DirectorDecisionInput = z.infer<typeof directorDecisionSchema>;
export type ArchiveDocumentInput = z.infer<typeof archiveDocumentSchema>;
