/**
 * ClawWork Task Classifier
 * 
 * Classifies instructions into occupations and estimates task value.
 * Uses keyword matching against occupations.json.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface Occupation {
  occupation: string;
  hourly_wage: number;
  keywords: string[];
}

export interface ClassificationResult {
  occupation: string;
  hourly_wage: number;
  hours_estimate: number;
  task_value: number;
  reasoning: string;
}

// Default fallback occupation
const DEFAULT_OCCUPATION: Occupation = {
  occupation: 'General and Operations Managers',
  hourly_wage: 50.00,
  keywords: ['manage', 'operations', 'general', 'business']
};

export class TaskClassifier {
  private occupations: Occupation[];

  constructor(occupationsPath?: string) {
    const defaultPath = path.join(__dirname, '..', 'data', 'occupations.json');
    const filePath = occupationsPath || defaultPath;
    
    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      this.occupations = JSON.parse(data) as Occupation[];
    } catch (error) {
      console.warn(`Failed to load occupations from ${filePath}, using default`);
      this.occupations = [DEFAULT_OCCUPATION];
    }
  }

  /**
   * Classify an instruction into an occupation and estimate task value
   * Uses simple keyword matching against occupations.json
   */
  classify(instruction: string): ClassificationResult {
    // Normalize instruction to lowercase
    const normalizedInstruction = instruction.toLowerCase();
    
    // Find best matching occupation
    const bestMatch = this.findBestMatch(normalizedInstruction);
    
    // Estimate hours based on instruction complexity
    const hours_estimate = this.estimateHours(instruction);
    
    // Calculate task value
    const task_value = Math.round(hours_estimate * bestMatch.hourly_wage * 100) / 100;
    
    // Generate reasoning
    const reasoning = this.generateReasoning(bestMatch, hours_estimate, task_value);
    
    return {
      occupation: bestMatch.occupation,
      hourly_wage: bestMatch.hourly_wage,
      hours_estimate,
      task_value,
      reasoning
    };
  }

  /**
   * Find the best matching occupation based on keyword matches
   */
  private findBestMatch(instruction: string): Occupation {
    let bestOccupation: Occupation = DEFAULT_OCCUPATION;
    let bestScore = 0;
    
    for (const occ of this.occupations) {
      const score = this.scoreOccupation(instruction, occ);
      if (score > bestScore) {
        bestScore = score;
        bestOccupation = occ;
      }
    }
    
    return bestOccupation;
  }

  /**
   * Score an occupation based on keyword matches
   */
  private scoreOccupation(instruction: string, occupation: Occupation): number {
    let score = 0;
    
    for (const keyword of occupation.keywords) {
      if (instruction.includes(keyword.toLowerCase())) {
        score += 1;
      }
    }
    
    return score;
  }

  /**
   * Estimate hours based on instruction length and complexity
   */
  private estimateHours(instruction: string): number {
    const length = instruction.length;
    
    // Simple heuristic:
    // - Short (<50 chars) = 1 hour
    // - Medium (50-200 chars) = 2-4 hours
    // - Long (>200 chars) = 4-8 hours
    
    if (length < 50) {
      return 1;
    } else if (length < 100) {
      return 2;
    } else if (length < 200) {
      return 3;
    } else if (length < 400) {
      return 5;
    } else {
      return 8;
    }
  }

  /**
   * Generate human-readable reasoning for the classification
   */
  private generateReasoning(
    occupation: Occupation,
    hours: number,
    value: number
  ): string {
    return `Classified as "${occupation.occupation}" based on keyword matching. ` +
           `Estimated ${hours} hour(s) of work at $${occupation.hourly_wage.toFixed(2)}/hr = $${value.toFixed(2)} max payment.`;
  }

  /**
   * Get all available occupations
   */
  getOccupations(): Occupation[] {
    return [...this.occupations];
  }

  /**
   * Add a custom occupation
   */
  addOccupation(occupation: Occupation): void {
    this.occupations.push(occupation);
  }
}

// Export factory function
export function createClassifier(occupationsPath?: string): TaskClassifier {
  return new TaskClassifier(occupationsPath);
}
