/**
 * ClawWork Economic Types
 * 
 * Type definitions for the economic tracking system.
 */

export interface TokenPricing {
  /** Cost per 1M input tokens */
  inputPrice: number;
  /** Cost per 1M output tokens */
  outputPrice: number;
}

export interface TaskCost {
  taskId: string;
  date: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  timestamp: string;
}

export interface BalanceEntry {
  date: string;
  balance: number;
  dailyCost: number;
  dailyIncome: number;
  timestamp: string;
}

export interface WorkEntry {
  taskId: string;
  date: string;
  amount: number;
  evaluationScore: number;
  timestamp: string;
}

export type SurvivalStatus = 'thriving' | 'stable' | 'struggling' | 'bankrupt';

export interface TrackerConfig {
  initialBalance: number;
  tokenPricing: TokenPricing;
  dataPath: string;
  signature: string;
}

export interface TaskInfo {
  taskId: string;
  occupation: string;
  sector: string;
  prompt: string;
  max_payment: number;
  hours_estimate: number;
  hourly_wage: number;
  source: string;
}

export interface ClawWorkState {
  economic_tracker: EconomicTracker;
  task_manager: TaskManager;
  evaluator: WorkEvaluator;
  signature: string;
  current_date: string | null;
  current_task: TaskInfo | null;
  data_path: string;
  supports_multimodal: boolean;
}

// Placeholder interfaces for compatibility
export interface EconomicTracker {
  start_task(taskId: string, date?: string): void;
  end_task(): void;
  track_tokens(inputTokens: number, outputTokens: number): void;
  add_work_income(amount: number, taskId: string, evaluationScore: number): number;
  get_balance(): number;
  get_daily_cost(): number;
  get_session_cost(): number;
  get_net_worth(): number;
  get_survival_status(): SurvivalStatus;
  current_task_id: string | null;
}

export interface TaskManager {
  // Placeholder for task management
}

export interface WorkEvaluator {
  evaluate_artifact(signature: string, task: TaskInfo, artifact_path: string[], description: string): [boolean, number, string, number];
}

export const DEFAULT_CONFIG: TrackerConfig = {
  initialBalance: 1000.0,
  tokenPricing: {
    inputPrice: 2.50,   // $2.50 per 1M input tokens
    outputPrice: 10.00  // $10.00 per 1M output tokens
  },
  dataPath: './data',
  signature: 'default-agent'
};
