/**
 * ClawWork Tool: Get Status
 * 
 * Return the agent's current economic status.
 */

import { EconomicTracker } from '../core/tracker';

export interface GetStatusResult {
  balance: number;
  net_worth: number;
  daily_cost: number;
  session_cost: number;
  status: string;
  error?: string;
}

export async function getStatus(tracker: EconomicTracker | null): Promise<GetStatusResult> {
  if (!tracker) {
    return {
      balance: 0,
      net_worth: 0,
      daily_cost: 0,
      session_cost: 0,
      status: 'unknown',
      error: 'Economic tracker not available'
    };
  }

  return {
    balance: tracker.get_balance(),
    net_worth: tracker.get_net_worth(),
    daily_cost: tracker.get_daily_cost(),
    session_cost: tracker.get_session_cost(),
    status: tracker.get_survival_status()
  };
}

export const getStatusToolDefinition = {
  name: 'get_status',
  description: 'Get your current economic status and balance.',
  parameters: {
    type: 'object',
    properties: {},
    required: []
  }
};
