import {
  aiUseCaseTemplates,
  createDefaultConfiguration,
  getAiUseCaseTemplate,
  validateQuestions,
} from './templates';

describe('AI setup templates', () => {
  it('provides all required initial use cases', () => {
    expect(aiUseCaseTemplates.map((template) => template.id)).toEqual([
      'company_team',
      'education',
      'customer_support',
      'personal_knowledge',
      'custom',
    ]);
  });

  it('renders education-specific questions without customer support escalation defaults', () => {
    const education = getAiUseCaseTemplate('education');
    const questionIds = education.questions.map((question) => question.id);

    expect(questionIds).toContain('subject');
    expect(questionIds).toContain('avoidGradedAssignments');
    expect(questionIds).not.toContain('escalationBehavior');
  });

  it('renders customer support-specific escalation questions', () => {
    const support = getAiUseCaseTemplate('customer_support');
    const questionIds = support.questions.map((question) => question.id);

    expect(questionIds).toContain('escalationBehavior');
    expect(questionIds).toContain('restrictedTopics');
  });

  it('validates required questions with text errors', () => {
    const company = getAiUseCaseTemplate('company_team');
    const config = createDefaultConfiguration(company);
    const errors = validateQuestions(
      {
        ...config,
        organizationName: '',
        purpose: '',
      },
      company.questions,
    );

    expect(errors).toEqual(
      expect.objectContaining({
        organizationName: 'Company or team name is required.',
        purpose: 'What should this AI help people accomplish? is required.',
      }),
    );
  });

  it('creates independent default arrays for draft restoration', () => {
    const template = getAiUseCaseTemplate('custom');
    const first = createDefaultConfiguration(template);
    const second = createDefaultConfiguration(template);

    first.suggestedQuestions.push('Mutated question');

    expect(second.suggestedQuestions).not.toContain('Mutated question');
  });
});
