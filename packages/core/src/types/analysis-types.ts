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
