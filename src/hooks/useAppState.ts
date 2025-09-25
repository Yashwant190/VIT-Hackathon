import { useState, useCallback, useEffect } from 'react';
import { UserData } from '../components/LoginDialog';
import { useAuth } from './useAuth';
import { apiService, DocumentResponse, SummaryResponse, AnalyticsResponse } from '../lib/api';

export interface Document {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadDate: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  uploadedAt: string;
  summary?: {
    title: string;
    keyPoints: string[];
    wordCount: number;
    readingTime: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    categories: string[];
    fullSummary: string;
  };
}

export interface Analytics {
  totalDocuments: number;
  totalTimeSaved: number;
  averageProcessingTime: number;
  successRate: number;
  documentsToday: number;
  weeklyData: Array<{ date: string; documents: number; timeSaved: number }>;
  documentTypes: Array<{ type: string; count: number; color: string }>;
  processingTrends: Array<{ time: string; processed: number; failed: number }>;
}

const initialAnalytics: Analytics = {
  totalDocuments: 0,
  totalTimeSaved: 0,
  averageProcessingTime: 0,
  successRate: 100,
  documentsToday: 0,
  weeklyData: [
    { date: 'Mon', documents: 0, timeSaved: 0 },
    { date: 'Tue', documents: 0, timeSaved: 0 },
    { date: 'Wed', documents: 0, timeSaved: 0 },
    { date: 'Thu', documents: 0, timeSaved: 0 },
    { date: 'Fri', documents: 0, timeSaved: 0 },
    { date: 'Sat', documents: 0, timeSaved: 0 },
    { date: 'Sun', documents: 0, timeSaved: 0 },
  ],
  documentTypes: [],
  processingTrends: []
};

// Load initial data from localStorage
const loadFromStorage = () => {
  if (typeof window === 'undefined') return { 
    documents: [], 
    analytics: initialAnalytics, 
    darkMode: false, 
    userData: null,
    isAuthenticated: false,
    userDataStore: {}
  };
  
  try {
    const savedDarkMode = localStorage.getItem('documind-dark-mode');
    const savedUserData = localStorage.getItem('documind-user-data');
    const savedAuth = localStorage.getItem('documind-authenticated');
    const savedUserDataStore = localStorage.getItem('documind-user-data-store');
    
    // Get current user's documents and analytics
    let documents = [];
    let analytics = initialAnalytics;
    
    if (savedUserData && savedAuth) {
      const userData = JSON.parse(savedUserData);
      const userKey = `${userData.username}-${userData.email}`;
      const userDataStore = savedUserDataStore ? JSON.parse(savedUserDataStore) : {};
      
      if (userDataStore[userKey]) {
        documents = userDataStore[userKey].documents || [];
        analytics = userDataStore[userKey].analytics || initialAnalytics;
      }
    }
    
    return {
      documents,
      analytics,
      darkMode: savedDarkMode ? JSON.parse(savedDarkMode) : false,
      userData: savedUserData ? JSON.parse(savedUserData) : null,
      isAuthenticated: savedAuth ? JSON.parse(savedAuth) : false,
      userDataStore: savedUserDataStore ? JSON.parse(savedUserDataStore) : {}
    };
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return { 
      documents: [], 
      analytics: initialAnalytics, 
      darkMode: false, 
      userData: null,
      isAuthenticated: false,
      userDataStore: {}
    };
  }
};

export function useAppState() {
  const initialData = loadFromStorage();
  const [documents, setDocuments] = useState<Document[]>(initialData.documents);
  const [analytics, setAnalytics] = useState<Analytics>(initialData.analytics);
  const [darkMode, setDarkMode] = useState<boolean>(initialData.darkMode);
  const [isUploading, setIsUploading] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(initialData.userData);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(initialData.isAuthenticated);
  const [autoProcessing, setAutoProcessing] = useState<boolean>(true);
  const [userDataStore, setUserDataStore] = useState<Record<string, any>>(initialData.userDataStore);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
    timestamp: Date;
  }>>([]);

  // Generate mock summary data
  const generateSummary = (fileName: string): Document['summary'] => {
    // Extract the base name without extension for the title
    const baseName = fileName.split('.')[0];
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    
    // Generate title based on actual file name
    const formatTitle = (name: string) => {
      return name
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
        .replace(/\s+/g, ' ')
        .trim();
    };
    
    const title = formatTitle(baseName);
    
    // Generate contextual key points based on file name
    const generateKeyPoints = (fileName: string) => {
      const lowerName = fileName.toLowerCase();
      
      if (lowerName.includes('financial') || lowerName.includes('finance') || lowerName.includes('budget')) {
        return [
          "Revenue analysis shows positive growth trends",
          "Cost optimization opportunities identified", 
          "Cash flow projections remain strong",
          "Investment recommendations provided"
        ];
      } else if (lowerName.includes('market') || lowerName.includes('research') || lowerName.includes('analysis')) {
        return [
          "Market trends indicate shifting consumer preferences",
          "Competitive landscape analysis reveals opportunities",
          "Customer segmentation insights provided",
          "Strategic recommendations outlined"
        ];
      } else if (lowerName.includes('report') || lowerName.includes('summary') || lowerName.includes('overview')) {
        return [
          "Key performance indicators analyzed",
          "Implementation progress documented",
          "Risk assessment completed",
          "Next steps clearly defined"
        ];
      } else if (lowerName.includes('plan') || lowerName.includes('strategy') || lowerName.includes('roadmap')) {
        return [
          "Strategic objectives clearly defined",
          "Implementation timeline established",
          "Resource allocation optimized",
          "Success metrics identified"
        ];
      } else {
        return [
          "Document content thoroughly analyzed",
          "Key insights and patterns identified",
          "Important data points highlighted",
          "Actionable recommendations provided"
        ];
      }
    };
    
    const keyPoints = generateKeyPoints(fileName);
    
    // Generate word count based on file type
    const getWordCount = (extension: string | undefined) => {
      switch (extension) {
        case 'pdf': return Math.floor(Math.random() * 3000) + 1500;
        case 'doc':
        case 'docx': return Math.floor(Math.random() * 2500) + 1000;
        case 'txt': return Math.floor(Math.random() * 1500) + 500;
        default: return Math.floor(Math.random() * 2000) + 1000;
      }
    };
    
    const wordCount = getWordCount(fileExtension);
    const readingTime = `${Math.ceil(wordCount / 250)} min`;
    
    // Generate sentiment (mostly positive for demo)
    const sentiments: ('positive' | 'neutral' | 'negative')[] = ['positive', 'positive', 'neutral', 'positive'];
    const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
    
    // Generate categories based on file name
    const generateCategories = (fileName: string) => {
      const lowerName = fileName.toLowerCase();
      const categories: string[] = [];
      
      if (lowerName.includes('financial') || lowerName.includes('finance') || lowerName.includes('budget')) {
        categories.push('Finance', 'Analysis');
      } else if (lowerName.includes('market') || lowerName.includes('research')) {
        categories.push('Market Research', 'Analytics');
      } else if (lowerName.includes('strategy') || lowerName.includes('plan')) {
        categories.push('Strategy', 'Planning');
      } else if (lowerName.includes('report') || lowerName.includes('summary')) {
        categories.push('Report', 'Documentation');
      } else {
        categories.push('Document', 'Analysis');
      }
      
      // Add file type category
      if (fileExtension) {
        categories.push(fileExtension.toUpperCase());
      }
      
      return categories;
    };
    
    const categories = generateCategories(fileName);
    
    // Generate a coherent summary without demo placeholder text
    const intro = `"${title}" offers a concise overview of the document's main ideas and actionable insights.`;
    const kpSection = `Key findings include: ${keyPoints.map((kp, i) => `${i + 1}) ${kp}`).join('; ')}.`;
    const closing = `The analysis highlights themes relevant to planning and execution, emphasizing clarity, evidence, and practical recommendations.`;
    const fullSummary = `${intro}\n\n${kpSection}\n\n${closing}`;
    
    return {
      title,
      keyPoints,
      wordCount,
      readingTime,
      sentiment,
      categories,
      fullSummary
    };
  };

  // Generate detailed document content for search functionality
  const generateDocumentContent = (summary: Document['summary']): string => {
    const introText = `${summary?.title}\n\nExecutive Summary\n\n${summary?.fullSummary}\n\n`;
    
    const keyPointsText = `Key Findings\n\n${summary?.keyPoints.map((point, index) => 
      `${index + 1}. ${point}\n\nThis finding represents a significant development in our analysis. The data supporting this conclusion comes from comprehensive research and validated methodologies. Understanding these patterns helps inform strategic decision-making processes and future planning initiatives.`
    ).join('\n\n')}\n\n`;
    
    const detailedAnalysis = `Detailed Analysis\n\nThe comprehensive analysis reveals multiple layers of complexity within the subject matter. Market dynamics continue to evolve rapidly, requiring adaptive strategies and flexible implementation approaches. Consumer behavior patterns show interesting correlations with broader economic trends and technological adoption rates.\n\nMethodology and Data Collection\n\nOur research methodology employed both quantitative and qualitative analysis techniques. Primary data collection involved surveys, interviews, and focus groups across diverse demographic segments. Secondary research included industry reports, academic studies, and competitive intelligence gathering.\n\nStatistical analysis revealed significant correlations between various market factors. Regression analysis helped identify key drivers of consumer behavior and market performance. Time series analysis provided insights into trending patterns and seasonal variations.\n\nImplications and Recommendations\n\nBased on our findings, we recommend several strategic initiatives to capitalize on identified opportunities. Implementation should follow a phased approach, prioritizing high-impact, low-risk initiatives in the initial stages. Resource allocation should reflect strategic priorities while maintaining operational flexibility.\n\nRisk assessment indicates manageable exposure levels across all recommended initiatives. Mitigation strategies have been developed for identified risk factors. Contingency planning addresses potential market disruptions and competitive responses.\n\nConclusion\n\nThe analysis supports optimistic projections for future performance while acknowledging inherent market uncertainties. Strategic positioning recommendations align with organizational capabilities and market opportunities. Continued monitoring and adaptive management will ensure optimal outcomes.`;
    
    return introText + keyPointsText + detailedAnalysis;
  };

  // Authentication functions
  const login = useCallback((user: UserData) => {
    const userKey = `${user.username}-${user.email}`;
    
    // Check if user exists in store
    if (userDataStore[userKey]) {
      // Load existing user data
      setDocuments(userDataStore[userKey].documents || []);
      setAnalytics(userDataStore[userKey].analytics || initialAnalytics);
    } else {
      // New user - reset to empty state
      setDocuments([]);
      setAnalytics(initialAnalytics);
    }
    
    setUserData(user);
    setIsAuthenticated(true);
  }, [userDataStore]);

  const logout = useCallback(() => {
    // Save current user data before logout
    if (userData) {
      const userKey = `${userData.username}-${userData.email}`;
      const updatedStore = { ...userDataStore };
      updatedStore[userKey] = { documents, analytics };
      setUserDataStore(updatedStore);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('documind-user-data-store', JSON.stringify(updatedStore));
      }
    }
    
    setUserData(null);
    setIsAuthenticated(false);
    setDocuments([]);
    setAnalytics(initialAnalytics);
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('documind-user-data');
      localStorage.removeItem('documind-authenticated');
    }
  }, [userData, userDataStore, documents, analytics]);

  const updateUserProfile = useCallback((updatedUser: UserData) => {
    setUserData(updatedUser);
  }, []);

  // Simulate file upload with progress
  const uploadFiles = useCallback(async (files: FileList) => {
    setIsUploading(true);
    
    for (const file of Array.from(files)) {
      const docId = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newDoc: Document = {
        id: docId,
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        type: file.type || 'application/pdf',
        uploadDate: new Date().toISOString(),
        uploadedAt: new Date().toISOString(),
        status: 'uploading',
        progress: 0
      };

      setDocuments(prev => [...prev, newDoc]);

      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += Math.random() * 20) {
        const finalProgress = Math.min(100, progress);
        setDocuments(prev => prev.map(doc => 
          doc.id === docId ? { ...doc, progress: finalProgress } : doc
        ));
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Change to processing status
      setDocuments(prev => prev.map(doc => 
        doc.id === docId ? { ...doc, status: 'processing', progress: 100 } : doc
      ));

      // Auto-process if enabled
      if (autoProcessing) {
        // Simulate AI processing time
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

        // Complete processing with generated summary
        const summary = generateSummary(file.name);
        setDocuments(prev => prev.map(doc => 
          doc.id === docId ? { ...doc, status: 'completed', summary } : doc
        ));

        // Add success notification
        setNotifications(prev => [...prev, {
          id: `notif-${Date.now()}`,
          message: `Successfully processed "${file.name}"`,
          type: 'success',
          timestamp: new Date()
        }]);
      }
    }

    setIsUploading(false);
  }, [autoProcessing]);

  // Manual processing function
  const processDocument = useCallback(async (documentId: string) => {
    const doc = documents.find(d => d.id === documentId);
    if (!doc || doc.status === 'completed') return;

    setDocuments(prev => prev.map(d => 
      d.id === documentId ? { ...d, status: 'processing' } : d
    ));

    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

    // Complete processing with generated summary
    const summary = generateSummary(doc.name);
    setDocuments(prev => prev.map(d => 
      d.id === documentId ? { ...d, status: 'completed', summary } : d
    ));

    // Add success notification
    setNotifications(prev => [...prev, {
      id: `notif-${Date.now()}`,
      message: `Successfully processed "${doc.name}"`,
      type: 'success',
      timestamp: new Date()
    }]);
  }, [documents]);

  // Update analytics whenever documents change
  useEffect(() => {
    const completedDocs = documents.filter(doc => doc.status === 'completed');
    const today = new Date().toDateString();
    const docsToday = documents.filter(doc => 
      new Date(doc.uploadDate).toDateString() === today
    ).length;

    // Calculate time saved (estimated)
    const totalTimeSaved = completedDocs.reduce((total, doc) => {
      const readingTime = parseInt(doc.summary?.readingTime || '0');
      return total + readingTime * 0.7; // Assume 70% time savings
    }, 0);

    // Generate document types distribution
    const typeCount: Record<string, number> = {};
    completedDocs.forEach(doc => {
      const extension = doc.name.split('.').pop()?.toLowerCase() || 'unknown';
      typeCount[extension] = (typeCount[extension] || 0) + 1;
    });

    const documentTypes = Object.entries(typeCount).map(([type, count], index) => ({
      type: type.toUpperCase(),
      count,
      color: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'][index % 5]
    }));

    // Update weekly data (simplified)
    const weeklyData = analytics.weeklyData.map((day, index) => ({
      ...day,
      documents: index === 6 ? docsToday : day.documents, // Update today's data
      timeSaved: index === 6 ? totalTimeSaved : day.timeSaved
    }));

    setAnalytics(prev => ({
      ...prev,
      totalDocuments: documents.length,
      totalTimeSaved: Math.round(totalTimeSaved),
      averageProcessingTime: completedDocs.length > 0 ? 
        Math.round((completedDocs.length * 3.5 + Math.random() * 2) * 100) / 100 : 0,
      successRate: documents.length > 0 ? 
        Math.round((completedDocs.length / documents.length) * 100) : 100,
      documentsToday: docsToday,
      documentTypes,
      weeklyData,
      processingTrends: [
        { time: '00:00', processed: Math.floor(Math.random() * 5), failed: 0 },
        { time: '04:00', processed: Math.floor(Math.random() * 3), failed: 0 },
        { time: '08:00', processed: Math.floor(Math.random() * 12) + 5, failed: Math.floor(Math.random() * 2) },
        { time: '12:00', processed: Math.floor(Math.random() * 15) + 8, failed: Math.floor(Math.random() * 3) },
        { time: '16:00', processed: Math.floor(Math.random() * 18) + 10, failed: Math.floor(Math.random() * 2) },
        { time: '20:00', processed: Math.floor(Math.random() * 10) + 3, failed: Math.floor(Math.random() * 1) },
      ]
    }));
  }, [documents]);

  // Clear old notifications
  useEffect(() => {
    const interval = setInterval(() => {
      setNotifications(prev => prev.filter(notif => 
        Date.now() - notif.timestamp.getTime() < 10000 // Keep for 10 seconds
      ));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Save to localStorage whenever documents change
  useEffect(() => {
    if (typeof window !== 'undefined' && userData) {
      try {
        const userKey = `${userData.username}-${userData.email}`;
        const updatedStore = { ...userDataStore };
        updatedStore[userKey] = { documents, analytics };
        setUserDataStore(updatedStore);
        localStorage.setItem('documind-user-data-store', JSON.stringify(updatedStore));
      } catch (error) {
        console.error('Error saving documents to localStorage:', error);
      }
    }
  }, [documents, analytics, userData]);

  // Save to localStorage whenever analytics change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Analytics are now saved with documents in the userDataStore
        // This effect can be removed as it's redundant
      } catch (error) {
        console.error('Error saving analytics to localStorage:', error);
      }
    }
  }, [analytics]);

  // Save dark mode preference and apply to document
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('documind-dark-mode', JSON.stringify(darkMode));
        if (darkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (error) {
        console.error('Error saving dark mode to localStorage:', error);
      }
    }
  }, [darkMode]);

  // Apply dark mode on initial load
  useEffect(() => {
    if (typeof window !== 'undefined' && darkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Save user data to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        if (userData) {
          localStorage.setItem('documind-user-data', JSON.stringify(userData));
        }
        localStorage.setItem('documind-authenticated', JSON.stringify(isAuthenticated));
      } catch (error) {
        console.error('Error saving user data to localStorage:', error);
      }
    }
  }, [userData, isAuthenticated]);

  // Admin functions
  const clearAllData = useCallback(() => {
    setDocuments([]);
    setAnalytics(initialAnalytics);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('documind-documents');
      localStorage.removeItem('documind-analytics');
    }
    setNotifications(prev => [...prev, {
      id: `notif-${Date.now()}`,
      message: 'All data cleared successfully',
      type: 'info',
      timestamp: new Date()
    }]);
  }, []);

  const exportData = useCallback(() => {
    const data = {
      documents,
      analytics,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `documind-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [documents, analytics]);

  return {
    documents,
    analytics,
    darkMode,
    isUploading,
    notifications,
    userData,
    isAuthenticated,
    autoProcessing,
    uploadFiles,
    processDocument,
    setDocuments,
    setDarkMode,
    setAutoProcessing,
    login,
    logout,
    updateUserProfile,
    generateDocumentContent,
    clearAllData,
    exportData
  };
}