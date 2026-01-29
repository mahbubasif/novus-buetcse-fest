import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Code, Eye, Trash2, Calendar, Tag } from 'lucide-react';
import { Card, CardContent, CardFooter } from './ui/Card';
import { Button } from './ui/Button';

const categoryStyles = {
  Theory: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: 'text-blue-500',
    gradient: 'from-blue-500 to-indigo-600',
  },
  Lab: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: 'text-emerald-500',
    gradient: 'from-emerald-500 to-teal-600',
  },
};

export function MaterialCard({ material, onDelete }) {
  const { id, title, category, file_url, metadata, created_at } = material;
  const styles = categoryStyles[category] || categoryStyles.Theory;
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getFileIcon = () => {
    const mimetype = metadata?.mimetype || '';
    if (mimetype.includes('pdf')) {
      return <FileText className={`w-8 h-8 ${styles.icon}`} />;
    }
    return <Code className={`w-8 h-8 ${styles.icon}`} />;
  };

  const tags = metadata?.tags || [];

  return (
    <Card hover className="group overflow-hidden">
      {/* Header with gradient */}
      <div className={`h-2 bg-gradient-to-r ${styles.gradient}`} />
      
      <CardContent className="pt-5">
        {/* Icon & Category */}
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl ${styles.bg} ${styles.border} border`}>
            {getFileIcon()}
          </div>
          <span
            className={`px-3 py-1 text-xs font-semibold rounded-full ${styles.bg} ${styles.text} ${styles.border} border`}
          >
            {category}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
          {title}
        </h3>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-md"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-xs text-gray-500">+{tags.length - 3} more</span>
            )}
          </div>
        )}

        {/* Date */}
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(created_at)}</span>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-2">
        <Link to={`/materials/${id}`} className="flex-1">
          <Button variant="primary" size="sm" icon={Eye} className="w-full">
            View
          </Button>
        </Link>
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            icon={Trash2}
            className="text-gray-400 hover:text-red-600 hover:bg-red-50"
            onClick={() => onDelete(id)}
          />
        )}
      </CardFooter>
    </Card>
  );
}

export default MaterialCard;
