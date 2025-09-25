import React from 'react';
import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Search, FileText, Calendar, X } from 'lucide-react';

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  documents: any[];
  onSelectDocument: (documentId: string) => void;
}

export function SearchDialog({ isOpen, onClose, documents, onSelectDocument }: SearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const availableFilters = [
    { id: 'pdf', label: 'PDF', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
    { id: 'docx', label: 'DOCX', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
    { id: 'txt', label: 'TXT', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' },
    { id: 'processed', label: 'Processed', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
    { id: 'recent', label: 'Recent', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' }
  ];

  const filteredDocuments = useMemo(() => {
    let filtered = documents;

    // Apply text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(doc => 
        doc.name.toLowerCase().includes(query) ||
        doc.summary?.toLowerCase().includes(query) ||
        doc.keyPoints?.some((point: string) => point.toLowerCase().includes(query))
      );
    }

    // Apply filters
    if (selectedFilters.length > 0) {
      filtered = filtered.filter(doc => {
        const fileExtension = doc.name.split('.').pop()?.toLowerCase();
        const isRecent = new Date(doc.uploadedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        
        return selectedFilters.some(filter => {
          switch (filter) {
            case 'pdf':
            case 'docx':
            case 'txt':
              return fileExtension === filter;
            case 'processed':
              return doc.status === 'completed';
            case 'recent':
              return isRecent;
            default:
              return false;
          }
        });
      });
    }

    return filtered;
  }, [documents, searchQuery, selectedFilters]);

  const toggleFilter = (filterId: string) => {
    setSelectedFilters(prev => 
      prev.includes(filterId)
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    );
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSelectedFilters([]);
  };

  const handleSelectDocument = (documentId: string) => {
    onSelectDocument(documentId);
    onClose();
  };

  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-600" />
            Search Documents
          </DialogTitle>
          <DialogDescription>
            Search through your uploaded documents by name, content, or file type
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by filename, content, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {(searchQuery || selectedFilters.length > 0) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Filters */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Filters:</p>
            <div className="flex flex-wrap gap-2">
              {availableFilters.map(filter => (
                <Badge
                  key={filter.id}
                  variant={selectedFilters.includes(filter.id) ? "default" : "outline"}
                  className={`cursor-pointer transition-all hover:scale-105 ${
                    selectedFilters.includes(filter.id) ? filter.color : ''
                  }`}
                  onClick={() => toggleFilter(filter.id)}
                >
                  {filter.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Search Results */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''} found
              </p>
              {(searchQuery || selectedFilters.length > 0) && (
                <Button variant="ghost" size="sm" onClick={clearSearch}>
                  Clear All
                </Button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredDocuments.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                    <Search className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="font-medium text-lg mb-2">No documents found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery || selectedFilters.length > 0
                        ? 'Try adjusting your search query or filters'
                        : 'Upload some documents to get started'
                      }
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredDocuments.map(doc => (
                  <Card 
                    key={doc.id} 
                    className="cursor-pointer hover:shadow-md transition-all hover:border-blue-300 dark:hover:border-blue-700"
                    onClick={() => handleSelectDocument(doc.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">{doc.name}</h4>
                              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(doc.uploadedAt)}
                                </span>
                                <span>{typeof doc.size === 'string' ? doc.size : formatFileSize(doc.size)}</span>
                                <Badge 
                                  variant={doc.status === 'completed' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {doc.status === 'completed' ? 'Processed' : 'Processing'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          {doc.summary && typeof doc.summary === 'object' && (
                            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                              {doc.summary.fullSummary || doc.summary.title || 'Summary available'}
                            </p>
                          )}

                          {doc.summary && typeof doc.summary === 'object' && doc.summary.keyPoints && doc.summary.keyPoints.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {doc.summary.keyPoints.slice(0, 3).map((point: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {point.length > 30 ? `${point.substring(0, 30)}...` : point}
                                </Badge>
                              ))}
                              {doc.summary.keyPoints.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{doc.summary.keyPoints.length - 3} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}