import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search as SearchIcon, Sparkles, FileText, ArrowRight, Loader2, TrendingUp, AlertCircle, Zap, BookOpen, FlaskConical, Clock } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { ragSearch } from '../services/api';
import { cn } from '../lib/utils';

export function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [enhanceResults, setEnhanceResults] = useState(true);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    setError('');
    
    try {
      const response = await ragSearch(query, 0.3, 10, enhanceResults);
      setResults(response.results || []);
      
      if (!response.results || response.results.length === 0) {
        setError('No results found. Try a different query or upload more materials.');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Search failed. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
  };

  const getRelevanceColor = (similarity) => {
    if (similarity >= 0.8) return 'text-emerald-500';
    if (similarity >= 0.6) return 'text-blue-500';
    if (similarity >= 0.4) return 'text-amber-500';
    return 'text-muted-foreground';
  };

  const getRelevanceBg = (similarity) => {
    if (similarity >= 0.8) return 'bg-emerald-50 border-emerald-200';
    if (similarity >= 0.6) return 'bg-blue-50 border-blue-200';
    if (similarity >= 0.4) return 'bg-amber-50 border-amber-200';
    return 'bg-muted/50 border-muted';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero Header */}
      <div className="relative text-center py-8">
        <div className="absolute inset-0 bg-gradient-to-r from-[#3B82F6]/5 to-[#60A5FA]/5 rounded-3xl" />
        <div className="relative">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#60A5FA] shadow-xl shadow-blue-500/30 mb-6">
            <Zap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-3 tracking-tight">
            Smart Search
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto text-lg">
            Use AI-powered semantic search to discover insights across all your course materials instantly
          </p>
        </div>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="relative">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] rounded-2xl blur-lg opacity-25 group-hover:opacity-40 transition-opacity" />
          <div className="relative bg-background rounded-2xl border-2 border-input focus-within:border-primary transition-all shadow-lg">
            <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything about your course materials..."
              className="w-full pl-14 pr-36 py-5 text-lg bg-transparent focus:outline-none placeholder:text-muted-foreground"
            />
            <Button
              type="submit"
              disabled={loading || !query.trim()}
              variant={query.trim() ? 'gradient' : 'secondary'}
              size="lg"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  Search
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Search Suggestions */}
      {!searched && (
        <div className="flex flex-wrap justify-center gap-2">
          <span className="text-sm text-muted-foreground mr-2">Try:</span>
          {[
            'What is AI?',
            'Explain algorithms',
            'Python programming',
            'Data structures',
            'Machine learning basics'
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-4 py-2 text-sm text-foreground bg-secondary hover:bg-secondary/80 rounded-full transition-all hover:scale-105"
            >
              <Sparkles className="w-3 h-3 inline mr-1.5 text-primary" />
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Error Message */}
      {error && searched && !loading && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-full bg-amber-100">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-amber-800">{error}</span>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {searched && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-foreground">
                {loading ? 'Searching...' : `${results.length} result${results.length !== 1 ? 's' : ''}`}
              </h2>
              {!loading && results.length > 0 && (
                <Badge variant="secondary" className="gap-1">
                  <Clock className="w-3 h-3" />
                  Instant
                </Badge>
              )}
            </div>
            {results.length > 0 && !loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="w-4 h-4" />
                <span>Sorted by relevance</span>
              </div>
            )}
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <Skeleton className="w-12 h-12 rounded-xl" />
                      <div className="flex-1 space-y-3">
                        <Skeleton className="h-5 w-1/2" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                      <Skeleton className="w-16 h-16 rounded-xl" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-4">
              {results.map((result, idx) => (
                <Link key={idx} to={`/materials/${result.material_id}`}>
                  <Card className="group cursor-pointer transition-all hover:shadow-lg hover:border-primary/30 overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex">
                        <div className="flex-1 p-6">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={cn(
                              "p-2 rounded-lg",
                              result.material_category === 'Theory' ? 'bg-blue-100' : 'bg-emerald-100'
                            )}>
                              {result.material_category === 'Theory' ? (
                                <BookOpen className={cn("w-5 h-5", result.material_category === 'Theory' ? 'text-blue-600' : 'text-emerald-600')} />
                              ) : (
                                <FlaskConical className="w-5 h-5 text-emerald-600" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                {result.material_title}
                              </h3>
                              <Badge variant={result.material_category === 'Theory' ? 'default' : 'success'} className="text-xs mt-1">
                                {result.material_category}
                              </Badge>
                            </div>
                          </div>
                          {result.ai_summary && (
                            <div className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-lg">
                              <div className="flex items-start gap-2">
                                <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-blue-900 leading-relaxed">
                                  {result.ai_summary}
                                </p>
                              </div>
                            </div>
                          )}
                          <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">
                            {result.chunk_text}
                          </p>
                        </div>
                        <div className={cn(
                          "w-28 flex flex-col items-center justify-center border-l",
                          getRelevanceBg(result.similarity)
                        )}>
                          <div className={cn("text-3xl font-bold", getRelevanceColor(result.similarity))}>
                            {Math.round(result.similarity * 100)}%
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">match</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default Search;
