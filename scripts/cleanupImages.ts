/**
 * Remove orphaned images from the Supabase "post-images" bucket.
 *
 * Usage:
 *   npx tsx scripts/cleanupImages.ts
 */

import "dotenv/config";
import { supabaseAdmin } from "../lib/supabaseClient";
import { listAllImages, pathFromPublicUrl } from "../lib/storage";

async function main() {
  console.log("Cleaning orphaned images from bucket: post-images");

  const { data: posts, error } = await supabaseAdmin.from("posts").select("image_url, repeat_weekly, published");
  if (error) throw error;

  const keep = new Set<string>();
  for (const row of posts ?? []) {
    const path = pathFromPublicUrl((row as any).image_url);
    if (!path) continue;
    // Keep repeat_weekly images always; keep published images too.
    keep.add(path);
  }

  const all = await listAllImages();
  const toDelete = all.filter((p) => !keep.has(p));

  console.log(`Found ${all.length} images; keeping ${keep.size}; deleting ${toDelete.length}.`);
  if (toDelete.length === 0) {
    console.log("Nothing to delete.");
    return;
  }

  // Supabase remove can take up to 1000 items; chunk to be safe.
  const chunkSize = 100;
  for (let i = 0; i < toDelete.length; i += chunkSize) {
    const chunk = toDelete.slice(i, i + chunkSize);
    const { error: delErr } = await supabaseAdmin.storage.from("post-images").remove(chunk);
    if (delErr) {
      console.warn(`Delete chunk failed (${i}-${i + chunk.length}):`, delErr.message);
    } else {
      console.log(`Deleted ${chunk.length} images (${i + chunk.length}/${toDelete.length})`);
    }
  }
}

main().catch((err) => {
  console.error("cleanupImages failed:", err);
  process.exit(1);
});

