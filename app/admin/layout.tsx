'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

const NAV_ITEMS = [
  { href: '/admin/kitchen', label: '👨‍🍳 Cuisine', roles: ['chef', 'staff'] },
  { href: '/admin/statistiques', label: '📊 Statistiques', roles: ['chef'] },
  { href: '/admin/menu', label: '🍕 Pizzas', roles: ['chef', 'staff'] },
  { href: '/admin/desserts', label: '🍨 Desserts & Boissons', roles: ['chef', 'staff'] },
  { href: '/admin/supplements', label: '➕ Suppléments', roles: ['chef', 'staff'] },
  { href: '/admin/categories', label: '🏷️ Catégories', roles: ['chef'] },
  { href: '/admin/scan-qr', label: '📱 Scanner QR', roles: ['chef', 'staff'] },
  { href: '/admin/promos', label: '🎉 Promos', roles: ['chef'] },
  { href: '/admin/settings', label: '⚙️ Paramètres', roles: ['chef', 'staff'] },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') return <div className="p-8">Chargement...</div>;
  if (status === 'unauthenticated') return null;

  const userRole = session?.user?.role;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-gray-900">🍕 {session?.user?.pizzeriaName}</h1>
          <p className="text-sm text-gray-500 capitalize">{userRole}</p>
        </div>
        <nav className="p-4 space-y-1 flex-1">
          {NAV_ITEMS.filter(item => item.roles.includes(userRole!)).map(item => (
            <Link key={item.href} href={item.href} className={`block px-4 py-3 rounded-lg font-medium transition ${pathname === item.href ? 'bg-orange-100 text-orange-700' : 'text-gray-700 hover:bg-gray-100'}`}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center font-bold">{session?.user?.name?.[0]}</div>
            <div>
              <p className="font-medium text-sm">{session?.user?.name}</p>
              <p className="text-xs text-gray-500">{session?.user?.email}</p>
            </div>
          </div>
          <button onClick={() => signOut()} className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm">Déconnexion</button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}