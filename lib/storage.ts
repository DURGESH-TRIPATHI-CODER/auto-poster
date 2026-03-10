import { supabaseAdmin } from "./supabaseClient";

const BUCKET = "post-images";
const MARKER = "/post-images/";

export function pathFromPublicUrl(publicUrl?: string | null): string | null {
  if (!publicUrl) return null;
  const idx = publicUrl.indexOf(MARKER);
  if (idx === -1) return null;
  const path = publicUrl.slice(idx + MARKER.length);
  return path || null;
}

/** Best-effort deletion of a public URL from the post-images bucket. */
export async function deletePostImage(publicUrl?: string | null) {
  const path = pathFromPublicUrl(publicUrl);
  if (!path) return;
  const { error } = await supabaseAdmin.storage.from(BUCKET).remove([path]);
  if (error) {
    // Non-fatal: log for diagnostics
    console.warn("[storage] Failed to delete image:", error.message);
  }
}

export async function listAllImages(): Promise<string[]> {
  const paths: string[] = [];
  let page = 0;
  const limit = 100;
  while (true) {
    const { data, error } = await supabaseAdmin.storage.from(BUCKET).list("", { limit, offset: page * limit });
    if (error) {
      console.warn("[storage] List failed:", error.message);
      break;
    }
    if (!data || data.length === 0) break;
    paths.push(...data.map((d) => d.name));
    if (data.length < limit) break;
    page += 1;
  }
  return paths;
}
