import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search as SearchIcon, Sparkles, FileText, ArrowRight, Loader2, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { ragSearch } from '../services/api';

export function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    setError('');
    
    try {
      const response = await ragSearch(query, 0.3, 10); // Lower threshold for better results
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

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25 mb-4">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Smart Search</h1>
        <p className="text-gray-500 max-w-md mx-auto">
          Use AI-powered semantic search to find relevant content across all your course materials
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything about your course materials..."
            className="w-full pl-14 pr-32 py-5 text-lg border-2 border-gray-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 focus:outline-none transition-all shadow-sm"
          />
          <Button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                Search
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Search Suggestions */}
      {!searched && (
        <div className="flex flex-wrap justify-center gap-2">
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
              className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Error Message */}
      {error && searched && !loading && (
        <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results */}
      {searched && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {loading ? 'Searching...' : `${results.length} result${results.length !== 1 ? 's' : ''} found`}
            </h2>
            {results.length > 0 && !loading && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <TrendingUp className="w-4 h-4" />
                <span>Sorted by relevance</span>
              </div>
            )}
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent>
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-3" />
                    <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-4">
              {results.map((result, idx) => (
                <Link key={idx} to={`/materials/${result.material_id}`}>
                  <Card hover className="cursor-pointer transition-all hover:shadow-md">
                    <CardContent>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-5 h-5 text-indigo-500" />
                            <h3 className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors">
                              {result.material_title}
                            </h3>
                            <span
                              className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                result.material_category === 'Theory'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {result.material_category}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed">
                            {result.chunk_text}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="flex items-baseline gap-1">
                            <div className="text-2xl font-bold text-indigo-600">
                              {Math.round(result.similarity * 100)}
                            </div>
                            <div className="text-sm text-gray-500">%</div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">match</div>
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
