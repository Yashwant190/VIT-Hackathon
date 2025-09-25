import React, { useState } from 'react';
import { TopBar } from './components/TopBar';
import { HorizontalTabs } from './components/HorizontalTabs';
import { UploadTab } from './components/UploadTab';
import { SummariesTab } from './components/SummariesTab';
import { AnalyticsTab } from './components/AnalyticsTab';
import { SettingsTab } from './components/SettingsTab';
import { NotificationToast } from './components/NotificationToast';
import { LoginDialog } from './components/LoginDialog';
import { useAppState } from './hooks/useAppState';

export default function App() {
  const [activeTab, setActiveTab] = useState('upload');
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const appState = useAppState();

  const handleViewSummary = (documentId: string) => {
    setSelectedDocumentId(documentId);
    setActiveTab('summaries');
  };

  const handleViewAllSummaries = () => {
    setSelectedDocumentId(null);
    setActiveTab('summaries');
  };

  // Show login dialog if not authenticated; LoginDialog will handle reset-password dialog when needed
  if (!appState.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
        <LoginDialog 
          isOpen={true} 
          onLogin={appState.login}
        />
      </div>
    );
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'upload':
        return <UploadTab 
          {...appState} 
          onViewSummary={handleViewSummary} 
          autoProcessing={appState.autoProcessing}
          processDocument={appState.processDocument}
        />;
      case 'summaries':
        return <SummariesTab 
          {...appState} 
          selectedDocumentId={selectedDocumentId} 
          onClearSelection={() => setSelectedDocumentId(null)}
          generateDocumentContent={appState.generateDocumentContent}
        />;
      case 'analytics':
        return <AnalyticsTab {...appState} />;
      case 'settings':
        return <SettingsTab 
          clearAllData={appState.clearAllData} 
          exportData={appState.exportData} 
          documents={appState.documents}
          darkMode={appState.darkMode}
          setDarkMode={appState.setDarkMode}
          userData={appState.userData}
          updateUserProfile={appState.updateUserProfile}
          autoProcessing={appState.autoProcessing}
          setAutoProcessing={appState.setAutoProcessing}
        />;
      default:
        return <UploadTab 
          {...appState} 
          onViewSummary={handleViewSummary}
          autoProcessing={appState.autoProcessing}
          processDocument={appState.processDocument}
        />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
      <TopBar 
        documents={appState.documents} 
        onViewSummary={handleViewSummary} 
        onViewAllSummaries={handleViewAllSummaries}
        userData={appState.userData}
        onUpdateProfile={appState.updateUserProfile}
        onLogout={appState.logout}
      />
      
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <HorizontalTabs 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
        />
      </div>
      
      <main className="p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {renderActiveTab()}
        </div>
      </main>

      <NotificationToast notifications={appState.notifications} />
    </div>
  );
}