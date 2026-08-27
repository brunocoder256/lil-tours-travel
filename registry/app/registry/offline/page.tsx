export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 bg-zinc-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728m-2.829-2.829a5 5 0 00-7.071-7.071M6.343 17.657a9 9 0 010-12.728m2.829 2.829a5 5 0 007.071 7.071M12 12h.01" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-zinc-900 mb-2">You&apos;re Offline</h1>
        <p className="text-sm text-zinc-600 mb-6">
          No internet connection detected. Field lead capture is available offline.
          Your data will sync when connection returns.
        </p>
        <a
          href="/registry/field-leads/new"
          className="inline-flex items-center gap-2 bg-green-800 hover:bg-green-900 text-white font-medium py-2.5 px-6 rounded-md text-sm transition-colors"
        >
          Capture Lead Offline
        </a>
      </div>
    </div>
  );
}
