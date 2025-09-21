import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  Lightbulb,
  CheckCircle,
  TrendingUp,
  Users,
  Clock,
  GitBranch,
  Target,
  FileText,
  MapPin,
} from 'lucide-react';
import type { FlowAnalysis, AnalysisInsight } from '@zflo/core';
import { Button } from './ui/button';

interface FlowAnalysisProps {
  analysis: FlowAnalysis | null;
  isLoading?: boolean;
  onReanalyze?: () => void;
}

export const FlowAnalysisComponent: React.FC<FlowAnalysisProps> = ({
  analysis,
  isLoading = false,
  onReanalyze,
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Analyzing Flowchart...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Flowchart Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Enter a flowchart above to see detailed analysis and insights.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getInsightIcon = (type: AnalysisInsight['type']) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'suggestion':
        return <Lightbulb className="h-4 w-4 text-blue-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple':
        return 'text-green-600';
      case 'moderate':
        return 'text-yellow-600';
      case 'complex':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Analysis Results
            </CardTitle>
            {onReanalyze && (
              <Button variant="outline" size="sm" onClick={onReanalyze}>
                Re-analyze
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="text-center">
              <div
                className={`text-3xl font-bold ${getScoreColor(analysis.score)}`}
              >
                {analysis.score}
              </div>
              <div className="text-sm text-muted-foreground">Quality Score</div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {analysis.isValid ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                )}
                <span className="text-sm font-medium">
                  {analysis.isValid ? 'Valid Structure' : 'Has Issues'}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    analysis.score >= 80
                      ? 'bg-green-600'
                      : analysis.score >= 60
                        ? 'bg-yellow-600'
                        : 'bg-red-600'
                  }`}
                  style={{ width: `${analysis.score}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center p-2 bg-muted/50 rounded">
              <div className="font-semibold">
                {analysis.structure.totalNodes}
              </div>
              <div className="text-muted-foreground">Nodes</div>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded">
              <div className="font-semibold">{analysis.paths.totalPaths}</div>
              <div className="text-muted-foreground">Paths</div>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded">
              <div className="font-semibold">{analysis.structure.endNodes}</div>
              <div className="text-muted-foreground">Endings</div>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded">
              <div
                className={`font-semibold ${getComplexityColor(analysis.userExperience.complexity)}`}
              >
                {analysis.userExperience.complexity}
              </div>
              <div className="text-muted-foreground">Complexity</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nodes Needing Attention */}
      {analysis.insights.filter(
        (i) => i.nodeId || i.type === 'error' || i.type === 'warning'
      ).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Nodes Needing Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.insights
                .filter(
                  (i) => i.nodeId || i.type === 'error' || i.type === 'warning'
                )
                .slice(0, 6)
                .map((insight: AnalysisInsight, index: number) => (
                  <div
                    key={index}
                    className="flex gap-3 p-3 rounded-lg border border-muted bg-card"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getInsightIcon(insight.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-medium text-sm">
                          {insight.title}
                        </div>
                        {insight.nodeId && (
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                            {insight.nodeId}
                          </code>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        {insight.description}
                      </div>
                      {insight.pathExample && (
                        <div className="text-xs bg-muted/50 p-2 rounded mb-2">
                          <strong>Path:</strong>{' '}
                          {insight.pathExample.join(' → ')}
                        </div>
                      )}
                      {insight.suggestion && (
                        <div className="text-sm text-blue-600 bg-blue-50 dark:bg-blue-950/30 p-2 rounded">
                          💡 {insight.suggestion}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* General Insights */}
      {analysis.insights.filter(
        (i) => !i.nodeId && i.type !== 'error' && i.type !== 'warning'
      ).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              General Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.insights
                .filter(
                  (i) => !i.nodeId && i.type !== 'error' && i.type !== 'warning'
                )
                .slice(0, 6)
                .map((insight: AnalysisInsight, index: number) => (
                  <div
                    key={index}
                    className="flex gap-3 p-3 rounded-lg bg-muted/30"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getInsightIcon(insight.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{insight.title}</div>
                      <div className="text-sm text-muted-foreground mb-1">
                        {insight.description}
                      </div>
                      {insight.suggestion && (
                        <div className="text-sm text-blue-600 bg-blue-50 dark:bg-blue-950/30 p-2 rounded mt-2">
                          💡 {insight.suggestion}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Metrics */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Structure Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <GitBranch className="h-4 w-4" />
              Structure
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Decision Points
              </span>
              <span className="font-medium">
                {analysis.structure.decisionNodes}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Avg Choices per Decision
              </span>
              <span className="font-medium">
                {analysis.structure.averageChoicesPerDecision}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Max Depth</span>
              <span className="font-medium">{analysis.structure.maxDepth}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Branching Factor
              </span>
              <span className="font-medium">
                {analysis.structure.branchingFactor}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Path Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-4 w-4" />
              Paths
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Completed Paths
              </span>
              <span className="font-medium">
                {analysis.paths.completedPaths}/{analysis.paths.totalPaths}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Avg Path Length
              </span>
              <span className="font-medium">
                {analysis.paths.averagePathLength} steps
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Shortest Path
              </span>
              <span className="font-medium">
                {analysis.paths.shortestPath} steps
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Longest Path
              </span>
              <span className="font-medium">
                {analysis.paths.longestPath} steps
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Content Quality */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-4 w-4" />
              Content
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Avg Text Length
              </span>
              <span className="font-medium">
                {analysis.content.averageNodeTextLength} chars
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Empty Nodes</span>
              <span className="font-medium">{analysis.content.emptyNodes}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Clarity Score
              </span>
              <span className="font-medium">
                {analysis.content.clarityScore}/100
              </span>
            </div>
          </CardContent>
        </Card>

        {/* User Experience */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-4 w-4" />
              User Experience
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Replayability
              </span>
              <span className="font-medium">
                {analysis.userExperience.replayability}/100
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Engagement</span>
              <span className="font-medium">
                {analysis.userExperience.engagement}/100
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Estimated Play Time
              </span>
              <span className="font-medium flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {analysis.userExperience.estimatedPlayTime}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
