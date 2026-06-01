'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItem = {
    href: string;
    label: string;
};

const navItems: NavItem[] = [
    { href: '/', label: 'Home' },
    { href: '/files', label: 'Files' },
    { href: '/text', label: 'Text' },
    { href: '/passwords', label: 'Passwords' },
    { href: '/login', label: 'Log In' },
    { href: '/signup', label: 'Sign Up' },
];

export default function Navbar() {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    const activeHref = useMemo(() => {
        // Mark parent routes as active too (e.g. /files/anything)
        const match = navItems
            .map((it) => it.href)
            .find((href) => {
                if (href === '/') return pathname === '/';
                return pathname === href || pathname.startsWith(`${href}/`);
            });

        return match ?? '/';
    }, [pathname]);

    const onNav = () => setOpen(false);

    return (
        <>
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

                        {/* Desktop links */}
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
                        </div>

                        {/* Mobile menu button */}
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

                {/* Mobile drawer */}
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
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        </>
    );
}

