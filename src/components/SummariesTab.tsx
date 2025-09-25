import React, { useState, useEffect, useRef } from 'react';
import { FileText, Eye, Download, Clock, TrendingUp, BookOpen, Tag, Brain, Search, Filter, ChevronDown, Target, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { KeywordSearchDialog } from './KeywordSearchDialog';
import type { Document as AppDocument } from '../hooks/useAppState';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useTranslation } from '../i18n/i18n';

interface SummariesTabProps {
  documents: AppDocument[];
  selectedDocumentId?: string | null;
  onClearSelection?: () => void;
  generateDocumentContent?: (summary: AppDocument['summary']) => string;
}

export function SummariesTab({ documents, selectedDocumentId, onClearSelection, generateDocumentContent }: SummariesTabProps) {
  const { t } = useTranslation();
  const [selectedDocument, setSelectedDocument] = useState<AppDocument | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [highlightedText, setHighlightedText] = useState<{text: string, start: number, end: number} | null>(null);
  const summaryContainerRefs = useRef<Record<string, HTMLElement | null>>({});
  const [exportingId, setExportingId] = useState<string | null>(null);

  const completedDocuments = documents.filter(doc => doc.status === 'completed' && doc.summary);

  // Auto-open dialog when selectedDocumentId is provided
  useEffect(() => {
    if (selectedDocumentId) {
      const foundDoc = completedDocuments.find(doc => doc.id === selectedDocumentId);
      if (foundDoc) {
        setSelectedDocument(foundDoc);
        setIsDialogOpen(true);
        // Add a small delay to ensure smooth transition
        setTimeout(() => {
          const element = window.document.getElementById(`document-${selectedDocumentId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    }
  }, [selectedDocumentId, completedDocuments]);

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedDocument(null);
    setHighlightedText(null);
    if (onClearSelection) {
      onClearSelection();
    }
  };

  const handleOpenSearchDialog = () => {
    setIsSearchDialogOpen(true);
  };

  const handleHighlightText = (text: string, startIndex: number, endIndex: number) => {
    setHighlightedText({ text, start: startIndex, end: endIndex });
    setIsSearchDialogOpen(false);
    
    // Scroll to highlighted text span inside the open dialog
    setTimeout(() => {
      const hit = window.document.getElementById('highlight-hit');
      if (hit) hit.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };
  
  const filteredDocuments = completedDocuments.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.summary?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.summary?.keyPoints.some(point => point.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterType === 'all' || 
      (filterType === 'positive' && doc.summary?.sentiment === 'positive') ||
      (filterType === 'negative' && doc.summary?.sentiment === 'negative') ||
      (filterType === 'neutral' && doc.summary?.sentiment === 'neutral');
    
    return matchesSearch && matchesFilter;
  });

  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
    } else if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'size') {
      return parseFloat(b.size) - parseFloat(a.size);
    }
    return 0;
  });

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'negative':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'neutral':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getDocumentTypeIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'txt':
        return '📋';
      default:
        return '📄';
    }
  };

  const renderHighlightedContent = (content: string) => {
    if (!highlightedText) return content;
    
    const beforeText = content.substring(0, highlightedText.start);
    const highlightText = content.substring(highlightedText.start, highlightedText.end);
    const afterText = content.substring(highlightedText.end);
    
    return (
      <>
        {beforeText}
        <span id="highlight-hit" className="bg-yellow-200 dark:bg-yellow-800 font-bold px-1 rounded">
          {highlightText}
        </span>
        {afterText}
      </>
    );
  };

  const handleExportPDF = async (doc: AppDocument) => {
    setExportingId(doc.id);
    const fileName = `${(doc.summary?.title || doc.name || 'summary').toString().replace(/[^a-z0-9\-_]+/gi, '_')}.pdf`;
    try {
      const el = window.document.getElementById(`summary-content-${doc.id}`);
      if (el) {
        // Try visual export first
        const canvas = await html2canvas(el as HTMLElement, { scale: 2, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png');

        const pdf = new jsPDF('p', 'pt', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = pageWidth / imgWidth;
        const pdfImgHeight = imgHeight * ratio;

        let heightLeft = pdfImgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pageWidth, pdfImgHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
          position = heightLeft - pdfImgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pageWidth, pdfImgHeight);
          heightLeft -= pageHeight;
        }

        pdf.save(fileName);
        setExportingId(null);
        return;
      }

      // Fallback to text-only export if element not found
      const pdf = new jsPDF('p', 'pt', 'a4');
      const margin = 40;
      const maxWidth = pdf.internal.pageSize.getWidth() - margin * 2;
      let y = margin;

      const addHeading = (text: string) => {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(16);
        pdf.text(text, margin, y);
        y += 20;
      };

      const addParagraph = (text: string) => {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(12);
        const lines = pdf.splitTextToSize(text, maxWidth);
        lines.forEach((line: string) => {
          if (y > pdf.internal.pageSize.getHeight() - margin) {
            pdf.addPage();
            y = margin;
          }
          pdf.text(line, margin, y);
          y += 16;
        });
        y += 4;
      };

      addHeading(doc.summary?.title || doc.name);
      addParagraph(`Words: ${doc.summary?.wordCount ?? ''} • Read Time: ${doc.summary?.readingTime ?? ''} • Sentiment: ${doc.summary?.sentiment ?? ''}`);
      addHeading('Key Points');
      (doc.summary?.keyPoints || []).forEach((kp, i) => addParagraph(`${i + 1}. ${kp}`));
      addHeading('Summary');
      addParagraph(doc.summary?.fullSummary || '');

      pdf.save(fileName);
    } catch (e) {
      console.error('Export PDF failed', e);
      try {
        // Last-resort text-only export to ensure a file downloads
        const pdf = new jsPDF('p', 'pt', 'a4');
        const margin = 40;
        const maxWidth = pdf.internal.pageSize.getWidth() - margin * 2;
        let y = margin;
        const lines = pdf.splitTextToSize((doc.summary?.fullSummary || '').toString(), maxWidth);
        lines.forEach((line: string) => {
          if (y > pdf.internal.pageSize.getHeight() - margin) {
            pdf.addPage();
            y = margin;
          }
          pdf.text(line, margin, y);
          y += 16;
        });
        pdf.save(fileName);
      } catch (e2) {
        console.error('Fallback export failed', e2);
      }
    } finally {
      setExportingId(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
              {t('summaries.header.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {t('summaries.header.subtitle')}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300">
              {completedDocuments.length} processed
            </Badge>
            {documents.filter(d => d.status === 'processing').length > 0 && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                {documents.filter(d => d.status === 'processing').length} processing
              </Badge>
            )}
            {selectedDocumentId && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 animate-pulse">
                Viewing: {completedDocuments.find(d => d.id === selectedDocumentId)?.name}
              </Badge>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="bg-gradient-to-r from-white to-emerald-50/30 dark:from-gray-800 dark:to-emerald-950/30 border-emerald-100 dark:border-emerald-800">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder={t('summaries.search.placeholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex space-x-2">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[140px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('summaries.filter.all')}</SelectItem>
                    <SelectItem value="positive">{t('summaries.filter.positive')}</SelectItem>
                    <SelectItem value="neutral">{t('summaries.filter.neutral')}</SelectItem>
                    <SelectItem value="negative">{t('summaries.filter.negative')}</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">{t('summaries.sort.date')}</SelectItem>
                    <SelectItem value="name">{t('summaries.sort.name')}</SelectItem>
                    <SelectItem value="size">{t('summaries.sort.size')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        {completedDocuments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="text-xl font-bold text-blue-600">
                      {completedDocuments.reduce((total, doc) => total + (doc.summary?.wordCount || 0), 0).toLocaleString()}
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300">{t('summaries.stats.totalWords')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="text-xl font-bold text-green-600">
                      {completedDocuments.reduce((total, doc) => {
                        const time = parseInt(doc.summary?.readingTime || '0');
                        return total + time;
                      }, 0)} min
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-300">{t('summaries.stats.readingTime')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-800">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  <div>
                    <div className="text-xl font-bold text-purple-600">
                      {Math.round((completedDocuments.filter(d => d.summary?.sentiment === 'positive').length / completedDocuments.length) * 100)}%
                    </div>
                    <p className="text-sm text-purple-700 dark:text-purple-300">{t('summaries.stats.positive')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 border-orange-200 dark:border-orange-800">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Brain className="w-5 h-5 text-orange-600" />
                  <div>
                    <div className="text-xl font-bold text-orange-600">
                      {completedDocuments.reduce((total, doc) => total + (doc.summary?.keyPoints.length || 0), 0)}
                    </div>
                    <p className="text-sm text-orange-700 dark:text-orange-300">{t('summaries.stats.keyPoints')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Documents Grid */}
        {completedDocuments.length === 0 ? (
          <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">{t('summaries.empty.title')}</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">{t('summaries.empty.subtitle')}</p>
              <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                {t('summaries.empty.upload')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sortedDocuments.map((doc, index) => (
              <Card
                key={doc.id}
                id={`document-${doc.id}`}
                className={`overflow-hidden hover:shadow-xl transition-all duration-300 border-l-4 cursor-pointer ${
                  selectedDocumentId === doc.id 
                    ? 'border-l-yellow-500 bg-gradient-to-r from-yellow-50 to-white dark:from-yellow-950 dark:to-gray-800 ring-2 ring-yellow-300 scale-[1.02]'
                    : index % 3 === 0 ? 'border-l-blue-500 bg-gradient-to-r from-blue-50/50 to-white dark:from-blue-950/50 dark:to-gray-800' :
                      index % 3 === 1 ? 'border-l-emerald-500 bg-gradient-to-r from-emerald-50/50 to-white dark:from-emerald-950/50 dark:to-gray-800' :
                      'border-l-purple-500 bg-gradient-to-r from-purple-50/50 to-white dark:from-purple-950/50 dark:to-gray-800'
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-lg">{getDocumentTypeIcon(doc.name)}</span>
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">{doc.summary?.title}</h3>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 truncate">{doc.name}</p>
                      <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                        <span>{doc.size}</span>
                        <span>•</span>
                        <span>{doc.summary?.wordCount.toLocaleString()} {t('summaries.card.words')}</span>
                        <span>•</span>
                        <span>{doc.summary?.readingTime} {t('summaries.card.read')}</span>
                      </div>
                    </div>
                    
                    <Badge className={getSentimentColor(doc.summary?.sentiment || 'neutral')}>
                      {doc.summary?.sentiment}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">{t('summaries.card.keyPoints')}</h4>
                      <ul className="space-y-1">
                        {doc.summary?.keyPoints.slice(0, 3).map((point, i) => (
                          <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start">
                            <span className="text-blue-500 mr-2 mt-1">•</span>
                            <span>{point}</span>
                          </li>
                        ))}
                        {(doc.summary?.keyPoints.length || 0) > 3 && (
                          <li className="text-sm text-gray-500 dark:text-gray-400 ml-4">
                            +{(doc.summary?.keyPoints.length || 0) - 3} {t('summaries.card.morePoints')}
                          </li>
                        )}
                      </ul>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {doc.summary?.categories.map((category, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          <Tag className="w-3 h-3 mr-1" />
                          {category}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(doc.uploadDate).toLocaleDateString()}
                      </span>
                      
                      <Dialog open={isDialogOpen && selectedDocument?.id === doc.id} onOpenChange={(open) => {
                        if (!open) {
                          handleCloseDialog();
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 shadow-lg shadow-blue-200"
                            onClick={() => {
                              setSelectedDocument(doc);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Summary
                          </Button>
                        </DialogTrigger>
                        
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">{getDocumentTypeIcon(doc.name)}</span>
                                <span>{doc.summary?.title}</span>
                              </div>
                              
                              {/* Search Tools */}
                              <div className="flex items-center space-x-2">
                                <Button
                                  onClick={handleOpenSearchDialog}
                                  size="sm"
                                  variant="outline"
                                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-none hover:from-purple-700 hover:to-pink-700"
                                >
                                  <Zap className="w-4 h-4 mr-1" />
                                  {t('summaries.dialog.aiSearch')}
                                  <Badge className="ml-1 bg-white/20 text-white text-xs">{t('summaries.dialog.new')}</Badge>
                                </Button>
                              </div>
                            </DialogTitle>
                            <DialogDescription>
                              {t('summaries.dialog.description')} {doc.name}
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                                <div className="text-center">
                                  <div className="font-bold text-gray-900 dark:text-white">{doc.summary?.wordCount.toLocaleString()}</div>
                                  <div className="text-sm text-gray-600 dark:text-gray-300">{t('summaries.card.words')}</div>
                                </div>
                                <div className="text-center">
                                  <div className="font-bold text-gray-900 dark:text-white">{doc.summary?.readingTime}</div>
                                  <div className="text-sm text-gray-600 dark:text-gray-300">{t('summaries.stats.readingTime')}</div>
                                </div>
                                <div className="text-center">
                                  <div className="font-bold text-gray-900 dark:text-white">{doc.summary?.keyPoints.length}</div>
                                  <div className="text-sm text-gray-600 dark:text-gray-300">{t('summaries.stats.keyPoints')}</div>
                                </div>
                                <div className="text-center">
                                  <Badge className={getSentimentColor(doc.summary?.sentiment || 'neutral')}>
                                    {doc.summary?.sentiment}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{t('summaries.dialog.fullSummary')}</h3>
                              <div
                                id={`summary-content-${doc.id}`}
                                className="text-gray-700 dark:text-gray-300 leading-relaxed"
                                ref={(node) => { summaryContainerRefs.current[doc.id] = node; }}
                              >
                                {highlightedText ? 
                                  renderHighlightedContent(doc.summary?.fullSummary || '') : 
                                  doc.summary?.fullSummary
                                }
                              </div>
                            </div>

                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{t('summaries.stats.keyPoints')}</h3>
                              <ul className="space-y-2">
                                {doc.summary?.keyPoints.map((point, i) => (
                                  <li key={i} className="flex items-start">
                                    <span className="text-blue-500 mr-3 mt-1">•</span>
                                    <span className="text-gray-700 dark:text-gray-300">{point}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{t('summaries.dialog.categories')}</h3>
                              <div className="flex flex-wrap gap-2">
                                {doc.summary?.categories.map((category, i) => (
                                  <Badge key={i} variant="outline" className="border-blue-200 text-blue-800 dark:border-blue-700 dark:text-blue-300">
                                    <Tag className="w-3 h-3 mr-1" />
                                    {category}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <div className="flex space-x-2 pt-4 border-t">
                              <Button variant="outline" className="flex-1" onClick={() => handleExportPDF(doc)} disabled={exportingId === doc.id}>
                                <Download className="w-4 h-4 mr-2" />
                                {exportingId === doc.id ? t('summaries.dialog.exporting') : t('summaries.dialog.export')}
                              </Button>
                              <Button variant="outline" className="flex-1">
                                {t('summaries.dialog.share')}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Keyword Search Dialog */}
      {selectedDocument && (
        <KeywordSearchDialog
          isOpen={isSearchDialogOpen}
          onClose={() => setIsSearchDialogOpen(false)}
          documentContent={selectedDocument.summary?.fullSummary || ''}
          documentTitle={selectedDocument.name}
          onHighlightText={handleHighlightText}
        />
      )}
    </>
  );
}