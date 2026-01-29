import React, { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Search,
  BookOpen,
  Loader2,
} from 'lucide-react';

/**
 * GroundingComparison Component
 * Shows side-by-side comparison of AI-generated claims vs. source facts
 * Provides transparency into what was generated and what facts support it
 */
export function GroundingComparison({ 
  semanticGrounding, 
  onRefresh, 
  isLoading = false 
}) {
  const [expandedClaims, setExpandedClaims] = useState(new Set());
  const [filter, setFilter] = useState('all'); // all, verified, issues

  if (!semanticGrounding) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No semantic grounding analysis available</p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Run Analysis
          </button>
        )}
      </div>
    );
  }

  const { comparisons = [], summary = {} } = semanticGrounding;

  const toggleClaim = (id) => {
    const newExpanded = new Set(expandedClaims);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedClaims(newExpanded);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'partially_verified':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'contradicted':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'not_found':
      case 'no_sources':
        return <HelpCircle className="w-5 h-5 text-gray-400" />;
      default:
        return <HelpCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      verified: 'bg-green-100 text-green-800 border-green-200',
      partially_verified: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      contradicted: 'bg-red-100 text-red-800 border-red-200',
      not_found: 'bg-gray-100 text-gray-600 border-gray-200',
      no_sources: 'bg-gray-100 text-gray-500 border-gray-200',
    };
    const labels = {
      verified: 'Verified',
      partially_verified: 'Partial Match',
      contradicted: 'Contradicted',
      not_found: 'Not Found',
      no_sources: 'No Sources',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[status] || styles.not_found}`}>
        {labels[status] || 'Unknown'}
      </span>
    );
  };

  const filteredComparisons = comparisons.filter(comp => {
    if (filter === 'all') return true;
    if (filter === 'verified') return comp.verification.status === 'verified';
    if (filter === 'issues') return ['contradicted', 'not_found', 'partially_verified'].includes(comp.verification.status);
    return true;
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header with Summary */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <BookOpen className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Semantic Grounding Analysis</h3>
              <p className="text-sm text-gray-500">
                Comparing generated claims against source materials
              </p>
            </div>
          </div>
          
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>

        {/* Summary Stats */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard 
            label="Claims Analyzed" 
            value={semanticGrounding.claimsAnalyzed || 0}
            color="blue"
          />
          <StatCard 
            label="Verified" 
            value={summary.verified || 0}
            color="green"
          />
          <StatCard 
            label="Partial" 
            value={summary.partiallyVerified || 0}
            color="yellow"
          />
          <StatCard 
            label="Not Found" 
            value={summary.notFound || 0}
            color="gray"
          />
          <StatCard 
            label="Contradicted" 
            value={summary.contradicted || 0}
            color="red"
          />
        </div>

        {/* Grounding Score */}
        <div className="mt-4 bg-white rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Grounding Score</span>
            <span className={`text-lg font-bold ${
              summary.overallGroundingScore >= 70 ? 'text-green-600' :
              summary.overallGroundingScore >= 40 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {summary.overallGroundingScore || 0}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all ${
                summary.overallGroundingScore >= 70 ? 'bg-green-500' :
                summary.overallGroundingScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${summary.overallGroundingScore || 0}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-gray-600">{summary.message}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex gap-2">
          {['all', 'verified', 'issues'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                filter === f 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {f === 'all' ? 'All Claims' : f === 'verified' ? '✓ Verified' : '⚠ Issues'}
            </button>
          ))}
        </div>
      </div>

      {/* Claims List */}
      <div className="divide-y divide-gray-100">
        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-3" />
            <p className="text-gray-500">Analyzing claims against source materials...</p>
          </div>
        ) : filteredComparisons.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No claims match the current filter
          </div>
        ) : (
          filteredComparisons.map((comparison) => (
            <ClaimComparisonCard
              key={comparison.id}
              comparison={comparison}
              isExpanded={expandedClaims.has(comparison.id)}
              onToggle={() => toggleClaim(comparison.id)}
              getStatusIcon={getStatusIcon}
              getStatusBadge={getStatusBadge}
            />
          ))
        )}
      </div>

      {/* Recommendations */}
      {semanticGrounding.recommendations && semanticGrounding.recommendations.length > 0 && (
        <div className="p-4 bg-amber-50 border-t border-amber-100">
          <h4 className="font-medium text-amber-800 mb-2">💡 Recommendations</h4>
          <ul className="space-y-2">
            {semanticGrounding.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                  rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                  rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {rec.priority}
                </span>
                <div>
                  <span className="font-medium text-gray-800">{rec.action}</span>
                  <p className="text-gray-600">{rec.details}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Individual Claim Comparison Card
 */
function ClaimComparisonCard({ 
  comparison, 
  isExpanded, 
  onToggle, 
  getStatusIcon, 
  getStatusBadge 
}) {
  const { generatedClaim, claimType, importance, verification } = comparison;

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      {/* Claim Header */}
      <div 
        className="flex items-start gap-3 cursor-pointer"
        onClick={onToggle}
      >
        {getStatusIcon(verification.status)}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {getStatusBadge(verification.status)}
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
              {claimType?.replace('_', ' ')}
            </span>
            {importance === 'high' && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded font-medium">
                High Priority
              </span>
            )}
            <span className="text-xs text-gray-400">
              {verification.confidence}% confidence
            </span>
          </div>
          
          {/* Generated Claim */}
          <div className="mt-2">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <Sparkles className="w-3 h-3" />
              <span className="font-medium">AI Generated:</span>
            </div>
            <p className="text-gray-800 bg-indigo-50 rounded-lg px-3 py-2 text-sm border-l-4 border-indigo-400">
              "{generatedClaim}"
            </p>
          </div>
        </div>

        <button className="p-1 text-gray-400 hover:text-gray-600">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-4 ml-8 space-y-4">
          {/* Source Fact */}
          {verification.matchedFact ? (
            <div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <FileText className="w-3 h-3" />
                <span className="font-medium">Source Fact:</span>
                {verification.source && (
                  <span className="text-indigo-600">[{verification.source}]</span>
                )}
              </div>
              <p className="text-gray-800 bg-green-50 rounded-lg px-3 py-2 text-sm border-l-4 border-green-400">
                "{verification.matchedFact}"
              </p>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-500 border-l-4 border-gray-300">
              No matching fact found in source materials
            </div>
          )}

          {/* Comparison Arrow */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Explanation */}
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="text-xs font-medium text-gray-500 mb-1">Analysis</div>
            <p className="text-sm text-gray-700">{verification.explanation}</p>
            
            {/* Discrepancy Warning */}
            {verification.discrepancy && (
              <div className="mt-3 p-2 bg-red-50 border border-red-100 rounded-lg">
                <div className="flex items-center gap-2 text-red-700 text-xs font-medium mb-1">
                  <AlertTriangle className="w-3 h-3" />
                  Discrepancy Detected
                </div>
                <p className="text-sm text-red-600">{verification.discrepancy}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Small stat card component
 */
function StatCard({ label, value, color }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    red: 'bg-red-100 text-red-700',
    gray: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className={`rounded-lg px-3 py-2 ${colorClasses[color] || colorClasses.gray}`}>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs opacity-80">{label}</div>
    </div>
  );
}

export default GroundingComparison;
