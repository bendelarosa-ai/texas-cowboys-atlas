import AppHeader from "@/components/shell/AppHeader";
import { PREVIEW, requireViewer } from "@/lib/data";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requireViewer();

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:shadow"
      >
        Skip to content
      </a>
      <AppHeader viewer={viewer} preview={PREVIEW} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <footer className="border-t border-stone-200 py-6">
        <div className="container-app flex flex-col gap-1 text-[13px] text-stone-500 sm:flex-row sm:justify-between">
          <p>Texas Cowboys · Est. 1922 · The University of Texas at Austin</p>
          <p>Private network — for members only. Please don&rsquo;t share member information outside it.</p>
        </div>
      </footer>
    </div>
  );
}
