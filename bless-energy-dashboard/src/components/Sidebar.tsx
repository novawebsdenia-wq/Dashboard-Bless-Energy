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
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-black dark:bg-black bg-white rounded-lg border border-gold/30"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-gold" />
        ) : (
          <Menu className="w-6 h-6 text-gold" />
        )}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white dark:bg-black border-r border-gray-200 dark:border-gold/20 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200 dark:border-gold/20">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Bless Energy Logo"
                width={40}
                height={40}
                className="rounded-lg"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Bless Energy</h1>
                <p className="text-xs text-gold">Dashboard</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-gold text-black font-semibold'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gold/20">
            <div className="text-xs text-gray-500 text-center">
              <p>Bless Energy Dashboard</p>
              <p className="text-gold/70">v1.0.0</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
