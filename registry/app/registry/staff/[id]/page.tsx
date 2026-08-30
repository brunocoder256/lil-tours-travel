import { requireAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import StaffForm from "@/components/StaffForm";

export default async function EditStaffPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth();
  if (!session || !session.profile) redirect("/registry/login");
  if (!hasPermission(session.profile.role, "staff.manage")) redirect("/registry/staff");

  const { id } = await params;
  const supabase = createServerClient();

  const { data: staff } = await supabase
    .from("staff_profiles")
    .select("id, full_name, phone, role, is_active")
    .eq("id", id)
    .single();

  if (!staff) notFound();

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link href="/registry/staff" className="text-sm text-green-700 hover:text-green-800 mb-2 inline-flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Staff
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900 mt-2">Edit Staff Member</h1>
        <p className="text-sm text-zinc-500 mt-1">Update {staff.full_name}&apos;s account</p>
      </div>
      <div className="bg-white rounded-lg border border-zinc-200 p-6">
        <StaffForm mode="edit" initialData={staff} />
      </div>
    </div>
  );
}
