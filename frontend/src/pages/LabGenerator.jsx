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
  Filter,
  Wand2,
  Zap,
  ArrowRight,
  Shield,
  AlertTriangle,
  Video,
  Download,
  Play,
  X,
  Youtube
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { ValidationResults } from '../components/ValidationResults';
import { generateMaterial, getGeneratedHistory, revalidateMaterial, generateVideoSummary, getYoutubeRecommendations } from '../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '../lib/utils';

const typeOptions = [
  { value: 'Theory', label: '📚 Theory (Lecture Notes)', icon: BookOpen },
  { value: 'Lab', label: '💻 Lab (Code Exercise)', icon: Code },
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
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [showValidation, setShowValidation] = useState(true);
  const [isRevalidating, setIsRevalidating] = useState(false);
  
  // Video generation states
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  
  // YouTube recommendations states
  const [youtubeLinks, setYoutubeLinks] = useState([]);
  const [loadingYoutube, setLoadingYoutube] = useState(false);
  
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
    setYoutubeLinks([]);
    setVideoUrl(null);

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

  const handleDownloadPDF = async () => {
    if (!generatedContent?.id) return;
    
    setDownloadingPDF(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/generate/${generatedContent.id}/pdf`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/pdf',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${generatedContent.topic?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'material'}_${generatedContent.type.toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('PDF download error:', err);
      setError('Failed to download PDF. Please try again.');
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleRevalidate = async () => {
    if (!generatedContent?.id) return;
    
    setIsRevalidating(true);
    setError('');
    
    try {
      const response = await revalidateMaterial(generatedContent.id);
      
      // Update the generated content with new validation results
      setGeneratedContent({
        ...generatedContent,
        is_validated: response.validation.overall?.passesValidation,
        validation: response.validation,
      });
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Re-validation error:', err);
      setError('Failed to re-validate content. Please try again.');
    } finally {
      setIsRevalidating(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!generatedContent?.id) return;
    
    setGeneratingVideo(true);
    setError('');
    
    try {
      console.log('Generating video for material ID:', generatedContent.id);
      
      const videoBlob = await generateVideoSummary(generatedContent.id);
      
      // Create object URL from blob
      const url = URL.createObjectURL(videoBlob);
      setVideoUrl(url);
      setShowVideoPlayer(true);
      
      console.log('Video generated successfully');
    } catch (err) {
      console.error('Video generation error:', err);
      setError('Failed to generate video summary. Please try again.');
    } finally {
      setGeneratingVideo(false);
    }
  };

  const handleCloseVideo = () => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
      setVideoUrl(null);
    }
    setShowVideoPlayer(false);
  };

  const handleDownloadVideo = () => {
    if (!videoUrl || !generatedContent) return;
    
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `${generatedContent.topic?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'material'}_video_summary.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleGetYoutubeRecommendations = async () => {
    if (!generatedContent?.id) return;
    
    setLoadingYoutube(true);
    setYoutubeLinks([]);
    
    try {
      const response = await getYoutubeRecommendations(generatedContent.id);
      if (response.success && response.data?.youtubeLinks) {
        setYoutubeLinks(response.data.youtubeLinks);
      }
    } catch (err) {
      console.error('YouTube recommendations error:', err);
      setError('Failed to get YouTube recommendations.');
    } finally {
      setLoadingYoutube(false);
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
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#3B82F6]/10 to-[#60A5FA]/5 p-8 border border-[#3B82F6]/20">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
        <div className="relative flex items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#60A5FA] flex items-center justify-center shadow-xl shadow-blue-500/30 flex-shrink-0">
            <Wand2 className="w-10 h-10 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="gap-1">
                <Zap className="w-3 h-3" />
                RAG + Wikipedia + AI
              </Badge>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">AI Material Generator</h1>
            <p className="text-muted-foreground max-w-lg">
              Generate comprehensive learning materials instantly. Our AI combines your existing materials with external knowledge to create rich educational content.
            </p>
          </div>
        </div>
      </div>

      {/* Generation Form */}
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Create New Material
          </CardTitle>
          <CardDescription>
            Enter a topic and select the type of material you want to generate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="space-y-6">
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
              <div className="w-full">
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Material Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  disabled={loading}
                >
                  {typeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="p-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                  <span className="text-destructive text-sm">{error}</span>
                </CardContent>
              </Card>
            )}

            {success && !loading && (
              <Card className="border-emerald-200 bg-emerald-50">
                <CardContent className="p-4 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span className="text-emerald-700 text-sm">Material generated successfully!</span>
                </CardContent>
              </Card>
            )}

            <Button
              type="submit"
              disabled={loading || !topic.trim()}
              variant={topic.trim() ? 'gradient' : 'secondary'}
              size="lg"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating... (This may take 10-20 seconds)
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Material
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Generated Content Display */}
      {generatedContent && (
        <Card className="border-none shadow-lg overflow-hidden">
          <div className={cn(
            "h-1.5 bg-gradient-to-r",
            generatedContent.type === 'Theory' ? 'from-[#3B82F6] to-[#60A5FA]' : 'from-emerald-500 to-emerald-600'
          )} />
          <CardHeader className="flex flex-row items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {generatedContent.type === 'Theory' ? (
                  <div className="p-2 rounded-lg bg-blue-100">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                ) : (
                  <div className="p-2 rounded-lg bg-emerald-100">
                    <Code className="w-5 h-5 text-emerald-600" />
                  </div>
                )}
                <Badge variant={generatedContent.type === 'Theory' ? 'default' : 'success'}>
                  {generatedContent.type}
                </Badge>
              </div>
              <h2 className="text-xl font-bold text-foreground">{generatedContent.topic}</h2>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Generated on {formatDate(generatedContent.created_at)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPDF}
                disabled={downloadingPDF}
                className="gap-1.5"
              >
                {downloadingPDF ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download PDF
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyContent}
                className="gap-1.5"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Sources Used */}
            <div className="mb-6 p-4 bg-muted/50 rounded-xl border border-border">
              <h3 className="text-sm font-semibold text-foreground mb-3">Sources Used:</h3>
              <div className="flex flex-wrap gap-2">
                {generatedContent.sources_used?.internal && (
                  <Badge variant="secondary" className="gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    Internal RAG Materials
                  </Badge>
                )}
                {generatedContent.sources_used?.external && (
                  <a
                    href={generatedContent.sources_used?.wikipedia_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Badge variant="secondary" className="gap-1.5 hover:bg-blue-100 transition-colors">
                      <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                      Wikipedia
                    </Badge>
                  </a>
                )}
              </div>
              
              {(!generatedContent.sources_used?.internal && !generatedContent.sources_used?.external) && (
                <p className="text-xs text-gray-500 italic">Generated from AI knowledge base</p>
              )}
            </div>

            {/* Validation Results Section */}
            {generatedContent.validation && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Content Validation</h3>
                    {generatedContent.is_validated ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                        ✓ Validated
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Needs Review
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setShowValidation(!showValidation)}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    {showValidation ? 'Hide' : 'Show'} Validation Details
                  </button>
                </div>

                {showValidation && (
                  <ValidationResults
                    validation={generatedContent.validation}
                    onRevalidate={handleRevalidate}
                    isRevalidating={isRevalidating}
                  />
                )}
              </div>
            )}

            {/* Rendered Content */}
            <div className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-code:text-foreground">
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

            {/* Video Generation Section */}
            <div className="mt-8 pt-6 border-t border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100">
                    <Video className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Video Summary</h3>
                    <p className="text-sm text-muted-foreground">Generate a quick 8-second visual summary</p>
                  </div>
                </div>
                <Button
                  onClick={handleGenerateVideo}
                  disabled={generatingVideo}
                  variant="outline"
                  className="gap-2 border-purple-200 hover:bg-purple-50 hover:border-purple-300"
                >
                  {generatingVideo ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating Video...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Generate Video Summary
                    </>
                  )}
                </Button>
              </div>

              {/* Video Player Modal */}
              {showVideoPlayer && videoUrl && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full overflow-hidden">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500 to-purple-600">
                      <div className="flex items-center gap-2 text-white">
                        <Video className="w-5 h-5" />
                        <h3 className="font-semibold">Video Summary</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={handleDownloadVideo}
                          variant="ghost"
                          size="sm"
                          className="text-white hover:bg-white/20"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={handleCloseVideo}
                          variant="ghost"
                          size="sm"
                          className="text-white hover:bg-white/20"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="p-6 bg-gray-50">
                      <video
                        controls
                        autoPlay
                        className="w-full rounded-lg shadow-lg"
                        src={videoUrl}
                      >
                        Your browser does not support the video tag.
                      </video>
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800">
                          <strong>💡 Tip:</strong> This is a quick 8-second visualization video showcasing the topic. 
                          Perfect for quick revision!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* YouTube Recommendations Section */}
              <div className="mt-6 pt-4 border-t border-border/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-100">
                      <Youtube className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">YouTube Recommendations</h3>
                      <p className="text-sm text-muted-foreground">Find related educational videos on YouTube</p>
                    </div>
                  </div>
                  <Button
                    onClick={handleGetYoutubeRecommendations}
                    disabled={loadingYoutube}
                    variant="outline"
                    className="gap-2 border-red-200 hover:bg-red-50 hover:border-red-300"
                  >
                    {loadingYoutube ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Finding Videos...
                      </>
                    ) : (
                      <>
                        <Youtube className="w-4 h-4" />
                        Get Recommendations
                      </>
                    )}
                  </Button>
                </div>

                {/* YouTube Links Display */}
                {youtubeLinks.length > 0 && (
                  <div className="space-y-3">
                    {youtubeLinks.map((link, index) => (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg border border-red-200 bg-red-50/50 hover:bg-red-100/50 transition-colors group"
                      >
                        <div className="p-2 rounded-lg bg-red-100 group-hover:bg-red-200 transition-colors">
                          <Youtube className="w-4 h-4 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{link.query}</p>
                          <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-red-600 transition-colors" />
                      </a>
                    ))}
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Click any link above to search YouTube for related videos
                    </p>
                  </div>
                )}
              </div>
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
