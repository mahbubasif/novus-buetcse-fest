import React from 'react';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Award,
  Target,
  Code,
  FileCheck,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';

/**
 * ValidationResults Component
 * Displays comprehensive validation results for generated content
 */
export function ValidationResults({ validation, onRevalidate, isRevalidating }) {
  if (!validation || !validation.success) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-yellow-900">Validation Not Available</h4>
            <p className="text-xs text-yellow-700 mt-1">
              {validation?.message || 'This content has not been validated yet.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { overall, syntax, grounding, quality } = validation;

  // Determine overall status color
  const getStatusColor = (score) => {
    if (score >= 85) return 'green';
    if (score >= 70) return 'blue';
    if (score >= 55) return 'yellow';
    return 'red';
  };

  const statusColor = getStatusColor(overall.overallScore);

  const statusColors = {
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-900',
      badge: 'bg-green-100 text-green-800',
      icon: 'text-green-600',
    },
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-900',
      badge: 'bg-blue-100 text-blue-800',
      icon: 'text-blue-600',
    },
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-900',
      badge: 'bg-yellow-100 text-yellow-800',
      icon: 'text-yellow-600',
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-900',
      badge: 'bg-red-100 text-red-800',
      icon: 'text-red-600',
    },
  };

  const colors = statusColors[statusColor];

  return (
    <div className="space-y-4">
      {/* Overall Score Card */}
      <div className={`${colors.bg} ${colors.border} border rounded-lg p-5`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {overall.passesValidation ? (
              <CheckCircle className={`w-6 h-6 ${colors.icon}`} />
            ) : (
              <XCircle className={`w-6 h-6 ${colors.icon}`} />
            )}
            <div>
              <h3 className={`text-lg font-bold ${colors.text}`}>
                Validation Score: {overall.overallScore}%
              </h3>
              <p className="text-sm text-gray-600">
                Status: <span className={`font-semibold ${colors.text}`}>{overall.status}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors.badge}`}>
              {overall.passesValidation ? '✓ PASSED' : '✗ FAILED'}
            </span>
            {onRevalidate && (
              <button
                onClick={onRevalidate}
                disabled={isRevalidating}
                className="p-2 hover:bg-white rounded-lg transition-colors disabled:opacity-50"
                title="Re-validate content"
              >
                <RefreshCw className={`w-4 h-4 ${colors.icon} ${isRevalidating ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <ScoreBar
            label="Code Syntax"
            score={overall.breakdown.syntax}
            icon={<Code className="w-4 h-4" />}
          />
          <ScoreBar
            label="Content Grounding"
            score={overall.breakdown.grounding}
            icon={<Target className="w-4 h-4" />}
          />
          <ScoreBar
            label="Overall Quality"
            score={overall.breakdown.quality}
            icon={<Award className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Detailed Results Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Syntax Check */}
        <DetailCard
          title="Code Syntax"
          icon={<Code className="w-5 h-5" />}
          color="purple"
        >
          {syntax.hasCode ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Blocks Checked:</span>
                <span className="font-semibold">{syntax.blocksChecked}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Valid:</span>
                <span className="font-semibold text-green-600">{syntax.validBlocks}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Invalid:</span>
                <span className="font-semibold text-red-600">{syntax.invalidBlocks}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Skipped:</span>
                <span className="font-semibold text-gray-500">{syntax.skippedBlocks}</span>
              </div>
              {syntax.allValid ? (
                <div className="flex items-center gap-2 text-green-600 mt-3 p-2 bg-green-50 rounded">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs font-medium">All code is syntactically valid</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600 mt-3 p-2 bg-red-50 rounded">
                  <XCircle className="w-4 h-4" />
                  <span className="text-xs font-medium">{syntax.message}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No code blocks to validate</p>
          )}
        </DetailCard>

        {/* Grounding Check */}
        <DetailCard
          title="Content Grounding"
          icon={<FileCheck className="w-5 h-5" />}
          color="indigo"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Grounding Score:</span>
              <span className="font-semibold">{grounding.groundingScore}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Level:</span>
              <span className="font-semibold">{grounding.groundingLevel}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total Citations:</span>
              <span className="font-semibold">{grounding.totalCitations}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Internal:</span>
              <span className="font-semibold text-blue-600">{grounding.internalCitations}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">External:</span>
              <span className="font-semibold text-gray-600">{grounding.externalCitations}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Materials Used:</span>
              <span className="font-semibold text-green-600">{grounding.materialsUsed}</span>
            </div>
          </div>
        </DetailCard>

        {/* Quality Evaluation */}
        <DetailCard
          title="Quality Assessment"
          icon={<Award className="w-5 h-5" />}
          color="amber"
        >
          {quality.success ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Overall Score:</span>
                <span className="font-semibold">{quality.overallScore}/10</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Grade:</span>
                <span className="font-bold text-lg">{quality.grade}</span>
              </div>
              <div className="mt-3 space-y-1">
                {Object.entries(quality.scores).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                    </span>
                    <span className="font-medium">{value}/10</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Quality assessment not available</p>
          )}
        </DetailCard>
      </div>

      {/* Strengths and Weaknesses */}
      {quality.success && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Strengths */}
          {quality.strengths?.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Strengths
              </h4>
              <ul className="space-y-1">
                {quality.strengths.map((strength, idx) => (
                  <li key={idx} className="text-xs text-green-700 flex items-start gap-2">
                    <CheckCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Weaknesses */}
          {quality.weaknesses?.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-amber-900 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Areas for Improvement
              </h4>
              <ul className="space-y-1">
                {quality.weaknesses.map((weakness, idx) => (
                  <li key={idx} className="text-xs text-amber-700 flex items-start gap-2">
                    <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Recommendations */}
      {quality.recommendations?.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">Recommendations</h4>
          <ul className="space-y-1">
            {quality.recommendations.map((rec, idx) => (
              <li key={idx} className="text-xs text-blue-700 flex items-start gap-2">
                <span className="text-blue-500">→</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Critical Issues */}
      {quality.criticalIssues?.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-red-900 mb-2 flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            Critical Issues
          </h4>
          <ul className="space-y-1">
            {quality.criticalIssues.map((issue, idx) => (
              <li key={idx} className="text-xs text-red-700 flex items-start gap-2">
                <XCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Helper Components

function ScoreBar({ label, score, icon }) {
  const getColor = (score) => {
    if (score >= 85) return 'bg-green-500';
    if (score >= 70) return 'bg-blue-500';
    if (score >= 55) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white rounded-lg p-3 border border-gray-200">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium text-gray-700">{label}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
        <div
          className={`h-2 rounded-full ${getColor(score)} transition-all duration-300`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-bold text-gray-900">{score}%</span>
    </div>
  );
}

function DetailCard({ title, icon, color, children }) {
  const colors = {
    purple: 'border-purple-200 bg-purple-50',
    indigo: 'border-indigo-200 bg-indigo-50',
    amber: 'border-amber-200 bg-amber-50',
  };

  return (
    <div className={`rounded-lg border p-4 ${colors[color] || 'border-gray-200 bg-gray-50'}`}>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
      </div>
      {children}
    </div>
  );
}

export default ValidationResults;
