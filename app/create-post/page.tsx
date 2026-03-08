import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { PostEditor } from "@/components/PostEditor";

interface CreatePostPageProps {
  searchParams?: { draftId?: string };
}

export default function CreatePostPage({ searchParams }: CreatePostPageProps) {
  return (
    <AppShell
      active="create-post"
      title="Create New Post"
      subtitle="Draft and schedule content across LinkedIn and X."
      action={
        <Link href="/dashboard" className="text-sm font-medium text-primary hover:underline">
          Back to Dashboard
        </Link>
      }
    >
      <PostEditor draftId={searchParams?.draftId} />
      <section className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <h2 className="text-sm font-semibold text-primary">Pro Tip</h2>
        <p className="mt-1 text-sm text-slate-600">Posts with visuals usually get better engagement. Add media before scheduling.</p>
      </section>
    </AppShell>
  );
}
