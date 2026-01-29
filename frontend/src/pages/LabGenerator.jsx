import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, 
  Sparkles, 
  BookOpen, 
  Code, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  Clock,
  Filter
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Input, Select } from '../components/ui/Input';
import { generateMaterial, getGeneratedHistory } from '../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const typeOptions = [
  { value: 'Theory', label: '📚 Theory (Lecture Notes)' },
  { value: 'Lab', label: '💻 Lab (Code Exercise)' },
];

const historyFilters = [
  { value: '', label: 'All Types' },
  { value: 'Theory', label: 'Theory Only' },
  { value: 'Lab', label: 'Lab Only' },
];

export function LabGenerator() {
  const [topic, setTopic] = useState('');
  const [type, setType] = useState('Theory');
  const [loading, setLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // History state
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [historyFilter]);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const params = historyFilter ? { type: historyFilter, limit: 20 } : { limit: 20 };
      const response = await getGeneratedHistory(params);
      setHistory(response.data || []);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    
    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);
    setGeneratedContent(null);

    try {
      const response = await generateMaterial(topic.trim(), type);
      
      if (response.success) {
        setGeneratedContent(response.data);
        setSuccess(true);
        setTopic('');
        fetchHistory(); // Refresh history
      } else {
        setError(response.error || 'Failed to generate material');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred while generating material');
      console.error('Generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyContent = async () => {
    if (generatedContent?.content) {
      await navigator.clipboard.writeText(generatedContent.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/25 flex-shrink-0">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">AI Material Generator</h1>
          <p className="text-gray-500">
            Generate comprehensive learning materials powered by RAG + Wikipedia + OpenAI
          </p>
        </div>
      </div>

      {/* Generation Form */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Create New Material</h2>
          <p className="text-sm text-gray-500 mt-1">
            Enter a topic and select the type of material you want to generate
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="Topic"
                  placeholder="e.g., Binary Search Trees, React Hooks, Database Normalization"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              <div>
                <Select
                  label="Material Type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  options={typeOptions}
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && !loading && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>Material generated successfully!</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !topic.trim()}
              icon={loading ? Loader2 : Sparkles}
              className={`w-full ${loading ? 'animate-pulse' : ''}`}
            >
              {loading ? 'Generating... (This may take 10-20 seconds)' : 'Generate Material'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Generated Content Display */}
      {generatedContent && (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {generatedContent.type === 'Theory' ? (
                  <BookOpen className="w-5 h-5 text-blue-600" />
                ) : (
                  <Code className="w-5 h-5 text-emerald-600" />
                )}
                <span
                  className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                    generatedContent.type === 'Theory'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {generatedContent.type}
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">{generatedContent.topic}</h2>
              <p className="text-sm text-gray-500 mt-1">
                Generated on {formatDate(generatedContent.created_at)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              icon={copied ? Check : Copy}
              onClick={handleCopyContent}
            >
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </CardHeader>
          <CardContent>
            {/* Sources Used */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Sources Used:</h3>
              <div className="flex flex-wrap gap-2">
                {generatedContent.sources_used?.internal && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-md text-xs font-medium">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Internal RAG Materials
                  </span>
                )}
                {generatedContent.sources_used?.external && (
                  <a
                    href={generatedContent.sources_used?.wikipedia_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium hover:bg-blue-200 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Wikipedia
                  </a>
                )}
              </div>
            </div>

            {/* Rendered Content */}
            <div className="prose prose-sm max-w-none">
              {generatedContent.type === 'Theory' ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={vscDarkPlus}
                          language={match[1]}
                          PreTag="div"
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {generatedContent.content}
                </ReactMarkdown>
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={vscDarkPlus}
                          language={match[1]}
                          PreTag="div"
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {generatedContent.content}
                </ReactMarkdown>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* History Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Generation History</h2>
            <p className="text-sm text-gray-500 mt-1">View previously generated materials</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? 'Hide' : 'Show'} ({history.length})
          </Button>
        </CardHeader>
        
        {showHistory && (
          <CardContent>
            <div className="mb-4 flex items-center gap-3">
              <Filter className="w-4 h-4 text-gray-400" />
              <div className="flex gap-2">
                {historyFilters.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setHistoryFilter(filter.value)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      historyFilter === filter.value
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {historyLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FlaskConical className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No materials generated yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {item.type === 'Theory' ? (
                      <div className="p-2 rounded-lg bg-blue-100">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                      </div>
                    ) : (
                      <div className="p-2 rounded-lg bg-emerald-100">
                        <Code className="w-5 h-5 text-emerald-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-0.5 text-xs font-semibold rounded ${
                            item.type === 'Theory'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {item.type}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {formatDate(item.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {item.content_preview}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export default LabGenerator;
