import { useState } from 'react';
import { Bell, FileText, Clock, TrendingUp, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Document } from '../hooks/useAppState';

interface NotificationPanelProps {
  documents: Document[];
  onViewSummary: (documentId: string) => void;
  onViewAllSummaries?: () => void;
}

export function NotificationPanel({ documents, onViewSummary, onViewAllSummaries }: NotificationPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Get recently completed documents (last 24 hours)
  const recentSummaries = documents
    .filter(doc => doc.status === 'completed' && doc.summary)
    .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
    .slice(0, 5); // Show last 5 recent summaries

  const unreadCount = recentSummaries.filter(doc => {
    const uploadTime = new Date(doc.uploadDate).getTime();
    const now = Date.now();
    return now - uploadTime < 3600000; // Less than 1 hour ago
  }).length;

  const formatTimeAgo = (date: string) => {
    const now = Date.now();
    const uploaded = new Date(date).getTime();
    const diffInMinutes = Math.floor((now - uploaded) / 60000);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleViewSummary = (docId: string) => {
    onViewSummary(docId);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-200"
        >
          <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-gradient-to-r from-red-500 to-pink-500 border-white"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" side="bottom">
        <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Recent Summaries</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            {recentSummaries.length} document{recentSummaries.length !== 1 ? 's' : ''} processed recently
          </p>
        </div>

        <ScrollArea className="max-h-96 min-h-[200px] overflow-y-auto">{/* Enhanced scrollability */}
          {recentSummaries.length === 0 ? (
            <div className="p-6 text-center">
              <FileText className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No recent summaries</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Upload documents to get started</p>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {recentSummaries.map((doc, index) => (
                <Card 
                  key={doc.id}
                  className="cursor-pointer hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500 hover:border-l-purple-500 hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={() => handleViewSummary(doc.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {doc.name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                          {doc.summary?.title}
                        </p>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className="ml-2 shrink-0 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                      >
                        Done
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{doc.summary?.readingTime}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FileText className="w-3 h-3" />
                          <span>{doc.summary?.wordCount} words</span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {formatTimeAgo(doc.uploadDate)}
                      </span>
                    </div>

                    {doc.summary && (
                      <div className="mt-2">
                        <div className="flex items-center space-x-2 mb-1">
                          <TrendingUp className={`w-3 h-3 ${
                            doc.summary.sentiment === 'positive' ? 'text-green-500' :
                            doc.summary.sentiment === 'negative' ? 'text-red-500' : 'text-gray-500'
                          }`} />
                          <span className={`text-xs capitalize ${
                            doc.summary.sentiment === 'positive' ? 'text-green-600 dark:text-green-400' :
                            doc.summary.sentiment === 'negative' ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {doc.summary.sentiment} sentiment
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                          {doc.summary.keyPoints[0]}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        {recentSummaries.length > 0 && (
          <div className="p-3 border-t bg-gray-50 dark:bg-gray-700">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900"
              onClick={() => {
                setIsOpen(false);
                if (onViewAllSummaries) {
                  onViewAllSummaries();
                }
              }}
            >
              View All Summaries
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}