import { getRoleLabel } from "@/lib/permissions";

interface Props {
  fullName: string;
  role: string;
}

export default function RegistryHeader({ fullName, role }: Props) {
  return (
    <header className="bg-white border-b border-zinc-200 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
      <div className="lg:hidden" />
      <div className="hidden lg:block" />
      <div className="flex items-center gap-3 ml-auto">
        <div className="text-right">
          <p className="text-sm font-medium text-zinc-900">{fullName}</p>
          <p className="text-xs text-zinc-500">{getRoleLabel(role)}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-green-100 text-green-800 flex items-center justify-center text-sm font-bold">
          {fullName.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
