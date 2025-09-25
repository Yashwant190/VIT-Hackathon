import React, { useState, useRef } from 'react';
import { Upload, FileText, Download, Clock, CheckCircle, AlertCircle, Loader2, Eye, Play, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Document } from '../hooks/useAppState';
import { useTranslation } from '../i18n/i18n';

interface UploadTabProps {
  documents: Document[];
  isUploading: boolean;
  uploadFiles: (files: FileList) => Promise<void>;
  onViewSummary: (documentId: string) => void;
  autoProcessing?: boolean;
  processDocument?: (documentId: string) => Promise<void>;
}

export function UploadTab({ 
  documents, 
  isUploading, 
  uploadFiles, 
  onViewSummary, 
  autoProcessing = true,
  processDocument 
}: UploadTabProps) {
  const { t } = useTranslation();
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await uploadFiles(files);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await uploadFiles(files);
    }
  };

  const handleManualProcess = async (documentId: string) => {
    if (processDocument) {
      await processDocument(documentId);
    }
  };

  const getStatusIcon = (status: Document['status']) => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: Document['status']) => {
    switch (status) {
      case 'uploading':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'processing':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const pendingDocuments = documents.filter(d => d.status === 'uploading' && d.progress === 100 && !autoProcessing);
  const recentUploads = documents.slice(-8).reverse();
  const pendingSummaries = documents.filter(d => 
    d.status === 'processing' || 
    (d.status === 'uploading' && d.progress < 100) || 
    (!autoProcessing && d.status === 'uploading' && d.progress === 100)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          {t('upload.header.title')}
        </h1>
        <div className="flex items-center justify-between">
          <p className="text-gray-600 dark:text-gray-300">{t('upload.header.subtitle')}</p>
          <div className="flex items-center space-x-2">
            <Settings className="w-4 h-4 text-gray-500" />
            <Badge variant={autoProcessing ? "default" : "secondary"} className="flex items-center space-x-1">
              {autoProcessing ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>{t('upload.autoProcessing')}</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>{t('upload.manualProcessing')}</span>
                </>
              )}
            </Badge>
          </div>
        </div>
      </div>

      {/* Processing Status Alert */}
      {!autoProcessing && pendingDocuments.length > 0 && (
        <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950 dark:to-yellow-950 border-orange-200 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <div>
                  <h4 className="font-medium text-orange-900 dark:text-orange-200">Documents Ready for Processing</h4>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    {pendingDocuments.length} document{pendingDocuments.length !== 1 ? 's' : ''} uploaded and waiting for manual processing
                  </p>
                </div>
              </div>
              <Button
                onClick={() => pendingDocuments.forEach(doc => handleManualProcess(doc.id))}
                className="bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700"
              >
                <Play className="w-4 h-4 mr-2" />
                Process All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{documents.length}</div>
            <p className="text-sm text-blue-700 dark:text-blue-300">{t('upload.stats.totalUploads')}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {documents.filter(d => d.status === 'completed').length}
            </div>
            <p className="text-sm text-green-700 dark:text-green-300">{t('upload.stats.processed')}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {documents.filter(d => d.status === 'processing').length}
            </div>
            <p className="text-sm text-purple-700 dark:text-purple-300">{t('upload.stats.processing')}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 border-orange-200 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {isUploading ? 'Active' : 'Ready'}
            </div>
            <p className="text-sm text-orange-700 dark:text-orange-300">{t('upload.stats.status')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Upload Card */}
      <Card className="overflow-hidden bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-800 dark:to-blue-950/30 border-blue-100 dark:border-blue-800 shadow-lg shadow-blue-100/50">
        <CardContent className="p-8">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragOver(false);
            }}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
              dragOver
                ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/50 scale-[1.02]'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <div className="space-y-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto transition-colors ${
                dragOver ? 'bg-blue-100 dark:bg-blue-900' : isUploading ? 'bg-purple-100 dark:bg-purple-900' : 'bg-gray-100 dark:bg-gray-800'
              }`}>
                {isUploading ? (
                  <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                ) : (
                  <Upload className={`w-8 h-8 transition-colors ${
                    dragOver ? 'text-blue-600' : 'text-gray-600 dark:text-gray-300'
                  }`} />
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {isUploading ? t('upload.processingDocuments') : t('upload.dropHere')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {isUploading ? t('upload.autoHint') : t('upload.orClickBrowse')}
                </p>
                
                {!isUploading && (
                  <Button 
                    onClick={handleFileUpload}
                    className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 shadow-lg shadow-blue-200"
                    disabled={isUploading}
                  >
                    {t('upload.chooseFiles')}
                  </Button>
                )}
              </div>
              
              <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                <p>{t('upload.supportedFormats')}</p>
                <p>{t('upload.maxFileSize')}</p>
                <p>
                  {autoProcessing ? t('upload.autoHint') : t('upload.manualHint')}
                </p>
              </div>
            </div>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt,.rtf"
            onChange={handleFileSelect}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Recent Uploads + Pending Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Recent Uploads (span 2) */}
        <div className="md:col-span-2">
          <Card className="bg-gradient-to-br from-white to-emerald-50/30 dark:from-gray-800 dark:to-emerald-950/30 border-emerald-100 dark:border-emerald-800 shadow-lg shadow-emerald-100/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {t('upload.recentUploads')}
                {recentUploads.length > 0 && (
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300">
                    {recentUploads.length} files
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {recentUploads.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>{t('upload.noUploads')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentUploads.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600 hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">{file.name}</p>
                          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                            <span>{file.size}</span>
                            <span>•</span>
                            <span>{new Date(file.uploadDate).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        {(file.status === 'uploading' || file.status === 'processing') && (
                          <div className="w-24">
                            <Progress value={file.progress} className="h-2" />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{file.progress}%</p>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(file.status)}
                          <Badge className={getStatusColor(file.status)}>
                            {file.status}
                          </Badge>
                        </div>
                        
                        {/* Manual Processing Button */}
                        {!autoProcessing && file.status === 'uploading' && file.progress === 100 && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-orange-600 hover:text-orange-800 border-orange-300 hover:border-orange-400"
                            onClick={() => handleManualProcess(file.id)}
                          >
                            <Play className="w-4 h-4 mr-1" />
                            {t('upload.process')}
                          </Button>
                        )}
                        
                        {file.status === 'completed' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-blue-600 hover:text-blue-800"
                            onClick={() => onViewSummary(file.id)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            {t('upload.viewSummary')}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Pending Summaries */}
        <div className="md:col-span-1">
          <Card className={`relative bg-gradient-to-b from-yellow-50 via-amber-50 to-orange-50 dark:from-yellow-950/40 dark:via-amber-950/30 dark:to-orange-950/20 border-yellow-300 dark:border-yellow-800 ${pendingSummaries.length > 0 ? 'ring-2 ring-yellow-400 shadow-xl shadow-yellow-200/70 animate-[pulse_2s_ease-in-out_infinite]' : ''} sticky top-24`}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {t('upload.pendingSummaries')}
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                  {pendingSummaries.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
              {pendingSummaries.length === 0 ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {t('upload.noPending')}
                </div>
              ) : (
                pendingSummaries.map(item => (
                  <div key={item.id} className="p-3 rounded-lg bg-white/90 dark:bg-gray-700/80 border border-yellow-200 dark:border-yellow-800 flex items-center justify-between backdrop-blur">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        {getStatusIcon(item.status)}
                        <span className="capitalize">{item.status}</span>
                      </div>
                    </div>
                    <div className="w-24">
                      <Progress value={item.progress} className="h-2" />
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">{item.progress}%</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}