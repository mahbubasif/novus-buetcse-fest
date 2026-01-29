import React, { useState, useEffect } from 'react';
import {
  Plus,
  Filter,
  Search,
  LayoutGrid,
  List,
  BookOpen,
  FlaskConical,
  FileText,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import MaterialCard from '../components/MaterialCard';
import UploadModal from '../components/UploadModal';
import { getMaterials, deleteMaterial } from '../services/api';
import { useRole } from '../contexts/RoleContext';

const categoryFilters = [
  { value: '', label: 'All Materials', icon: FileText },
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
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Course Materials</h1>
          <p className="text-gray-500 mt-1">
            {isAdmin 
              ? 'Manage and organize your learning resources' 
              : 'Browse and explore your learning resources'}
          </p>
        </div>
        {isAdmin && (
          <Button
            icon={Plus}
            onClick={() => setIsUploadModalOpen(true)}
            className="shadow-lg shadow-indigo-500/25"
          >
            Upload Material
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-50">
              <FileText className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Materials</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Theory</p>
              <p className="text-2xl font-bold text-gray-900">{stats.theory}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-50">
              <FlaskConical className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Lab</p>
              <p className="text-2xl font-bold text-gray-900">{stats.lab}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search materials by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all"
              />
            </div>
          </form>

          {/* Category Filters */}
          <div className="flex items-center gap-2">
            {categoryFilters.map((filter) => {
              const Icon = filter.icon;
              const isActive = categoryFilter === filter.value;
              return (
                <button
                  key={filter.value}
                  onClick={() => setCategoryFilter(filter.value)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                    transition-all duration-200
                    ${
                      isActive
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{filter.label}</span>
                </button>
              );
            })}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Refresh */}
          <Button
            variant="ghost"
            size="sm"
            icon={RefreshCw}
            onClick={fetchMaterials}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
          <button
            onClick={fetchMaterials}
            className="ml-auto text-sm font-medium underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading materials...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && materials.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <FileText className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            No materials found
          </h3>
          <p className="text-gray-500 text-center max-w-sm mb-6">
            {searchQuery || categoryFilter
              ? 'Try adjusting your search or filter criteria.'
              : isAdmin 
                ? 'Get started by uploading your first course material.'
                : 'No materials available yet. Check back later!'}
          </p>
          {isAdmin && (
            <Button icon={Plus} onClick={() => setIsUploadModalOpen(true)}>
              Upload Material
            </Button>
          )}
        </div>
      )}

      {/* Materials Grid */}
      {!loading && !error && materials.length > 0 && (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5'
              : 'flex flex-col gap-4'
          }
        >
          {materials.map((material) => (
            <MaterialCard
              key={material.id}
              material={material}
              onDelete={isAdmin ? handleDelete : null}
            />
          ))}
        </div>
      )}

      {/* Floating Upload Button (Mobile) - Admin Only */}
      {isAdmin && (
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="fixed bottom-6 right-6 lg:hidden w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg shadow-indigo-500/40 flex items-center justify-center transition-all hover:scale-105"
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
