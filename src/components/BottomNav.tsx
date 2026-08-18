'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Car, Flame, ShieldAlert, User, Wallet } from 'lucide-react';
import { cn } from '@/lib/cn';

const ITEMS = [
  { href: '/', label: 'Corridas', icon: Car },
  { href: '/radar', label: 'Radar', icon: Flame },
  { href: '/financeiro', label: 'Financeiro', icon: Wallet },
  { href: '/seguranca', label: 'Segurança', icon: ShieldAlert },
  { href: '/perfil', label: 'Perfil', icon: User }
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur-md safe-bottom shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors',
                active ? 'text-brand-500' : 'text-gray-500 hover:text-gray-900'
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
