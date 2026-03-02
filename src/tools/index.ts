/**
 * ClawWork Tools
 * 
 * Export all economic tools for OpenClaw.
 */

export { decideActivity, decideActivityTool } from './decide_activity';
export type { DecideActivityParams, DecideActivityResult } from './decide_activity';

export { submitWork, submitWorkToolDefinition } from './submit_work';
export type { SubmitWorkParams, SubmitWorkResult, ClawWorkState } from './submit_work';

export { learn, learnToolDefinition } from './learn';
export type { LearnParams, LearnResult, ClawWorkStateForLearn } from './learn';

export { getStatus, getStatusToolDefinition } from './get_status';
export type { GetStatusResult } from './get_status';

import { decideActivityTool } from './decide_activity';
import { submitWorkToolDefinition } from './submit_work';
import { learnToolDefinition } from './learn';
import { getStatusToolDefinition } from './get_status';

/**
 * All ClawWork tool definitions for registration
 */
export const clawWorkToolDefinitions = [
  decideActivityTool,
  submitWorkToolDefinition,
  learnToolDefinition,
  getStatusToolDefinition
];
