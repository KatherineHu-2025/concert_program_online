'use client';

import { usePathname } from 'next/navigation';
import NavBar from './NavBar';

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  return (
    <div className="flex min-h-screen">
      {!isAuthPage && <NavBar />}
      <main className={`flex-1 ${!isAuthPage ? 'ml-[240px]' : ''}`}>
        {children}
      </main>
    </div>
  );
} 