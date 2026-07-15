/**
 * @file lib/supabase.ts
 * @description Supabase client untuk Storage (upload/download file).
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key';

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const STORAGE_BUCKET = "documents";
