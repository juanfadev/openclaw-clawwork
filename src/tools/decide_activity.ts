/**
 * ClawWork Tool: Decide Activity
 * 
 * Choose daily activity: work or learn.
 */

import { EconomicTracker } from '../core/tracker';

export interface DecideActivityParams {
  activity: 'work' | 'learn';
  reasoning: string;
}

export interface DecideActivityResult {
  success: boolean;
  activity?: string;
  reasoning?: string;
  message?: string;
  error?: string;
  valid_options?: string[];
  current_length?: number;
}

export function decideActivity(
  tracker: EconomicTracker,
  params: DecideActivityParams
): DecideActivityResult {
  const { activity, reasoning } = params;

  // Validate activity
  const validActivities = ['work', 'learn'];
  const normalizedActivity = activity?.toLowerCase()?.trim();

  if (!normalizedActivity || !validActivities.includes(normalizedActivity)) {
    return {
      success: false,
      error: "Invalid activity. Must be 'work' or 'learn'",
      valid_options: validActivities
    };
  }

  // Validate reasoning length
  if (!reasoning || reasoning.length < 50) {
    return {
      success: false,
      error: 'Reasoning must be at least 50 characters',
      current_length: reasoning?.length || 0
    };
  }

  // Return success with current balance info
  const balance = tracker.get_balance();
  const status = tracker.get_survival_status();

  return {
    success: true,
    activity: normalizedActivity,
    reasoning: reasoning,
    message: `Decision made: ${normalizedActivity.toUpperCase()}. Current balance: $${balance.toFixed(2)} (${status})`
  };
}

// Tool definition for OpenClaw
export const decideActivityTool = {
  name: 'decide_activity',
  description: 'Decide your daily activity: work or learn. Provide your choice and reasoning (at least 50 characters).',
  parameters: {
    type: 'object',
    properties: {
      activity: {
        type: 'string',
        enum: ['work', 'learn'],
        description: "Must be 'work' or 'learn'."
      },
      reasoning: {
        type: 'string',
        minLength: 50,
        description: 'Explanation for your decision (min 50 chars).'
      }
    },
    required: ['activity', 'reasoning']
  }
};
