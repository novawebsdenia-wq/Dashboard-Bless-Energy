'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Users, Calculator, FileText, Mail, Receipt, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function GlobalSearch() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const router = useRouter();

    const toggleSearch = useCallback(() => {
        setIsOpen((prev) => !prev);
        setQuery('');
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                toggleSearch();
            }
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, toggleSearch]);

    const searchItems = [
        { label: 'Dashboard', href: '/', icon: ArrowRight, shortcut: 'D' },
        { label: 'Clientes', href: '/clientes', icon: Users, shortcut: 'C' },
        { label: 'Calculadora Solar', href: '/calculadora', icon: Calculator, shortcut: 'S' },
        { label: 'Formulario Web', href: '/formulario', icon: FileText, shortcut: 'F' },
        { label: 'Emails Recibidos', href: '/emails', icon: Mail, shortcut: 'E' },
        { label: 'Contabilidad', href: '/contabilidad', icon: Receipt, shortcut: 'A' },
    ];

    const filteredItems = searchItems.filter(item =>
        item.label.toLowerCase().includes(query.toLowerCase())
    );

    const handleNavigate = (href: string) => {
        router.push(href);
        setIsOpen(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4 sm:px-6">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={() => setIsOpen(false)}
            />

            {/* Search Content */}
            <div className="relative w-full max-w-2xl bg-white dark:bg-[#121212] border border-gray-200 dark:border-gold/20 rounded-3xl shadow-2xl shadow-black/50 overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-4 border-b border-gray-100 dark:border-gold/10 flex items-center gap-3">
                    <Search className="w-6 h-6 text-gold" />
                    <input
                        autoFocus
                        type="text"
                        placeholder="Escribe para buscar o navegar..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="flex-1 bg-transparent border-0 focus:ring-0 text-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600"
                    />
                    <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-[10px] font-black uppercase text-gray-400">
                        Esc
                    </div>
                </div>

                <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {filteredItems.length > 0 ? (
                        <div className="space-y-2">
                            <p className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Páginas y Herramientas</p>
                            {filteredItems.map((item) => (
                                <button
                                    key={item.href}
                                    onClick={() => handleNavigate(item.href)}
                                    className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-gold/5 dark:hover:bg-gold/10 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <item.icon className="w-5 h-5 text-gray-400 group-hover:text-gold transition-colors" />
                                        </div>
                                        <span className="text-gray-700 dark:text-gray-300 font-bold group-hover:text-white transition-colors">{item.label}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">Ir a {item.label}</span>
                                        <item.icon className="w-4 h-4 text-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center text-gray-400">
                            No se encontraron resultados para &quot;<span className="text-white">{query}</span>&quot;
                        </div>
                    )}
                </div>

                <div className="p-4 bg-gray-50 dark:bg-white/[0.02] border-t border-gray-100 dark:border-gold/10 flex items-center justify-between">
                    <div className="flex gap-4">
                        <div className="flex items-center gap-1.5">
                            <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-white/10 text-[10px] font-black">↑↓</kbd>
                            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Navegar</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-white/10 text-[10px] font-black">Enter</kbd>
                            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Seleccionar</span>
                        </div>
                    </div>
                    <p className="text-[10px] text-gold/60 uppercase tracking-widest font-black">Bless Energy Intelligence</p>
                </div>
            </div>
        </div>
    );
}
