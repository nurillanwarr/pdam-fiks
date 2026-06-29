/**
 * @file lib/upload.ts
 * @description Modul untuk menangani validasi dan penyimpanan file upload.
 * Mendukung pembatasan tipe file (PDF, JPG, PNG) dan ukuran maksimum (20MB), 
 * serta menghasilkan nama file unik untuk penyimpanan di Supabase Storage.
 */
// lib/upload.ts
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { supabase, STORAGE_BUCKET } from "./supabase";

const ALLOWED_MIME = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
];

const MAX_SIZE_MB = 20;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export interface UploadResult {
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
}

export function validateFile(
  mimeType: string,
  fileSize: number
): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME.includes(mimeType)) {
    return {
      valid: false,
      error: `Tipe file tidak diizinkan. Hanya PDF, JPG, PNG. (${mimeType})`,
    };
  }
  if (fileSize > MAX_SIZE_BYTES) {
    return {
      valid: false,
      error: `Ukuran file melebihi batas ${MAX_SIZE_MB}MB.`,
    };
  }
  return { valid: true };
}

export async function saveUploadedFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  subDir = "documents"
): Promise<UploadResult> {
  const { fileTypeFromBuffer } = await import("file-type");
  const type = await fileTypeFromBuffer(buffer);

  if (!type || !ALLOWED_MIME.includes(type.mime)) {
    throw new Error(`Tipe file tidak diizinkan atau terdeteksi palsu. Detected: ${type?.mime}`);
  }

  const ext = path.extname(originalName) || mimeTypeToExt(type.mime);
  const uniqueName = `${uuidv4()}${ext}`;
  const storagePath = `${subDir}/${uniqueName}`;

  // Upload ke Supabase Storage
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, buffer, {
      contentType: type.mime,
      upsert: false,
    });

  if (error) {
    console.error("[Supabase Storage Upload Error]", error);
    throw new Error(`Gagal mengupload file ke storage: ${error.message}`);
  }

  // Dapatkan public URL
  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(storagePath);

  return {
    fileName: originalName,
    filePath: urlData.publicUrl,
    fileSize: buffer.length,
    mimeType: type.mime,
  };
}

function mimeTypeToExt(mime: string): string {
  const map: Record<string, string> = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
  };
  return map[mime] ?? ".bin";
}
