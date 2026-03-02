/**
 * ClawWork Economic Tracker
 * 
 * Tracks agent balance, token costs, and survival status.
 * Ports the Python EconomicTracker from ClawWork to TypeScript.
 */

import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  TokenPricing,
  TaskCost,
  BalanceEntry,
  SurvivalStatus,
  TrackerConfig,
  DEFAULT_CONFIG
} from './types';

export class EconomicTracker {
  private config: TrackerConfig;
  private balance: number;
  private dailyCost: number = 0;
  private dailyIncome: number = 0;
  private sessionCost: number = 0;
  private currentDate: string;
  
  // Current task tracking
  current_task_id: string | null = null;
  private currentTaskInputTokens: number = 0;
  private currentTaskOutputTokens: number = 0;
  
  // Data paths
  private balancePath: string;
  private tokenCostsPath: string;

  constructor(config: Partial<TrackerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.balance = this.config.initialBalance;
    this.currentDate = this.getDateString();
    
    // Set up data paths
    const dataDir = path.join(this.config.dataPath, this.config.signature, 'economic');
    this.balancePath = path.join(dataDir, 'balance.jsonl');
    this.tokenCostsPath = path.join(dataDir, 'token_costs.jsonl');
    
    // Ensure data directory exists
    fs.mkdirSync(path.dirname(this.balancePath), { recursive: true });
    fs.mkdirSync(path.dirname(this.tokenCostsPath), { recursive: true });
    
    // Load existing balance if available
    this.loadBalance();
  }

  // ------------------------------------------------------------------
  // Task lifecycle
  // ------------------------------------------------------------------

  /**
   * Start tracking a new task
   */
  start_task(taskId: string, date?: string): void {
    this.current_task_id = taskId;
    this.currentTaskInputTokens = 0;
    this.currentTaskOutputTokens = 0;
    this.sessionCost = 0;
    
    const taskDate = date || this.getDateString();
    if (taskDate !== this.currentDate) {
      // New day - reset daily counters
      this.persistBalance();
      this.currentDate = taskDate;
      this.dailyCost = 0;
      this.dailyIncome = 0;
    }
  }

  /**
   * End current task and persist costs
   */
  end_task(): void {
    if (!this.current_task_id) return;
    
    const cost = this.calculateCost(this.currentTaskInputTokens, this.currentTaskOutputTokens);
    
    // Deduct cost from balance
    this.balance -= cost;
    this.dailyCost += cost;
    
    // Persist token costs
    this.persistTokenCost({
      taskId: this.current_task_id,
      date: this.currentDate,
      inputTokens: this.currentTaskInputTokens,
      outputTokens: this.currentTaskOutputTokens,
      cost: cost,
      timestamp: new Date().toISOString()
    });
    
    // Reset task state
    this.current_task_id = null;
    this.currentTaskInputTokens = 0;
    this.currentTaskOutputTokens = 0;
  }

  // ------------------------------------------------------------------
  // Token tracking
  // ------------------------------------------------------------------

  /**
   * Track token usage for current task
   */
  track_tokens(inputTokens: number, outputTokens: number): void {
    this.currentTaskInputTokens += inputTokens;
    this.currentTaskOutputTokens += outputTokens;
    
    const cost = this.calculateCost(inputTokens, outputTokens);
    this.sessionCost += cost;
  }

  // ------------------------------------------------------------------
  // Income and balance
  // ------------------------------------------------------------------

  /**
   * Add income from completed work
   * Applies 0.6 quality cliff - evaluations below 0.6 get $0
   */
  add_work_income(amount: number, taskId: string, evaluationScore: number): number {
    // Quality cliff at 0.6
    if (evaluationScore < 0.6) {
      return 0;
    }
    
    // Proportional payment based on evaluation score
    const actualPayment = amount * evaluationScore;
    this.balance += actualPayment;
    this.dailyIncome += actualPayment;
    
    return actualPayment;
  }

  /**
   * Get current balance
   */
  get_balance(): number {
    return this.balance;
  }

  /**
   * Get today's total cost
   */
  get_daily_cost(): number {
    return this.dailyCost;
  }

  /**
   * Get current session cost
   */
  get_session_cost(): number {
    return this.sessionCost;
  }

  /**
   * Get net worth (same as balance for now)
   */
  get_net_worth(): number {
    return this.balance;
  }

  // ------------------------------------------------------------------
  // Survival status
  // ------------------------------------------------------------------

  /**
   * Get survival status based on balance thresholds
   */
  get_survival_status(): SurvivalStatus {
    if (this.balance > 500) return 'thriving';
    if (this.balance > 100) return 'stable';
    if (this.balance > 0) return 'struggling';
    return 'bankrupt';
  }

  // ------------------------------------------------------------------
  // Persistence
  // ------------------------------------------------------------------

  /**
   * Calculate cost from token counts
   */
  private calculateCost(inputTokens: number, outputTokens: number): number {
    const inputCost = (inputTokens / 1_000_000) * this.config.tokenPricing.inputPrice;
    const outputCost = (outputTokens / 1_000_000) * this.config.tokenPricing.outputPrice;
    return inputCost + outputCost;
  }

  /**
   * Get current date as YYYY-MM-DD string
   */
  private getDateString(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Load balance from persisted data
   */
  private loadBalance(): void {
    try {
      if (fs.existsSync(this.balancePath)) {
        const lines = fs.readFileSync(this.balancePath, 'utf-8').trim().split('\n');
        if (lines.length > 0) {
          const lastEntry = JSON.parse(lines[lines.length - 1]) as BalanceEntry;
          // Only load if it's from today
          if (lastEntry.date === this.currentDate) {
            this.balance = lastEntry.balance;
            this.dailyCost = lastEntry.dailyCost;
            this.dailyIncome = lastEntry.dailyIncome;
          }
        }
      }
    } catch (error) {
      // Ignore errors - start fresh
    }
  }

  /**
   * Persist current balance to file
   */
  private persistBalance(): void {
    const entry: BalanceEntry = {
      date: this.currentDate,
      balance: this.balance,
      dailyCost: this.dailyCost,
      dailyIncome: this.dailyIncome,
      timestamp: new Date().toISOString()
    };
    
    fs.appendFileSync(this.balancePath, JSON.stringify(entry) + '\n', 'utf-8');
  }

  /**
   * Persist token cost entry to file
   */
  private persistTokenCost(entry: TaskCost): void {
    fs.appendFileSync(this.tokenCostsPath, JSON.stringify(entry) + '\n', 'utf-8');
  }
}

// Export factory function for convenience
export function createTracker(config?: Partial<TrackerConfig>): EconomicTracker {
  return new EconomicTracker(config);
}
