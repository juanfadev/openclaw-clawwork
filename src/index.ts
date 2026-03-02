/**
 * ClawWork OpenClaw Plugin Entry Point
 * 
 * This is the main entry point for the OpenClaw plugin.
 * It provides:
 * - /clawwork command handler
 * - Economic tool integrations
 * - Balance/status reporting
 */

import { EconomicTracker, createTracker } from './core/tracker';
import { TaskClassifier, createClassifier } from './core/classifier';
import { clawWorkToolDefinitions } from './tools';
import { ClawWorkState, TrackerConfig, TaskManager, WorkEvaluator } from './core/types';
import { v4 as uuidv4 } from 'uuid';

// Default configuration
const DEFAULT_CONFIG: TrackerConfig = {
  initialBalance: 1000.0,
  tokenPricing: {
    inputPrice: 2.50,
    outputPrice: 10.00
  },
  dataPath: './data',
  signature: 'clawwork-agent'
};

// Global state (singleton for the plugin lifetime)
let tracker: EconomicTracker | null = null;
let classifier: TaskClassifier | null = null;
let clawWorkState: ClawWorkState | null = null;

/**
 * Initialize the ClawWork plugin
 */
export function initialize(config?: Partial<TrackerConfig>): ClawWorkState {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  tracker = createTracker(finalConfig);
  classifier = createClassifier();
  
  clawWorkState = {
    economic_tracker: tracker,
    task_manager: {} as TaskManager,
    evaluator: {} as WorkEvaluator,
    signature: finalConfig.signature,
    current_date: new Date().toISOString().split('T')[0],
    current_task: null,
    data_path: finalConfig.dataPath,
    supports_multimodal: false
  };
  
  return clawWorkState;
}

/**
 * Get the current ClawWork state
 */
export function getState(): ClawWorkState | null {
  return clawWorkState;
}

/**
 * Get the economic tracker
 */
export function getTracker(): EconomicTracker | null {
  return tracker;
}

/**
 * Get the task classifier
 */
export function getClassifier(): TaskClassifier | null {
  return classifier;
}

/**
 * Process a /clawwork command
 * Returns the modified prompt and task info
 */
export function processClawWorkCommand(prompt: string): {
  modifiedPrompt: string;
  taskInfo: {
    taskId: string;
    occupation: string;
    hourlyWage: number;
    hoursEstimate: number;
    maxPayment: number;
  } | null;
} {
  if (!classifier || !tracker || !clawWorkState) {
    initialize();
  }
  
  // Check if this is a /clawwork command
  const clawworkPrefix = '/clawwork';
  if (!prompt.toLowerCase().startsWith(clawworkPrefix)) {
    return {
      modifiedPrompt: prompt,
      taskInfo: null
    };
  }
  
  // Extract the instruction
  const instruction = prompt.slice(clawworkPrefix.length).trim();
  
  if (!instruction) {
    return {
      modifiedPrompt: prompt,
      taskInfo: null
    };
  }
  
  // Classify the task
  const classification = classifier!.classify(instruction);
  
  // Generate a task ID
  const taskId = uuidv4();
  
  // Start tracking the task
  tracker!.start_task(taskId);
  
  // Store current task info
  clawWorkState!.current_task = {
    taskId,
    occupation: classification.occupation,
    sector: 'general',
    prompt: instruction,
    max_payment: classification.task_value,
    hours_estimate: classification.hours_estimate,
    hourly_wage: classification.hourly_wage,
    source: 'clawwork'
  };
  
  // Create the modified prompt with task context
  const modifiedPrompt = `You have been assigned a PAID TASK.

Task Details:
- Occupation: ${classification.occupation}
- Estimated Hours: ${classification.hours_estimate}
- Hourly Wage: $${classification.hourly_wage.toFixed(2)}
- Max Payment: $${classification.task_value.toFixed(2)}

${instruction}

Complete this task carefully. When done, use the submit_work tool to submit your work for evaluation and payment.`;
  
  return {
    modifiedPrompt,
    taskInfo: {
      taskId,
      occupation: classification.occupation,
      hourlyWage: classification.hourly_wage,
      hoursEstimate: classification.hours_estimate,
      maxPayment: classification.task_value
    }
  };
}

/**
 * Track token usage (for provider wrapper)
 */
export function trackTokens(inputTokens: number, outputTokens: number): void {
  if (tracker) {
    tracker.track_tokens(inputTokens, outputTokens);
  }
}

/**
 * End current task and finalize costs
 */
export function endCurrentTask(): void {
  if (tracker) {
    tracker.end_task();
  }
}

/**
 * Get current balance
 */
export function getBalance(): number {
  return tracker?.get_balance() ?? 0;
}

/**
 * Get survival status
 */
export function getSurvivalStatus(): string {
  return tracker?.get_survival_status() ?? 'unknown';
}

/**
 * Format status message for the agent
 */
export function formatStatusMessage(): string {
  const balance = getBalance();
  const status = getSurvivalStatus();
  
  return `💰 ClawWork Status:
- Balance: $${balance.toFixed(2)}
- Status: ${status}`;
}

// Export tool definitions for OpenClaw
export const tools = clawWorkToolDefinitions;

// Export plugin info
export const pluginInfo = {
  name: 'clawwork',
  version: '1.0.0',
  description: 'ClawWork economic survival protocol for OpenClaw'
};

// Default export for OpenClaw plugin system
export default {
  pluginInfo,
  tools,
  initialize,
  getState,
  processClawWorkCommand,
  trackTokens,
  endCurrentTask,
  getBalance,
  getSurvivalStatus,
  formatStatusMessage
};
