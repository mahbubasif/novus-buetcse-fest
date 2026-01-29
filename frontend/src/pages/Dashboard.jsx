import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  BookOpen,
  FlaskConical,
  FileText,
  RefreshCw,
  AlertCircle,
  Sparkles,
  TrendingUp,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import MaterialCard from '../components/MaterialCard';
import UploadModal from '../components/UploadModal';
import { getMaterials, deleteMaterial } from '../services/api';
import { useRole } from '../contexts/RoleContext';
import { cn } from '../lib/utils';

const categoryFilters = [
  { value: '', label: 'All', icon: FileText },
  { value: 'Theory', label: 'Theory', icon: BookOpen },
  { value: 'Lab', label: 'Lab', icon: FlaskConical },
];

export function Dashboard() {
  const { isAdmin } = useRole();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const fetchMaterials = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (categoryFilter) params.category = categoryFilter;
      if (searchQuery) params.search = searchQuery;
      
      const response = await getMaterials(params);
      setMaterials(response.data || []);
    } catch (err) {
      setError('Failed to load materials. Please try again.');
      console.error('Error fetching materials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [categoryFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchMaterials();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this material?')) return;
    
    try {
      await deleteMaterial(id);
      setMaterials(materials.filter((m) => m.id !== id));
    } catch (err) {
      alert('Failed to delete material. Please try again.');
    }
  };

  const handleUploadSuccess = () => {
    fetchMaterials();
  };

  const stats = {
    total: materials.length,
    theory: materials.filter((m) => m.category === 'Theory').length,
    lab: materials.filter((m) => m.category === 'Lab').length,
  };

  return (
    <div className="space-y-8">
      {/* Hero Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-purple-500/5 to-pink-500/10 p-8 border border-primary/10">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="w-3 h-3" />
                AI-Powered
              </Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Course Materials
            </h1>
            <p className="text-muted-foreground max-w-lg">
              {isAdmin 
                ? 'Manage and organize your learning resources with intelligent categorization' 
                : 'Explore curated learning materials powered by AI for enhanced understanding'}
            </p>
          </div>
          {isAdmin && (
            <Button
              variant="gradient"
              size="lg"
              icon={Plus}
              onClick={() => setIsUploadModalOpen(true)}
              className="shadow-xl"
            >
              Upload Material
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="group relative overflow-hidden border-none bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-100">Total Materials</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
            <TrendingUp className="w-12 h-12 absolute right-4 bottom-4 opacity-10" />
          </CardContent>
        </Card>
        
        <Card className="group relative overflow-hidden border-none bg-gradient-to-br from-violet-500 to-violet-600 text-white">
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-violet-100">Theory</p>
              <p className="text-3xl font-bold">{stats.theory}</p>
            </div>
            <BookOpen className="w-12 h-12 absolute right-4 bottom-4 opacity-10" />
          </CardContent>
        </Card>
        
        <Card className="group relative overflow-hidden border-none bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-100">Lab</p>
              <p className="text-3xl font-bold">{stats.lab}</p>
            </div>
            <FlaskConical className="w-12 h-12 absolute right-4 bottom-4 opacity-10" />
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="border-none shadow-lg">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search materials by title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-input rounded-xl bg-background focus:ring-2 focus:ring-ring focus:border-transparent focus:outline-none transition-all text-sm"
                />
              </div>
            </form>

            {/* Category Filters */}
            <Tabs value={categoryFilter} onValueChange={setCategoryFilter}>
              <TabsList className="bg-muted/50">
                {categoryFilters.map((filter) => {
                  const Icon = filter.icon;
                  return (
                    <TabsTrigger
                      key={filter.value}
                      value={filter.value}
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2"
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{filter.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-2.5 rounded-md transition-all",
                  viewMode === 'grid'
                    ? 'bg-background text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-2.5 rounded-md transition-all",
                  viewMode === 'list'
                    ? 'bg-background text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Refresh */}
            <Button
              variant="outline"
              size="icon"
              onClick={fetchMaterials}
              disabled={loading}
              className={cn(loading && "animate-spin")}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-full bg-destructive/10">
              <AlertCircle className="w-5 h-5 text-destructive" />
            </div>
            <span className="text-destructive flex-1">{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMaterials}
              className="border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              Try again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="p-6 space-y-4">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && materials.length === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6">
              <FileText className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No materials found
            </h3>
            <p className="text-muted-foreground text-center max-w-sm mb-6">
              {searchQuery || categoryFilter
                ? 'Try adjusting your search or filter criteria.'
                : isAdmin 
                  ? 'Get started by uploading your first course material.'
                  : 'No materials available yet. Check back later!'}
            </p>
            {isAdmin && (
              <Button variant="gradient" icon={Plus} onClick={() => setIsUploadModalOpen(true)}>
                Upload Your First Material
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Materials Grid */}
      {!loading && !error && materials.length > 0 && (
        <div
          className={cn(
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5'
              : 'flex flex-col gap-4'
          )}
        >
          {materials.map((material) => (
            <MaterialCard
              key={material.id}
              material={material}
              onDelete={isAdmin ? handleDelete : null}
              viewMode={viewMode}
            />
          ))}
        </div>
      )}

      {/* Floating Upload Button (Mobile) - Admin Only */}
      {isAdmin && (
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="fixed bottom-6 right-6 lg:hidden w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full shadow-xl shadow-purple-500/40 flex items-center justify-center transition-all hover:scale-110 z-50"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}

export default Dashboard;
