import { describe, expect, it } from '@jest/globals';
import {
  buildAiSystemInstructions,
  createLegacyAiConfiguration,
  normalizeAiConfiguration,
} from './ai-configuration.js';

describe('AI configuration builder', () => {
  it('creates safe legacy defaults for companies without saved configuration', () => {
    const config = createLegacyAiConfiguration({
      name: 'Legacy Policy AI',
      description: null,
      useCaseType: 'custom',
    });

    expect(config).toEqual(
      expect.objectContaining({
        aiName: 'Legacy Policy AI',
        useCaseType: 'custom',
        tone: 'Professional',
        language: 'Auto',
        requireCitations: true,
      }),
    );
  });

  it('normalizes structured setup answers and trims arrays', () => {
    const config = normalizeAiConfiguration(
      {
        useCaseType: 'company_team',
        aiName: '  Acme HR Assistant  ',
        purpose: '  Explain HR policies. ',
        audience: ' Employees ',
        restrictedTopics: ['  payroll disputes ', '', 'legal advice'],
        suggestedQuestions: [' PTO policy? ', '', 'Benefits?'],
      },
      {
        name: 'Acme',
        description: null,
        useCaseType: 'company_team',
      },
    );

    expect(config).toEqual(
      expect.objectContaining({
        aiName: 'Acme HR Assistant',
        purpose: 'Explain HR policies.',
        audience: 'Employees',
        restrictedTopics: ['payroll disputes', 'legal advice'],
        suggestedQuestions: ['PTO policy?', 'Benefits?'],
      }),
    );
  });

  it('derives deterministic instructions from saved configuration', () => {
    const instructions = buildAiSystemInstructions(
      normalizeAiConfiguration(
        {
          useCaseType: 'education',
          aiName: 'Grade 10 Biology Tutor',
          purpose: 'Help students study course readings.',
          audience: 'Students',
          subject: 'Biology',
          tone: 'Encouraging',
          language: 'English',
          responseLength: 'Balanced',
          requireCitations: true,
          shouldExplainStepByStep: true,
          avoidGradedAssignments: true,
        },
        {
          name: 'Biology',
          description: null,
          useCaseType: 'education',
        },
      ),
    );

    expect(instructions).toContain('You are Grade 10 Biology Tutor.');
    expect(instructions).toContain('Subject: Biology');
    expect(instructions).toContain('Tone: Encouraging');
    expect(instructions).toContain('Do not directly complete graded assignments');
  });
});
