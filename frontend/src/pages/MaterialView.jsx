import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Download,
  ExternalLink,
  Calendar,
  Tag,
  BookOpen,
  FlaskConical,
  Copy,
  Check,
  Loader2,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { getMaterialById } from '../services/api';

export function MaterialView() {
  const { id } = useParams();
  const [material, setMaterial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchMaterial = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await getMaterialById(id);
        setMaterial(response.data);
      } catch (err) {
        setError('Failed to load material. It may not exist.');
        console.error('Error fetching material:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMaterial();
  }, [id]);

  const handleCopyContent = async () => {
    if (material?.content_text) {
      await navigator.clipboard.writeText(material.content_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
          <p className="text-gray-500">Loading material...</p>
        </div>
      </div>
    );
  }

  if (error || !material) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Material Not Found</h2>
        <p className="text-gray-500 mb-6">{error || 'The requested material could not be found.'}</p>
        <Link to="/">
          <Button icon={ArrowLeft}>Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const isTheory = material.category === 'Theory';
  const CategoryIcon = isTheory ? BookOpen : FlaskConical;
  const tags = material.metadata?.tags || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Back to Dashboard</span>
      </Link>

      {/* Header Card */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            <div
              className={`p-4 rounded-2xl ${
                isTheory ? 'bg-blue-100' : 'bg-emerald-100'
              }`}
            >
              <CategoryIcon
                className={`w-8 h-8 ${isTheory ? 'text-blue-600' : 'text-emerald-600'}`}
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    isTheory
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {material.category}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">{material.title}</h1>
              
              {/* Tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg"
                    >
                      <Tag className="w-3.5 h-3.5" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Meta Info */}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(material.created_at)}</span>
                </div>
                {material.metadata?.size && (
                  <span>
                    {(material.metadata.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <a
                href={material.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex"
              >
                <Button variant="outline" icon={ExternalLink}>
                  Open File
                </Button>
              </a>
              <a href={material.file_url} download className="inline-flex">
                <Button icon={Download}>Download</Button>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Preview */}
      {material.content_text && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Extracted Content</h2>
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
            <div className="bg-gray-50 rounded-xl p-6 max-h-[500px] overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono leading-relaxed">
                {material.content_text}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PDF Viewer */}
      {material.file_url && material.metadata?.mimetype === 'application/pdf' && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">PDF Preview</h2>
          </CardHeader>
          <CardContent className="p-0">
            <iframe
              src={`${material.file_url}#view=FitH`}
              className="w-full h-[600px] rounded-b-xl"
              title={material.title}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default MaterialView;
