import { supabaseAdmin } from "./supabaseClient";

const BUCKET = "post-images";
const MARKER = "/post-images/";

/** Best-effort deletion of a public URL from the post-images bucket. */
export async function deletePostImage(publicUrl?: string | null) {
  if (!publicUrl) return;
  const idx = publicUrl.indexOf(MARKER);
  if (idx === -1) return;
  const path = publicUrl.slice(idx + MARKER.length);
  if (!path) return;
  const { error } = await supabaseAdmin.storage.from(BUCKET).remove([path]);
  if (error) {
    // Non-fatal: log for diagnostics
    console.warn("[storage] Failed to delete image:", error.message);
  }
}

