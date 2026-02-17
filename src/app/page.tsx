'use client';

import dynamic from 'next/dynamic';

const AppShell = dynamic(() => import('@/components/layout/AppShell'), {
  ssr: false,
  loading: () => (
    <div className="h-[100dvh] w-full bg-surface-dark flex items-center justify-center">
      <div className="text-center animate-fade-up">
        <div className="text-4xl font-bold mb-2">
          <span className="text-white">mig</span>
          <span className="text-neon-pink">goo</span>
        </div>
        <div className="text-sm text-muted-foreground">Loading your campus...</div>
        <div className="mt-4 w-32 h-1 bg-white/[0.06] rounded-full mx-auto overflow-hidden">
          <div className="h-full bg-neon-pink rounded-full animate-pulse w-1/2" />
        </div>
      </div>
    </div>
  ),
});

export default function Home() {
  return <AppShell />;
}
