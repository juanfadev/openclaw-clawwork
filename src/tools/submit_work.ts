/**
 * ClawWork Tool: Submit Work
 * 
 * Submit completed work for evaluation and payment.
 */

import * as fs from 'fs';
import * as path from 'path';
import { EconomicTracker } from '../core/tracker';
import { TaskInfo } from '../core/types';

export interface SubmitWorkParams {
  work_output?: string;
  artifact_file_paths?: string[];
}

export interface SubmitWorkResult {
  success?: boolean;
  accepted: boolean;
  payment: number;
  actual_payment: number;
  feedback: string;
  evaluation_score: number;
  artifact_paths?: string[];
  error?: string;
  missing_files?: string[];

  current_length?: number;
}

export interface ClawWorkState {
  economic_tracker: EconomicTracker;
  current_task: TaskInfo | null;
  current_date: string | null;
  signature: string;
  data_path: string;
}

// Mock evaluator - in production this would call an LLM
function mockEvaluate(
  _signature: string,
  _task: TaskInfo,
  artifactPaths: string[],
  _description: string
): [boolean, number, string, number] {
  // Simulate evaluation
  const evaluationScore = 0.75 + (Math.random() * 0.2); // 0.75-0.95
  
  // Check if files exist
  const filesExist = artifactPaths.length > 0 && artifactPaths.every(p => {
    try {
      return fs.existsSync(p);
    } catch {
      return false;
    }
  });
  
  if (!filesExist && artifactPaths.length > 0) {
    return [false, 0, 'Some artifact files not found', 0];
  }
  
  const accepted = evaluationScore >= 0.6;
  const feedback = accepted
    ? `Good work! Evaluation score: ${evaluationScore.toFixed(2)}. Payment approved.`
    : `Work did not meet quality threshold (score: ${evaluationScore.toFixed(2)} < 0.6). No payment.`;
  
  return [accepted, evaluationScore, feedback, evaluationScore];
}

export async function submitWork(
  state: ClawWorkState,
  params: SubmitWorkParams
): Promise<SubmitWorkResult> {
  const { work_output, artifact_file_paths } = params;

  // Normalize artifact_file_paths
  let artifactPaths: string[] = [];
  if (artifact_file_paths) {
    if (Array.isArray(artifact_file_paths)) {
      artifactPaths = artifact_file_paths;
    } else if (typeof artifact_file_paths === 'string') {
      try {
        const parsed = JSON.parse(artifact_file_paths);
        artifactPaths = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        return {
          accepted: false,
          payment: 0,
          actual_payment: 0,
          feedback: '',
          evaluation_score: 0,
          error: 'Invalid JSON for artifact_file_paths'
        };
      }
    }
  }

  // Must have at least one of text or files
  if (!work_output && artifactPaths.length === 0) {
    return {
      accepted: false,
      payment: 0,
      actual_payment: 0,
      feedback: '',
      evaluation_score: 0,
      error: 'Must provide either work_output or artifact_file_paths, or both'
    };
  }

  // Length check when text-only
  if (work_output && artifactPaths.length === 0 && work_output.length < 100) {
    return {
      accepted: false,
      payment: 0,
      actual_payment: 0,
      feedback: '',
      evaluation_score: 0,
      error: 'Work output too short (min 100 chars when no files provided).',
      current_length: work_output.length
    };
  }

  // Get task from state
  const task = state.current_task;
  const date = state.current_date;
  const signature = state.signature;
  const tracker = state.economic_tracker;
  const dataPath = state.data_path;

  if (!task) {
    return {
      accepted: false,
      payment: 0,
      actual_payment: 0,
      feedback: '',
      evaluation_score: 0,
      error: 'No task assigned for today'
    };
  }

  // Build artifact list
  const allArtifactPaths: string[] = [];

  // Save text work output to file
  if (work_output) {
    const workDir = path.join(dataPath, 'work');
    fs.mkdirSync(workDir, { recursive: true });
    const textPath = path.join(workDir, `${date}_${task.taskId}.txt`);
    fs.writeFileSync(textPath, work_output, 'utf-8');
    allArtifactPaths.push(textPath);
  }

  // Verify provided files exist
  if (artifactPaths.length > 0) {
    const missing = artifactPaths.filter(p => !fs.existsSync(p));
    if (missing.length > 0) {
      return {
        accepted: false,
        payment: 0,
        actual_payment: 0,
        feedback: '',
        evaluation_score: 0,
        error: `Some artifact files not found: ${missing.join(', ')}`,
        missing_files: missing
      };
    }
    allArtifactPaths.push(...artifactPaths);
  }

  // Evaluate work (using mock evaluator)
  const description = `Work submission with ${allArtifactPaths.length} artifact(s)`;
  const [accepted, payment, feedback, evaluationScore] = mockEvaluate(
    signature,
    task,
    allArtifactPaths,
    description
  );

  // Record income (cliff at 0.6 applied inside tracker)
  const actualPayment = tracker.add_work_income(
    payment * task.max_payment, // Scale by task value
    task.taskId,
    evaluationScore
  );

  const result: SubmitWorkResult = {
    accepted,
    payment: payment * task.max_payment,
    actual_payment: actualPayment,
    feedback,
    evaluation_score: evaluationScore,
    artifact_paths: allArtifactPaths
  };

  if (actualPayment > 0) {
    result.success = true;
  }

  return result;
}

export const submitWorkToolDefinition = {
  name: 'submit_work',
  description: 'Submit completed work for evaluation and payment. Provide text output (min 100 chars if no files) and/or a list of artifact file paths.',
  parameters: {
    type: 'object',
    properties: {
      work_output: {
        type: 'string',
        description: 'Your completed work as text (min 100 chars if no artifact_file_paths provided).'
      },
      artifact_file_paths: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional list of absolute file paths to artifacts you created (e.g. Excel, PDF, Python scripts).'
      }
    },
    required: []
  }
};
