'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Home, Search, Library, Bot, User } from 'lucide-react';

const navItems = [
  { icon: <Home size={22} />, path: '/home' },
  { icon: <Search size={22} />, path: '/search' },
  { icon: <Library size={22} />, path: '/library' },
  { icon: <Bot size={22} />, path: '/chat' },
  { icon: <User size={22} />, path: '/profile' },
];

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="bottom-nav">
      {navItems.map(item => (
        <button
          key={item.path}
          onClick={() => router.push(item.path)}
          style={{
            background: 'none',
            border: 'none',
            color: pathname === item.path ? 'var(--accent2)' : 'var(--text2)',
            cursor: 'pointer',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.2s',
          }}
        >
          {item.icon}
        </button>
      ))}
    </div>
  );
}