'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Car, Flame, ShieldAlert, User, Wallet, Lock } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuth } from '@/lib/auth';

const BASE_ITEMS = [
  { href: '/', label: 'Corridas', icon: Car },
  { href: '/radar', label: 'Radar', icon: Flame },
  { href: '/financeiro', label: 'Financeiro', icon: Wallet },
  { href: '/seguranca', label: 'Segurança', icon: ShieldAlert },
  { href: '/perfil', label: 'Perfil', icon: User }
];

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const items = user?.role === 'admin' 
    ? BASE_ITEMS.map(i => i.href === '/seguranca' ? { href: '/admin', label: 'Admin', icon: Lock } : i)
    : BASE_ITEMS;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 dark:border-dark-700 bg-white/95 dark:bg-dark-800/95 backdrop-blur-md safe-bottom shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors',
                active ? 'text-brand-500' : 'text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200'
              )}
            >
              <Icon size={22} strokeWidth={active ? 2.4 : 1.8} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
