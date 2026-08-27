export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-2xl flex-col items-center justify-center py-20 px-8 bg-white dark:bg-black text-center">
        <h1 className="text-3xl font-bold tracking-tight text-black dark:text-zinc-50 mb-4">
          Lil Tours &amp; Travel
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8">
          Internal Client Registry
        </p>
        <div className="text-sm text-zinc-500 dark:text-zinc-500 space-y-1">
          <p>Registry application is being prepared.</p>
          <p>Authentication and database integration coming in future phases.</p>
        </div>
      </main>
    </div>
  );
}
