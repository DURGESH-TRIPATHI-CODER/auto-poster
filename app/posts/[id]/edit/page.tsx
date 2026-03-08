import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import { PostEditor } from "@/components/PostEditor";
import { supabaseAdmin } from "@/lib/supabaseClient";
import type { PostRow } from "@/lib/types";

interface PageProps {
  params: { id: string };
}

export default async function EditPostPage({ params }: PageProps) {
  noStore();

  const { data, error } = await supabaseAdmin.from("posts").select("*").eq("id", params.id).single();
  if (error || !data) notFound();

  return (
    <main className="container py-10 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Edit Post</h1>
        <Link href="/dashboard" className="text-sm font-medium text-primary hover:underline">
          Back to Dashboard
        </Link>
      </div>
      <PostEditor initialPost={data as PostRow} />
    </main>
  );
}
