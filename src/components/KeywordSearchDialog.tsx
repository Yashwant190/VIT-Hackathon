import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Search, Target, Zap, ArrowRight, BookOpen } from 'lucide-react';

interface KeywordSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  documentContent: string;
  documentTitle: string;
  onHighlightText: (text: string, startIndex: number, endIndex: number) => void;
}

interface SearchResult {
  text: string;
  startIndex: number;
  endIndex: number;
  context: string;
  paragraph: string;
}

export function KeywordSearchDialog({ 
  isOpen, 
  onClose, 
  documentContent, 
  documentTitle,
  onHighlightText 
}: KeywordSearchDialogProps) {
  const [searchType, setSearchType] = useState<'keyword' | 'semantic'>('keyword');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<number | null>(null);

  const performKeywordSearch = (query: string): SearchResult[] => {
    if (!query.trim()) return [];

    const keywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 2);
    // Build paragraphs with accurate start offsets to avoid indexOf mismatches
    const paragraphs: { text: string; start: number; end: number }[] = [];
    const sepRegex = /\n\s*\n/g;
    let lastIndex = 0;
    for (const match of documentContent.matchAll(sepRegex)) {
      const end = match.index ?? 0;
      const text = documentContent.substring(lastIndex, end);
      if (text.length > 0) paragraphs.push({ text, start: lastIndex, end });
      lastIndex = (match.index ?? 0) + match[0].length;
    }
    if (lastIndex < documentContent.length) {
      paragraphs.push({ text: documentContent.substring(lastIndex), start: lastIndex, end: documentContent.length });
    }
    const results: SearchResult[] = [];

    paragraphs.forEach((para) => {
      const paragraph = para.text;
      const lowerParagraph = paragraph.toLowerCase();
      
      keywords.forEach(keyword => {
        let startIndex = 0;
        while (true) {
          const foundIndex = lowerParagraph.indexOf(keyword, startIndex);
          if (foundIndex === -1) break;

          const actualStartIndex = para.start + foundIndex;
          const actualEndIndex = actualStartIndex + keyword.length;
          
          // Get context around the keyword (50 chars before and after)
          const contextStart = Math.max(0, foundIndex - 50);
          const contextEnd = Math.min(paragraph.length, foundIndex + keyword.length + 50);
          const context = paragraph.substring(contextStart, contextEnd);

          results.push({
            text: keyword,
            startIndex: actualStartIndex,
            endIndex: actualEndIndex,
            context: contextStart > 0 ? '...' + context : context,
            paragraph: paragraph
          });

          startIndex = foundIndex + 1;
        }
      });
    });

    return results.sort((a, b) => a.startIndex - b.startIndex);
  };

  const performSemanticSearch = async (query: string): Promise<SearchResult[]> => {
    if (!query.trim()) return [];

    // Simulate semantic search with AI-like matching
    const paragraphs: { text: string; start: number; end: number }[] = [];
    const sepRegex = /\n\s*\n/g;
    let lastIndex = 0;
    for (const match of documentContent.matchAll(sepRegex)) {
      const end = match.index ?? 0;
      const text = documentContent.substring(lastIndex, end);
      if (text.length > 0) paragraphs.push({ text, start: lastIndex, end });
      lastIndex = (match.index ?? 0) + match[0].length;
    }
    if (lastIndex < documentContent.length) {
      paragraphs.push({ text: documentContent.substring(lastIndex), start: lastIndex, end: documentContent.length });
    }
    const results: SearchResult[] = [];
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simple semantic matching based on related terms and concepts
    const semanticTerms = extractSemanticTerms(query.toLowerCase());
    
    paragraphs.forEach((para) => {
      const paragraph = para.text;
      const lowerParagraph = paragraph.toLowerCase();
      // Tokenize with indices to accurately capture positions
      const wordRegex = /\b\w+\b/g;
      const tokens: { word: string; start: number; end: number }[] = [];
      let m: RegExpExecArray | null;
      while ((m = wordRegex.exec(lowerParagraph)) !== null) {
        tokens.push({ word: m[0], start: m.index, end: m.index + m[0].length });
      }
      
      let relevanceScore = 0;
      let matches: { start: number; end: number; term: string }[] = [];

      semanticTerms.forEach(term => {
        tokens.forEach(({ word, start, end }) => {
          if (word.includes(term) || term.includes(word)) {
            relevanceScore += calculateSimilarity(word, term);
            
            matches.push({ start, end, term: word });
          }
        });
      });

      if (relevanceScore > 0.3 && matches.length > 0) {
        // Find the best match in this paragraph
        const bestMatch = matches.reduce((best, current) => 
          current.term.length > best.term.length ? current : best
        );

        const actualStartIndex = para.start + bestMatch.start;
        const actualEndIndex = actualStartIndex + bestMatch.term.length;
        
        const contextStart = Math.max(0, bestMatch.start - 50);
        const contextEnd = Math.min(paragraph.length, bestMatch.end + 50);
        const context = paragraph.substring(contextStart, contextEnd);

        results.push({
          text: bestMatch.term,
          startIndex: actualStartIndex,
          endIndex: actualEndIndex,
          context: contextStart > 0 ? '...' + context : context,
          paragraph: paragraph
        });
      }
    });

    return results.sort((a, b) => b.paragraph.length - a.paragraph.length).slice(0, 10);
  };

  const extractSemanticTerms = (query: string): string[] => {
    // Simple semantic expansion - in real implementation, this would use NLP/AI
    const synonyms: Record<string, string[]> = {
      'important': ['significant', 'crucial', 'vital', 'key', 'essential', 'critical'],
      'problem': ['issue', 'challenge', 'difficulty', 'concern', 'trouble'],
      'solution': ['answer', 'resolution', 'fix', 'remedy', 'approach'],
      'analysis': ['examination', 'study', 'review', 'evaluation', 'assessment'],
      'result': ['outcome', 'finding', 'conclusion', 'output', 'effect'],
      'process': ['procedure', 'method', 'approach', 'workflow', 'system'],
      'data': ['information', 'statistics', 'numbers', 'facts', 'figures'],
      'performance': ['efficiency', 'effectiveness', 'productivity', 'results'],
      'strategy': ['plan', 'approach', 'method', 'tactic', 'framework'],
      'research': ['study', 'investigation', 'analysis', 'examination', 'inquiry']
    };

    const terms = query.split(/\s+/);
    const expandedTerms: string[] = [...terms];

    terms.forEach(term => {
      Object.entries(synonyms).forEach(([key, values]) => {
        if (term.includes(key) || key.includes(term)) {
          expandedTerms.push(...values);
        }
      });
    });

    return [...new Set(expandedTerms)];
  };

  const calculateSimilarity = (word1: string, word2: string): number => {
    const longer = word1.length > word2.length ? word1 : word2;
    const shorter = word1.length > word2.length ? word2 : word1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  };

  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSelectedResult(null);

    try {
      let results: SearchResult[] = [];
      
      if (searchType === 'keyword') {
        results = performKeywordSearch(searchQuery);
      } else {
        results = await performSemanticSearch(searchQuery);
      }

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (result: SearchResult, index: number) => {
    setSelectedResult(index);
    onHighlightText(result.text, result.startIndex, result.endIndex);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Document Search - {documentTitle}
          </DialogTitle>
          <DialogDescription>
            Search within this document using keywords or AI-powered semantic search
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search Type Toggle */}
          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            <Button
              variant={searchType === 'keyword' ? 'default' : 'ghost'}
              onClick={() => setSearchType('keyword')}
              className="flex-1 flex items-center gap-2"
            >
              <Target className="w-4 h-4" />
              Keyword Search
            </Button>
            <Button
              variant={searchType === 'semantic' ? 'default' : 'ghost'}
              onClick={() => setSearchType('semantic')}
              className="flex-1 flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              style={searchType === 'semantic' ? {
                background: 'linear-gradient(to right, rgb(147, 51, 234), rgb(219, 39, 119))'
              } : {}}
            >
              <Zap className="w-4 h-4" />
              AI Semantic Search
              <Badge className="ml-1 bg-white/20 text-white text-xs">NEW</Badge>
            </Button>
          </div>

          {/* Search Description */}
          <Card className={`border-l-4 ${searchType === 'semantic' ? 'border-l-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950' : 'border-l-blue-500'}`}>
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                {searchType === 'semantic' ? (
                  <Zap className="w-5 h-5 text-purple-600 mt-0.5" />
                ) : (
                  <Target className="w-5 h-5 text-blue-600 mt-0.5" />
                )}
                <div>
                  <h4 className="font-semibold mb-1">
                    {searchType === 'semantic' ? 'AI-Powered Semantic Search' : 'Keyword Search'}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {searchType === 'semantic' 
                      ? 'Find content by meaning and context. Enter phrases, concepts, or describe what you\'re looking for, and our AI will find semantically related content.'
                      : 'Find exact keyword matches in the document. Enter specific words or phrases to locate them in the text.'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search Input */}
          <div className="space-y-2">
            <Label htmlFor="search-input">
              {searchType === 'semantic' ? 'Describe what you\'re looking for:' : 'Enter keywords:'}
            </Label>
            <div className="flex gap-2">
              <Input
                id="search-input"
                type="text"
                placeholder={searchType === 'semantic' 
                  ? 'e.g., "main findings about customer satisfaction" or "recommendations for improvement"'
                  : 'e.g., "revenue", "performance", "analysis"'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button 
                onClick={handleSearch} 
                disabled={isSearching || !searchQuery.trim()}
                className={searchType === 'semantic' 
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                  : ''
                }
              >
                {isSearching ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {searchType === 'semantic' ? 'Analyzing...' : 'Searching...'}
                  </div>
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">
                  {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                </h4>
                <Badge variant="outline">
                  {searchType === 'semantic' ? 'AI Semantic' : 'Keyword'} Search
                </Badge>
              </div>
              
              <div className="max-h-60 overflow-y-auto space-y-2">
                {searchResults.map((result, index) => (
                  <Card 
                    key={index}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedResult === index 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => handleResultClick(result, index)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <Badge variant="secondary" className="mt-1 text-xs">
                          #{index + 1}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            {result.context.split(result.text).map((part, i) => (
                              <span key={i}>
                                {part}
                                {i < result.context.split(result.text).length - 1 && (
                                  <span className="bg-yellow-200 dark:bg-yellow-800 font-bold px-1 rounded">
                                    {result.text}
                                  </span>
                                )}
                              </span>
                            ))}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <ArrowRight className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              Click to scroll to this location
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {searchResults.length === 0 && searchQuery && !isSearching && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <Search className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg mb-2">No results found</h3>
                <p className="text-muted-foreground">
                  {searchType === 'semantic' 
                    ? 'Try rephrasing your search or using different concepts'
                    : 'Try different keywords or check your spelling'
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}