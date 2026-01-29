import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Code, Eye, Trash2, Calendar, Tag, BookOpen, FlaskConical, ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardFooter } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

const categoryStyles = {
  Theory: {
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    border: 'border-violet-200',
    icon: 'text-violet-500',
    gradient: 'from-violet-500 to-purple-600',
    iconBg: 'bg-violet-100',
  },
  Lab: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: 'text-emerald-500',
    gradient: 'from-emerald-500 to-teal-600',
    iconBg: 'bg-emerald-100',
  },
};

export function MaterialCard({ material, onDelete, viewMode = 'grid' }) {
  const { id, title, category, file_url, metadata, created_at } = material;
  const styles = categoryStyles[category] || categoryStyles.Theory;
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getCategoryIcon = () => {
    if (category === 'Theory') {
      return <BookOpen className={cn("w-5 h-5", styles.icon)} />;
    }
    return <FlaskConical className={cn("w-5 h-5", styles.icon)} />;
  };

  const tags = metadata?.tags || [];

  if (viewMode === 'list') {
    return (
      <Card className="group overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className={cn("p-3 rounded-xl", styles.iconBg)}>
              {getCategoryIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                  {title}
                </h3>
                <Badge variant={category === 'Theory' ? 'default' : 'success'} className="shrink-0">
                  {category}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(created_at)}
                </span>
                {tags.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" />
                    {tags.length} tags
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to={`/materials/${id}`}>
                <Button variant="default" size="sm" className="gap-1.5">
                  View
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => onDelete(id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300">
      {/* Header with gradient */}
      <div className={cn("h-1.5 bg-gradient-to-r", styles.gradient)} />
      
      <CardContent className="pt-5">
        {/* Icon & Category */}
        <div className="flex items-start justify-between mb-4">
          <div className={cn(
            "p-3 rounded-xl transition-transform duration-300 group-hover:scale-110",
            styles.iconBg
          )}>
            {getCategoryIcon()}
          </div>
          <Badge variant={category === 'Theory' ? 'default' : 'success'}>
            {category}
          </Badge>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </h3>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-muted-foreground bg-muted rounded-md"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-xs text-muted-foreground">+{tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Date */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(created_at)}</span>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-2 pt-0">
        <Link to={`/materials/${id}`} className="flex-1">
          <Button variant="default" size="sm" className="w-full gap-1.5 group/btn">
            <Eye className="w-4 h-4" />
            View Material
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
          </Button>
        </Link>
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default MaterialCard;
