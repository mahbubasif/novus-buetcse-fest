import React, { useState, useRef } from 'react';
import { X, Upload, FileText, AlertCircle, CheckCircle, Loader2, Sparkles } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { uploadMaterial } from '../services/api';
import { cn } from '../lib/utils';

const categoryOptions = [
  { value: 'Theory', label: 'Theory' },
  { value: 'Lab', label: 'Lab' },
];

const allowedTypes = [
  'application/pdf',
  'text/plain',
  'text/javascript',
  'text/x-python',
  'application/json',
  'text/markdown',
  'text/html',
  'text/css',
];

const allowedExtensions = [
  '.pdf', '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.c', '.cpp',
  '.h', '.hpp', '.txt', '.md', '.json', '.xml', '.html', '.css', '.sql', '.sh', '.yaml', '.yml'
];

export function UploadModal({ isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const resetForm = () => {
    setFile(null);
    setTitle('');
    setCategory('');
    setTags('');
    setError('');
    setSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateFile = (selectedFile) => {
    if (!selectedFile) return false;
    
    const extension = '.' + selectedFile.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      setError(`Invalid file type. Allowed: ${allowedExtensions.join(', ')}`);
      return false;
    }

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (selectedFile.size > maxSize) {
      setError('File size too large. Maximum allowed size is 50MB.');
      return false;
    }

    return true;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setError('');
    if (selectedFile && validateFile(selectedFile)) {
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError('');
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
        if (!title) {
          setTitle(droppedFile.name.replace(/\.[^/.]+$/, ''));
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a title.');
      return;
    }

    if (!category) {
      setError('Please select a category.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title.trim());
      formData.append('category', category);
      
      if (tags.trim()) {
        const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);
        formData.append('metadata', JSON.stringify({ tags: tagsArray }));
      }

      await uploadMaterial(formData);
      setSuccess(true);
      
      setTimeout(() => {
        onSuccess?.();
        handleClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload material. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg transform bg-card rounded-2xl shadow-2xl transition-all animate-fade-in border border-border">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-[#3B82F6]/20 to-[#60A5FA]/20">
                <Upload className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Upload Material</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Add a new course material</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* File Drop Zone */}
            <div
              className={cn(
                "relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
                dragActive && 'border-primary bg-primary/5',
                !dragActive && !file && 'border-input hover:border-muted-foreground/50',
                file && 'border-emerald-500 bg-emerald-500/5'
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                accept={allowedExtensions.join(',')}
                className="hidden"
              />
              
              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <FileText className="w-7 h-7 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="text-xs text-destructive hover:text-destructive/80 font-medium"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors">
                    <Upload className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Drop your file here, or <span className="text-primary">browse</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, code files, or text files (max 50MB)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Title Input */}
            <Input
              label="Title"
              placeholder="Enter material title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            {/* Category Select */}
            <div className="w-full">
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="">Select a category</option>
                {categoryOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Tags Input */}
            <Input
              label="Tags (optional)"
              placeholder="ai, machine-learning, intro (comma separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="flex items-center gap-2 p-3 text-sm text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-200">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>Material uploaded successfully!</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="gradient"
                loading={loading}
                disabled={!file || !title || !category}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Upload Material
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default UploadModal;
