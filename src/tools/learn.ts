/**
 * ClawWork Tool: Learn
 * 
 * Learn something new and save it to the knowledge base.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface LearnParams {
  topic: string;
  knowledge: string;
}

export interface LearnResult {
  success: boolean;
  topic?: string;
  knowledge_length?: number;
  message?: string;
  error?: string;
  current_length?: number;
}

export interface ClawWorkStateForLearn {
  current_date: string | null;
  data_path: string;
}

export async function learn(
  state: ClawWorkStateForLearn,
  params: LearnParams
): Promise<LearnResult> {
  const { topic, knowledge } = params;

  // Validate knowledge length
  if (!knowledge || knowledge.length < 200) {
    return {
      success: false,
      error: 'Knowledge content too short. Minimum 200 characters required.',
      current_length: knowledge?.length || 0
    };
  }

  const dataPath = state.data_path;
  const date = state.current_date || new Date().toISOString().split('T')[0];

  // Ensure memory directory exists
  const memoryDir = path.join(dataPath, 'memory');
  fs.mkdirSync(memoryDir, { recursive: true });

  // Create memory entry
  const entry = {
    date: date,
    timestamp: new Date().toISOString(),
    topic: topic,
    knowledge: knowledge
  };

  // Append to memory file
  const memoryFile = path.join(memoryDir, 'memory.jsonl');
  fs.appendFileSync(memoryFile, JSON.stringify(entry, null, 0) + '\n', 'utf-8');

  return {
    success: true,
    topic: topic,
    knowledge_length: knowledge.length,
    message: `Learned about: ${topic}`
  };
}

export const learnToolDefinition = {
  name: 'learn',
  description: 'Learn something new and save it to your knowledge base. Knowledge must be at least 200 characters.',
  parameters: {
    type: 'object',
    properties: {
      topic: {
        type: 'string',
        description: 'Topic or title of what you learned.'
      },
      knowledge: {
        type: 'string',
        minLength: 200,
        description: 'Detailed knowledge content (min 200 chars).'
      }
    },
    required: ['topic', 'knowledge']
  }
};
