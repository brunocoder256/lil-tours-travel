import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import RegistrySidebar from "@/components/RegistrySidebar";
import RegistryHeader from "@/components/RegistryHeader";

export default async function RegistryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session.user || !session.profile) {
    redirect("/registry/login");
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      <RegistrySidebar role={session.profile.role} fullName={session.profile.full_name} />
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <RegistryHeader
          fullName={session.profile.full_name}
          role={session.profile.role}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
