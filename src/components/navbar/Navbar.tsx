'use client';

import { useMemo, useState, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { User } from 'lucide-react';

type NavItem = {
  href: string;
  label: ReactNode;
};

const navItemsUnAuth: NavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/login', label: 'Sign In' },
  { href: '/signup', label: 'Sign Up' },
];

const navItemsAuth: NavItem[] = [
  { href: '/files', label: 'Files' },
  { href: '/text', label: 'Text' },
  { href: '/passwords', label: 'Passwords' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const { isAuthenticated, logout } = useAuth();

  const navItems = isAuthenticated
    ? navItemsAuth
    : navItemsUnAuth;

  const activeHref = useMemo(() => {
    const match = navItems
      .map((it) => it.href)
      .find((href) => {
        if (href === '/') return pathname === '/';
        return pathname === href || pathname.startsWith(`${href}/`);
      });

    return match ?? '/';
  }, [pathname, navItems]);

  const onNav = () => {
    setOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setOpen(false);
    }
  };

  return (
    <nav className="sticky top-0 z-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3">
        <div className="glass-panel flex items-center justify-between gap-4 px-4 py-3">
          <Link
            href="/"
            onClick={onNav}
            className="flex items-center gap-3 min-w-0"
          >
            <span
              aria-hidden
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/20 border border-blue-400/20"
            >
              <span className="h-2.5 w-2.5 rounded-full bg-blue-400 shadow-[0_0_22px_rgba(59,130,246,0.6)]" />
            </span>

            <span className="font-extrabold tracking-tight truncate">
              Saviour
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = activeHref === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNav}
                  className={
                    'px-3 py-2 rounded-xl text-sm font-semibold transition border ' +
                    (isActive
                      ? 'bg-blue-500/20 border-blue-400/30 text-blue-100'
                      : 'bg-transparent border-transparent text-white/70 hover:text-white hover:border-white/10 hover:bg-white/5')
                  }
                >
                  {item.label}
                </Link>
              );
            })}

            {isAuthenticated && (
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-2 rounded-xl text-sm font-semibold transition border border-transparent text-white/70 hover:text-white hover:border-white/10 hover:bg-white/5"
                aria-label="Logout"
              >
                <User size={18} />
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="relative block h-5 w-5">
              <span
                className={
                  'absolute left-0 top-1 h-0.5 w-5 bg-white transition ' +
                  (open ? 'rotate-45 translate-y-1.5' : '')
                }
              />
              <span
                className={
                  'absolute left-0 top-2.5 h-0.5 w-5 bg-white/90 transition ' +
                  (open ? 'opacity-0' : '')
                }
              />
              <span
                className={
                  'absolute left-0 top-4 h-0.5 w-5 bg-white transition ' +
                  (open ? '-rotate-45 -translate-y-1.5' : '')
                }
              />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div
        className={
          'md:hidden overflow-hidden transition-all duration-300 ' +
          (open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0')
        }
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-3">
          <div className="glass-panel px-3 py-3 border border-white/10">
            <div className="grid gap-2">
              {navItems.map((item) => {
                const isActive = activeHref === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNav}
                    className={
                      'px-3 py-3 rounded-xl text-sm font-semibold transition border ' +
                      (isActive
                        ? 'bg-blue-500/20 border-blue-400/30 text-blue-100'
                        : 'bg-transparent border-white/10 text-white/80 hover:text-white hover:border-white/20 hover:bg-white/5')
                    }
                  >
                    {item.label}
                  </Link>
                );
              })}

              {isAuthenticated && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full px-3 py-3 rounded-xl text-sm font-semibold transition border border-white/10 text-white/80 hover:text-white hover:border-white/20 hover:bg-white/5 flex justify-center"
                >
                  <User size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}