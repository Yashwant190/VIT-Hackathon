import React from 'react';
import { 
  Upload, 
  FileText, 
  BarChart3, 
  Settings, 
  ChevronLeft,
  ChevronRight 
} from 'lucide-react';
import { Button } from './ui/button';
import { useTranslation } from '../i18n/i18n';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const tabs = [
  { id: 'upload', label: 'tab.upload', icon: Upload },
  { id: 'summaries', label: 'tab.summaries', icon: FileText },
  { id: 'analytics', label: 'tab.analytics', icon: BarChart3 },
  { id: 'settings', label: 'tab.settings', icon: Settings },
];

export function Sidebar({ activeTab, setActiveTab, collapsed, setCollapsed }: SidebarProps) {
  const { t } = useTranslation();
  return (
    <div className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-30 transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="flex flex-col h-full">
        {/* Logo/Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-gray-900">{t('brand.name')}</h1>
                <p className="text-xs text-gray-500">{t('brand.tagline')}</p>
              </div>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 h-8 w-8"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 group relative ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-600 to-purple-600 rounded-r-full" />
                    )}
                    
                    <Icon className={`w-5 h-5 transition-colors ${
                      isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
                    }`} />
                    
                    {!collapsed && (
                      <span className="font-medium">{t(tab.label)}</span>
                    )}
                    
                    {isActive && !collapsed && (
                      <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="p-4 border-t border-gray-200">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-semibold">AI</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">AI-Powered</p>
                  <p className="text-xs text-gray-500">Smart Analysis</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}