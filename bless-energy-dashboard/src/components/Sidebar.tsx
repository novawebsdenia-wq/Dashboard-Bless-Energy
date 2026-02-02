'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Mail,
  Calculator,
  FileText,
  Users,
  Receipt,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/emails', label: 'Emails', icon: Mail },
  { href: '/calculadora', label: 'Calculadora Web', icon: Calculator },
  { href: '/formulario', label: 'Formulario Web', icon: FileText },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/contabilidad', label: 'Contabilidad', icon: Receipt },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white dark:bg-black rounded-xl border border-gold/30 shadow-lg shadow-gold/5 transition-transform active:scale-95"
      >
        {isOpen ? (
          <X className="w-5 h-5 text-gold" />
        ) : (
          <Menu className="w-5 h-5 text-gold" />
        )}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30 transition-opacity animate-in fade-in duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-white dark:bg-black border-r border-gray-200 dark:border-gold/20 transform transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
      >
        <div className="flex flex-col h-full bg-gradient-to-b from-transparent via-transparent to-gold/5 dark:to-gold/2">
          {/* Logo Section */}
          <div className="p-8 border-b border-gray-100 dark:border-gold/10">
            <Link href="/" className="flex items-center gap-4 group">
              <div className="relative w-12 h-12 rounded-2xl overflow-hidden p-1 bg-gradient-to-br from-gold to-gold-dark transition-transform duration-500 group-hover:rotate-[360deg]">
                <div className="w-full h-full bg-white dark:bg-black rounded-[0.6rem] overflow-hidden flex items-center justify-center">
                  <Image
                    src="/logo.png"
                    alt="Bless Energy Logo"
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                </div>
              </div>
              <div className="transition-transform duration-300 group-hover:translate-x-1">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                  Bless <span className="text-gold">Energy</span>
                </h1>
              </div>
            </Link>
          </div>

          {/* Navigation Section */}
          <nav className="flex-1 p-6 space-y-1.5 overflow-y-auto custom-scrollbar">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`group flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-300 relative ${isActive
                    ? 'text-black font-bold shadow-md shadow-gold/20'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                  {/* Active Background */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-gold to-gold-light rounded-2xl animate-in fade-in zoom-in-95 duration-300 shadow-inner shadow-white/20" />
                  )}

                  {/* Hover Background (for non-active) */}
                  {!isActive && (
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gray-100 dark:bg-white/5 rounded-2xl transition-opacity duration-300" />
                  )}

                  <Icon className={`w-5 h-5 relative z-10 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110 group-hover:-rotate-3'}`} />
                  <span className="relative z-10 text-sm tracking-wide">{item.label}</span>

                  {isActive && (
                    <div className="absolute right-4 w-1.5 h-1.5 bg-black rounded-full shadow-sm animate-pulse z-10" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer Section */}
          <div className="p-8 border-t border-gray-100 dark:border-gold/10">
            <div className="bg-gray-50 dark:bg-gold/5 rounded-2xl p-4 border border-gray-100 dark:border-gold/10">
              <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold tracking-widest text-center">
                System Version
              </p>
              <p className="text-sm text-gold font-bold text-center mt-1">
                v2.0.0 <span className="text-[10px] font-normal text-gray-400">Stable</span>
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
