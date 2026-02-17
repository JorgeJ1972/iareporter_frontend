export interface SyncTaskProgress {
  id: number;
  environment_id: number;
  task_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress_percent: number;
  current_step: string;
  total_steps: number;
  completed_steps: number;
  
  // Results
  tables_processed: number;
  tables_created: number;
  tables_updated: number;
  columns_processed: number;
  columns_created: number;
  columns_updated: number;
  
  // Error information
  error_message?: string;
  error_details?: string;
  
  // Timestamps
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface SyncTaskStartResponse {
  task_id: number;
  status: string;
  message: string;
}

export interface SyncTaskStatusResponse {
  task: SyncTaskProgress;
  message: string;
}

export interface SyncTaskListResponse {
  tasks: SyncTaskProgress[];
  message: string;
}