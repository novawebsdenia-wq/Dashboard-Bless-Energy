'use client';

interface Tab {
  sheetId?: number;
  title?: string;
}

interface TabSelectorProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function TabSelector({ tabs, activeTab, onTabChange }: TabSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {tabs.map((tab) => (
        <button
          key={tab.title}
          onClick={() => onTabChange(tab.title || '')}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            activeTab === tab.title
              ? 'bg-gold text-black'
              : 'bg-gray-100 dark:bg-black/30 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gold/20 hover:border-gold/50 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          {tab.title}
        </button>
      ))}
    </div>
  );
}
