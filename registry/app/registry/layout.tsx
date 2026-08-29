import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth";
import RegistrySidebar from "@/components/RegistrySidebar";
import RegistryHeader from "@/components/RegistryHeader";
import { ConnectionProvider } from "@/components/ConnectionProvider";
import OfflineBanner from "@/components/OfflineBanner";
import Script from "next/script";

export const metadata = {
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Lil Tours",
  },
};

export const viewport = {
  themeColor: "#0d5e3a",
};

export default async function RegistryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hdrs = await headers();
  const isPublicRoute = hdrs.get("x-is-public-route") === "1";

  if (isPublicRoute) {
    return <>{children}</>;
  }

  const session = await getSession();

  if (!session.user || !session.profile) {
    redirect("/registry/login");
  }

  return (
    <ConnectionProvider userId={session.user.id}>
      <Script src="/sw.js" strategy="afterInteractive" />
      <Script id="register-sw" strategy="afterInteractive">
        {`
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js').catch(() => {});
            });
          }
        `}
      </Script>
      <div className="min-h-screen bg-zinc-50 flex flex-col">
        <OfflineBanner />
        <div className="flex-1 flex min-h-0">
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
      </div>
    </ConnectionProvider>
  );
}
