export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  type:
    | 'missing_node'
    | 'invalid_edge'
    | 'circular_dependency'
    | 'syntax_error'
    | 'invalid_path_structure';
  message: string;
  nodeId?: string;
  edgeId?: string;
}

export interface ValidationWarning {
  type:
    | 'unreachable_node'
    | 'missing_end_node'
    | 'complex_condition'
    | 'circular_dependency'
    | 'suboptimal_path_order'
    | 'unreachable_path'
    | 'missing_default_path';
  message: string;
  nodeId?: string;
  edgeId?: string;
}

export interface PathSegment {
  type: 'choice';
  outletId?: string;
}

export interface PathTestResult {
  success: boolean;
  finalState: Record<string, unknown>;
  errors: { segment: PathSegment; error: string }[];
}

export interface AnalysisInsight {
  type: 'info' | 'warning' | 'error' | 'suggestion';
  category: 'structure' | 'paths' | 'content' | 'performance' | 'usability';
  title: string;
  description: string;
  nodeId?: string;
  pathExample?: string[];
  actionable?: boolean;
  suggestion?: string;
}

export interface FlowAnalysis {
  isValid: boolean;
  score: number; // 0-100 quality score
  insights: AnalysisInsight[];
  structure: StructureAnalysis;
  paths: PathAnalysis;
  content: ContentAnalysis;
  userExperience: UserExperienceAnalysis;
}

export interface StructureAnalysis {
  totalNodes: number;
  decisionNodes: number;
  endNodes: number;
  startNodes: number;
  averageChoicesPerDecision: number;
  maxDepth: number;
  branchingFactor: number;
}

export interface PathAnalysis {
  totalPaths: number;
  completedPaths: number;
  averagePathLength: number;
  shortestPath: number;
  longestPath: number;
  unreachableNodes: number;
  loops: number;
}

export interface ContentAnalysis {
  averageNodeTextLength: number;
  emptyNodes: number;
  duplicateContent: number;
  clarityScore: number;
}

export interface UserExperienceAnalysis {
  replayability: number;
  engagement: number;
  complexity: 'simple' | 'moderate' | 'complex';
  estimatedPlayTime: string;
}
