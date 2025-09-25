import React from 'react';
import { 
  Upload, 
  FileText, 
  BarChart3, 
  Settings 
} from 'lucide-react';
import { useTranslation } from '../i18n/i18n';

interface HorizontalTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const tabs = [
  { 
    id: 'upload', 
    label: 'tab.upload', 
    icon: Upload, 
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'from-blue-50 to-cyan-50',
    iconColor: 'text-blue-600'
  },
  { 
    id: 'summaries', 
    label: 'tab.summaries', 
    icon: FileText, 
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'from-emerald-50 to-teal-50',
    iconColor: 'text-emerald-600'
  },
  { 
    id: 'analytics', 
    label: 'tab.analytics', 
    icon: BarChart3, 
    color: 'from-purple-500 to-pink-500',
    bgColor: 'from-purple-50 to-pink-50',
    iconColor: 'text-purple-600'
  },
  { 
    id: 'settings', 
    label: 'tab.settings', 
    icon: Settings, 
    color: 'from-orange-500 to-red-500',
    bgColor: 'from-orange-50 to-red-50',
    iconColor: 'text-orange-600'
  },
];

export function HorizontalTabs({ activeTab, setActiveTab }: HorizontalTabsProps) {
  const { t } = useTranslation();
  return (
    <div className="px-6 py-4">
      <div className="max-w-7xl mx-auto">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-3 px-6 py-3 rounded-xl transition-all duration-300 group relative ${
                  isActive
                    ? `bg-gradient-to-r ${tab.bgColor} dark:from-gray-700 dark:to-gray-600 shadow-lg shadow-gray-200 dark:shadow-gray-900 border border-gray-200 dark:border-gray-600`
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {isActive && (
                  <div className={`absolute inset-0 bg-gradient-to-r ${tab.color} opacity-10 rounded-xl`} />
                )}
                
                <div className={`relative z-10 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                  isActive 
                    ? `bg-gradient-to-r ${tab.color} shadow-lg`
                    : 'bg-gray-100 dark:bg-gray-600 group-hover:bg-gray-200 dark:group-hover:bg-gray-500'
                }`}>
                  <Icon className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-white' : tab.iconColor
                  }`} />
                </div>
                
                <span className={`relative z-10 font-semibold transition-colors ${
                  isActive ? tab.iconColor : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'
                }`}>
                  {t(tab.label)}
                </span>
                
                {isActive && (
                  <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-2 h-2 bg-gradient-to-r ${tab.color} rounded-full`} />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}