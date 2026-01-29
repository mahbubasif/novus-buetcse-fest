import React, { useState, useRef, useEffect } from 'react';
import {
  PenTool,
  Upload,
  FileImage,
  Loader2,
  CheckCircle,
  AlertCircle,
  Copy,
  Check,
  Download,
  Trash2,
  Eye,
  Clock,
  FileText,
  Sparkles,
  X,
  ChevronDown,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { digitizeNotes, analyzeNotes, getDigitizedHistory } from '../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';

const formatOptions = [
  { value: 'markdown', label: '📝 Markdown', description: 'Best for general notes with code' },
  { value: 'latex', label: '📐 LaTeX', description: 'Best for math-heavy content' },
  { value: 'plain', label: '📄 Plain Text', description: 'Simple text format' },
];

const subjectOptions = [
  { value: 'general', label: 'General' },
  { value: 'mathematics', label: 'Mathematics' },
  { value: 'physics', label: 'Physics' },
  { value: 'computer science', label: 'Computer Science' },
  { value: 'chemistry', label: 'Chemistry' },
  { value: 'biology', label: 'Biology' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'economics', label: 'Economics' },
];

export function NotesDigitizer() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [format, setFormat] = useState('markdown');
  const [subject, setSubject] = useState('general');
  const [preserveStructure, setPreserveStructure] = useState(true);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await getDigitizedHistory({ limit: 10 });
      setHistory(response.data || []);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file (JPEG, PNG, WebP, or GIF)');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
      setResult(null);
      setAnalysis(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file (JPEG, PNG, WebP, or GIF)');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
      setResult(null);
      setAnalysis(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setAnalyzing(true);
    setError('');
    try {
      const response = await analyzeNotes(selectedFile);
      if (response.success) {
        setAnalysis(response.data.analysis);
        // Auto-apply suggested settings
        if (response.data.analysis.suggestedFormat) {
          setFormat(response.data.analysis.suggestedFormat);
        }
        if (response.data.analysis.detectedSubject) {
          const matchedSubject = subjectOptions.find(
            (opt) => opt.label.toLowerCase() === response.data.analysis.detectedSubject.toLowerCase()
          );
          if (matchedSubject) {
            setSubject(matchedSubject.value);
          }
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to analyze image');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDigitize = async () => {
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await digitizeNotes(selectedFile, {
        format,
        subject,
        preserveStructure: preserveStructure.toString(),
      });

      if (response.success) {
        setResult(response.data);
        fetchHistory();
      } else {
        setError(response.error || 'Failed to digitize notes');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred during digitization');
      console.error('Digitization error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (result?.content) {
      await navigator.clipboard.writeText(result.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (result?.content) {
      const extension = format === 'latex' ? 'tex' : format === 'markdown' ? 'md' : 'txt';
      const blob = new Blob([result.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `digitized-notes.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setAnalysis(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/25 flex-shrink-0">
          <PenTool className="w-8 h-8 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Handwritten Notes Digitizer</h1>
          <p className="text-gray-500">
            Convert your handwritten class notes into clean, organized digital text using AI
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Upload Notes Image</h2>
              <p className="text-sm text-gray-500 mt-1">
                Upload a photo of your handwritten notes (JPEG, PNG, WebP, GIF - max 10MB)
              </p>
            </CardHeader>
            <CardContent>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {!selectedFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-teal-500 hover:bg-teal-50/50 transition-colors"
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports JPEG, PNG, WebP, GIF (max 10MB)
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-64 object-contain rounded-lg bg-gray-100"
                    />
                    <button
                      onClick={clearSelection}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FileImage className="w-4 h-4" />
                    <span className="truncate">{selectedFile.name}</span>
                    <span className="text-gray-400">
                      ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Options */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Output Options</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Output Format
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {formatOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setFormat(opt.value)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        format === opt.value
                          ? 'border-teal-500 bg-teal-50 text-teal-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-sm">{opt.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{opt.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject Context
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  {subjectOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Preserve Structure Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Preserve Original Structure</p>
                  <p className="text-xs text-gray-500">Keep the layout of your notes</p>
                </div>
                <button
                  onClick={() => setPreserveStructure(!preserveStructure)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    preserveStructure ? 'bg-teal-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      preserveStructure ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleAnalyze}
                  disabled={!selectedFile || analyzing || loading}
                  variant="secondary"
                  className="flex-1"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Analyze First
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleDigitize}
                  disabled={!selectedFile || loading}
                  className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Digitize Notes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Analysis Results */}
          {analysis && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <h3 className="text-md font-semibold text-blue-900">📊 Analysis Results</h3>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-blue-600 font-medium">Subject:</span>{' '}
                    {analysis.detectedSubject}
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium">Complexity:</span>{' '}
                    {analysis.complexity}
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium">Has Equations:</span>{' '}
                    {analysis.hasEquations ? '✅ Yes' : '❌ No'}
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium">Has Diagrams:</span>{' '}
                    {analysis.hasDiagrams ? '✅ Yes' : '❌ No'}
                  </div>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Suggested Format:</span>{' '}
                  <span className="bg-blue-200 px-2 py-0.5 rounded text-blue-800">
                    {analysis.suggestedFormat}
                  </span>
                </div>
                {analysis.keyTopics && analysis.keyTopics.length > 0 && (
                  <div>
                    <span className="text-blue-600 font-medium">Key Topics:</span>{' '}
                    {analysis.keyTopics.join(', ')}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Result Section */}
        <div className="space-y-4">
          <Card className="h-full">
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Digitized Output</h2>
                {result && (
                  <p className="text-sm text-gray-500 mt-1">
                    {result.characterCount.toLocaleString()} characters • {result.format} format
                  </p>
                )}
              </div>
              {result && (
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={handleCopy}>
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleDownload}>
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {!result ? (
                <div className="flex flex-col items-center justify-center h-64 text-center text-gray-500">
                  <FileText className="w-12 h-12 mb-4 text-gray-300" />
                  <p>Upload an image and click "Digitize Notes" to see the result</p>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none max-h-[500px] overflow-y-auto">
                  {format === 'markdown' ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[rehypeKatex]}
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
                      {result.content}
                    </ReactMarkdown>
                  ) : (
                    <pre className="whitespace-pre-wrap text-sm font-mono bg-gray-50 p-4 rounded-lg overflow-x-auto">
                      {result.content}
                    </pre>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* History Section */}
          <Card>
            <CardHeader
              className="cursor-pointer"
              onClick={() => setShowHistory(!showHistory)}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recent Digitizations</h2>
                <ChevronDown
                  className={`w-5 h-5 text-gray-500 transition-transform ${
                    showHistory ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </CardHeader>
            {showHistory && (
              <CardContent>
                {historyLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  </div>
                ) : history.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No history yet</p>
                ) : (
                  <div className="space-y-2">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
                              {item.original_filename}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span className="bg-gray-200 px-1.5 py-0.5 rounded">
                                {item.output_format}
                              </span>
                              <span>{item.character_count.toLocaleString()} chars</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {formatDate(item.created_at)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
