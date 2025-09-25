import React from 'react';
import { useState } from 'react';
import { Search, FileText } from 'lucide-react';
import { Input } from './ui/input';
import { Avatar, AvatarFallback } from './ui/avatar';
import { NotificationPanel } from './NotificationPanel';
import { SearchDialog } from './SearchDialog';
import { UserProfileDialog } from './UserProfileDialog';
import { Document } from '../hooks/useAppState';
import { UserData } from './LoginDialog';
import { useTranslation } from '../i18n/i18n';

interface TopBarProps {
  documents: Document[];
  onViewSummary: (documentId: string) => void;
  onViewAllSummaries?: () => void;
  userData: UserData | null;
  onUpdateProfile: (userData: UserData) => void;
  onLogout: () => void;
}

export function TopBar({ 
  documents, 
  onViewSummary, 
  onViewAllSummaries, 
  userData,
  onUpdateProfile,
  onLogout 
}: TopBarProps) {
  const { t } = useTranslation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchClick = () => {
    setIsSearchOpen(true);
  };

  const handleProfileClick = () => {
    setIsProfileOpen(true);
  };

  const handleSearchDocument = (documentId: string) => {
    onViewSummary(documentId);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <>
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {t('brand.name')}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('brand.tagline')}</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
              <Input
                type="text"
                placeholder={t('summaries.search.placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={handleSearchClick}
                onClick={handleSearchClick}
                className="pl-10 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 border-0 focus:bg-white dark:focus:bg-gray-700 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 cursor-pointer"
                readOnly
              />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <NotificationPanel 
              documents={documents} 
              onViewSummary={onViewSummary} 
              onViewAllSummaries={onViewAllSummaries}
            />

            {/* User Profile */}
            <div className="flex items-center space-x-3 pl-4 border-l border-gray-200 dark:border-gray-700">
              <div className="text-right">
                <p className="font-medium text-gray-900 dark:text-white">{userData?.username || 'User'}</p>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{userData?.role || 'Premium User'}</p>
                </div>
              </div>
              <Avatar 
                className="w-10 h-10 ring-2 ring-gradient-to-r from-blue-200 to-purple-200 shadow-lg cursor-pointer hover:ring-blue-300 transition-all"
                onClick={handleProfileClick}
              >
                <AvatarFallback className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white font-semibold">
                  {getInitials(userData?.username || 'User')}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      {/* Search Dialog */}
      <SearchDialog
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        documents={documents}
        onSelectDocument={handleSearchDocument}
      />

      {/* User Profile Dialog */}
      {userData && (
        <UserProfileDialog
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          userData={userData}
          onUpdateProfile={onUpdateProfile}
          onLogout={onLogout}
        />
      )}
    </>
  );
}