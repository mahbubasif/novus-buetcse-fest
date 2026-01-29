import React, { useState } from 'react';
import { Search as SearchIcon, Sparkles, FileText, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';

export function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    
    // Simulate API call (replace with actual RAG search)
    setTimeout(() => {
      setResults([
        {
          id: 1,
          title: 'Introduction to Machine Learning',
          excerpt: 'Machine learning is a subset of artificial intelligence that focuses on building systems that learn from data...',
          relevance: 95,
          category: 'Theory',
        },
        {
          id: 2,
          title: 'Neural Networks Fundamentals',
          excerpt: 'Neural networks are computing systems inspired by biological neural networks that constitute animal brains...',
          relevance: 87,
          category: 'Theory',
        },
        {
          id: 3,
          title: 'Python ML Lab Exercise',
          excerpt: 'In this lab, we will implement a basic neural network from scratch using Python and NumPy...',
          relevance: 72,
          category: 'Lab',
        },
      ]);
      setLoading(false);
    }, 1500);
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
          {['What is machine learning?', 'Explain neural networks', 'Python data structures'].map(
            (suggestion) => (
              <button
                key={suggestion}
                onClick={() => setQuery(suggestion)}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                {suggestion}
              </button>
            )
          )}
        </div>
      )}

      {/* Results */}
      {searched && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {loading ? 'Searching...' : `${results.length} results found`}
            </h2>
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
          ) : (
            <div className="space-y-4">
              {results.map((result) => (
                <Card key={result.id} hover className="cursor-pointer">
                  <CardContent>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-5 h-5 text-indigo-500" />
                          <h3 className="font-semibold text-gray-900">{result.title}</h3>
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                              result.category === 'Theory'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {result.category}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm line-clamp-2">{result.excerpt}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-indigo-600">{result.relevance}%</div>
                        <div className="text-xs text-gray-500">relevance</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Search;
