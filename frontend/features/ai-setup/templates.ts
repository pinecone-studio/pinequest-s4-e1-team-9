import type { AiConfiguration } from '@/features/companies/types';

export type AiUseCaseId =
  | 'company_team'
  | 'education'
  | 'customer_support'
  | 'personal_knowledge'
  | 'custom';

export type AiSetupInputType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'tags';

export type AiSetupQuestion = {
  id: keyof AiConfiguration;
  label: string;
  description?: string;
  placeholder?: string;
  inputType: AiSetupInputType;
  required?: boolean;
  options?: string[];
};

export type AiConfigurationDefaults = AiConfiguration;

export type AiUseCaseTemplate = {
  id: AiUseCaseId;
  label: string;
  description: string;
  icon: string;
  exampleUse: string;
  questions: AiSetupQuestion[];
  defaults: AiConfigurationDefaults;
};

const missingAnswerBehavior =
  'Say the answer is not available in the uploaded documents and suggest what source would help.';

const toneOptions = [
  'Professional',
  'Approachable',
  'Conversational',
  'Formal',
  'Encouraging',
];

const languageOptions = ['Auto', 'English', 'Mongolian', 'Spanish', 'French'];
const responseLengthOptions = ['Brief', 'Balanced', 'Detailed'];

const sharedBehaviorQuestions: AiSetupQuestion[] = [
  {
    id: 'tone',
    label: 'Response tone',
    description: 'Choose the default voice people should hear from this AI.',
    inputType: 'select',
    options: toneOptions,
    required: true,
  },
  {
    id: 'language',
    label: 'Default language',
    description: 'The AI can still follow a user request to switch languages.',
    inputType: 'select',
    options: languageOptions,
    required: true,
  },
  {
    id: 'responseLength',
    label: 'Answer length',
    inputType: 'select',
    options: responseLengthOptions,
    required: true,
  },
  {
    id: 'requireCitations',
    label: 'Include sources for factual answers',
    description: 'Recommended for document-backed assistants.',
    inputType: 'checkbox',
  },
  {
    id: 'missingAnswerBehavior',
    label: 'When the documents do not contain the answer',
    inputType: 'textarea',
    required: true,
    placeholder:
      'Say the available documents do not answer this and suggest the next best source.',
  },
];

function defaults(
  input: Pick<
    AiConfiguration,
    | 'useCaseType'
    | 'aiName'
    | 'description'
    | 'purpose'
    | 'audience'
    | 'tone'
    | 'language'
    | 'responseLength'
    | 'welcomeMessage'
    | 'suggestedQuestions'
  > &
    Partial<AiConfiguration>,
): AiConfiguration {
  return {
    requireCitations: true,
    missingAnswerBehavior,
    restrictedTopics: ['Do not invent facts that are not in the documents.'],
    ...input,
  };
}

export const aiUseCaseTemplates: AiUseCaseTemplate[] = [
  {
    id: 'company_team',
    label: 'Company or Team',
    description: 'Internal policies, processes, handbooks, and team knowledge.',
    icon: 'Building2',
    exampleUse: 'HR policy assistant for employees',
    defaults: defaults({
      useCaseType: 'company_team',
      aiName: 'Team Knowledge Assistant',
      description: 'Helps team members find answers in internal documents.',
      purpose: 'Help people understand internal documents and procedures.',
      audience: 'Employees and internal team members',
      tone: 'Professional',
      language: 'Auto',
      responseLength: 'Balanced',
      welcomeMessage:
        'Ask me about the uploaded company documents and I will answer with sources.',
      suggestedQuestions: [
        'What policies should new employees read first?',
        'What does the handbook say about time off?',
        'Summarize the process for this topic.',
      ],
    }),
    questions: [
      {
        id: 'organizationName',
        label: 'Company or team name',
        inputType: 'text',
        required: true,
        placeholder: 'Acme Corporation',
      },
      {
        id: 'department',
        label: 'Department or business area',
        inputType: 'select',
        options: [
          'Human Resources',
          'Legal',
          'Engineering',
          'Sales',
          'Operations',
          'Internal knowledge',
          'Customer support',
          'Other',
        ],
      },
      {
        id: 'purpose',
        label: 'What should this AI help people accomplish?',
        inputType: 'textarea',
        required: true,
        placeholder: 'Help employees understand policies and find procedures.',
      },
      {
        id: 'audience',
        label: 'Who will use it?',
        inputType: 'text',
        required: true,
        placeholder: 'Employees, managers, and new hires',
      },
      {
        id: 'restrictedTopics',
        label: 'What should it avoid?',
        description: 'Add topics that require caution or another team.',
        inputType: 'tags',
        placeholder: 'Legal advice, payroll disputes, unsupported policies',
      },
      ...sharedBehaviorQuestions,
    ],
  },
  {
    id: 'education',
    label: 'Education or Classroom',
    description: 'Course materials, lesson notes, readings, and study help.',
    icon: 'GraduationCap',
    exampleUse: 'Grade 10 biology tutor',
    defaults: defaults({
      useCaseType: 'education',
      aiName: 'Course Study Assistant',
      description: 'Helps learners understand uploaded course materials.',
      purpose: 'Support learning from class documents without replacing instruction.',
      audience: 'Students and teachers',
      tone: 'Encouraging',
      language: 'Auto',
      responseLength: 'Balanced',
      welcomeMessage:
        'Ask me about the uploaded course materials and I will help you study.',
      suggestedQuestions: [
        'Explain the main idea from this lesson.',
        'Create a practice question from the reading.',
        'Summarize the important terms.',
      ],
      shouldExplainStepByStep: true,
      canGenerateExamples: true,
      canCreateQuizzes: true,
      avoidGradedAssignments: true,
    }),
    questions: [
      {
        id: 'organizationName',
        label: 'School, class, or course name',
        inputType: 'text',
        required: true,
        placeholder: 'Grade 10 Biology',
      },
      {
        id: 'subject',
        label: 'Subject',
        inputType: 'text',
        required: true,
        placeholder: 'Biology, history, algebra',
      },
      {
        id: 'educationLevel',
        label: 'Learner level',
        inputType: 'text',
        placeholder: 'High school, undergraduate, beginner',
      },
      {
        id: 'audience',
        label: 'Who will use it?',
        inputType: 'select',
        options: ['Students', 'Teachers', 'Students and teachers'],
        required: true,
      },
      {
        id: 'purpose',
        label: 'Learning goal',
        inputType: 'textarea',
        required: true,
        placeholder: 'Help students review lessons and practice concepts.',
      },
      {
        id: 'shouldExplainStepByStep',
        label: 'Explain step by step when useful',
        inputType: 'checkbox',
      },
      {
        id: 'canGenerateExamples',
        label: 'Generate examples from the material',
        inputType: 'checkbox',
      },
      {
        id: 'canCreateQuizzes',
        label: 'Create quizzes or practice questions',
        inputType: 'checkbox',
      },
      {
        id: 'avoidGradedAssignments',
        label: 'Avoid directly completing graded assignments',
        inputType: 'checkbox',
      },
      ...sharedBehaviorQuestions,
    ],
  },
  {
    id: 'customer_support',
    label: 'Customer Support',
    description: 'Product documentation, troubleshooting, and help-center PDFs.',
    icon: 'Headphones',
    exampleUse: 'Support assistant for a SaaS product',
    defaults: defaults({
      useCaseType: 'customer_support',
      aiName: 'Support Assistant',
      description: 'Helps customers answer product and troubleshooting questions.',
      purpose: 'Resolve common customer questions using approved documentation.',
      audience: 'Customers and support team members',
      tone: 'Approachable',
      language: 'Auto',
      responseLength: 'Balanced',
      welcomeMessage:
        'Ask me about the uploaded support documents and I will help troubleshoot.',
      suggestedQuestions: [
        'How do I solve a common setup issue?',
        'Where is this feature documented?',
        'When should I contact support?',
      ],
      escalationBehavior:
        'Recommend contacting a human for account-specific, billing, legal, or unsafe issues.',
    }),
    questions: [
      {
        id: 'organizationName',
        label: 'Company or product name',
        inputType: 'text',
        required: true,
        placeholder: 'PineQuest',
      },
      {
        id: 'audience',
        label: 'Who are the customers?',
        inputType: 'text',
        required: true,
        placeholder: 'Small business admins, developers, students',
      },
      {
        id: 'purpose',
        label: 'Common problems it should solve',
        inputType: 'textarea',
        required: true,
      },
      {
        id: 'escalationBehavior',
        label: 'When should it recommend a human?',
        inputType: 'textarea',
        required: true,
      },
      {
        id: 'restrictedTopics',
        label: 'Topics that require escalation',
        inputType: 'tags',
        placeholder: 'Billing disputes, account deletion, legal claims',
      },
      ...sharedBehaviorQuestions,
    ],
  },
  {
    id: 'personal_knowledge',
    label: 'Personal Knowledge Base',
    description: 'Private research, notes, manuals, records, and reference PDFs.',
    icon: 'Library',
    exampleUse: 'Personal research assistant',
    defaults: defaults({
      useCaseType: 'personal_knowledge',
      aiName: 'Personal Research Assistant',
      description: 'Helps organize and answer questions from personal documents.',
      purpose: 'Summarize, explain, and retrieve information from personal PDFs.',
      audience: 'Me and people I explicitly invite',
      tone: 'Conversational',
      language: 'Auto',
      responseLength: 'Balanced',
      welcomeMessage:
        'Ask me about your uploaded documents and I will help connect the dots.',
      suggestedQuestions: [
        'Summarize the most important notes.',
        'What documents mention this topic?',
        'Explain this concept using my documents.',
      ],
      visibility: 'Private',
      answerMode: 'Direct answers with concise summaries',
    }),
    questions: [
      {
        id: 'knowledgeScope',
        label: 'What knowledge is being organized?',
        inputType: 'textarea',
        required: true,
        placeholder: 'Research papers, manuals, notes, and reference material.',
      },
      {
        id: 'purpose',
        label: 'What will this AI help you accomplish?',
        inputType: 'textarea',
        required: true,
      },
      {
        id: 'visibility',
        label: 'Access model',
        inputType: 'select',
        options: ['Private', 'Shared with invited members'],
        required: true,
      },
      {
        id: 'answerMode',
        label: 'Preferred answer style',
        inputType: 'select',
        options: ['Direct answers', 'Summaries', 'Explanations', 'Mixed'],
      },
      ...sharedBehaviorQuestions,
    ],
  },
  {
    id: 'custom',
    label: 'Custom',
    description: 'A flexible assistant for a use case that does not fit above.',
    icon: 'SlidersHorizontal',
    exampleUse: 'Custom policy, research, or operations assistant',
    defaults: defaults({
      useCaseType: 'custom',
      aiName: 'Document Assistant',
      description: 'Answers questions using the uploaded documents.',
      purpose: 'Help users find reliable answers in the knowledge base.',
      audience: 'Authorized members',
      tone: 'Professional',
      language: 'Auto',
      responseLength: 'Balanced',
      welcomeMessage:
        'Ask me about the uploaded documents and I will answer from the available sources.',
      suggestedQuestions: [
        'What do these documents say about this topic?',
        'Summarize the relevant sections.',
        'Which source should I read next?',
      ],
    }),
    questions: [
      {
        id: 'purpose',
        label: "What is this AI's purpose?",
        inputType: 'textarea',
        required: true,
      },
      {
        id: 'audience',
        label: 'Who will use it?',
        inputType: 'text',
        required: true,
      },
      {
        id: 'restrictedTopics',
        label: 'What should it never do?',
        inputType: 'tags',
      },
      ...sharedBehaviorQuestions,
    ],
  },
];

export function getAiUseCaseTemplate(id: string | null | undefined) {
  return (
    aiUseCaseTemplates.find((template) => template.id === id) ??
    aiUseCaseTemplates[aiUseCaseTemplates.length - 1]
  );
}

export function createDefaultConfiguration(
  template: AiUseCaseTemplate,
): AiConfiguration {
  return {
    ...template.defaults,
    suggestedQuestions: [...template.defaults.suggestedQuestions],
    restrictedTopics: [...template.defaults.restrictedTopics],
  };
}

export function suggestAiName(configuration: Partial<AiConfiguration>) {
  const subject =
    configuration.organizationName ||
    configuration.subject ||
    configuration.knowledgeScope;

  if (subject && configuration.useCaseType === 'education') {
    return `${subject} Tutor`;
  }

  if (subject && configuration.useCaseType === 'customer_support') {
    return `${subject} Support Assistant`;
  }

  if (subject && configuration.useCaseType === 'company_team') {
    return `${subject} Assistant`;
  }

  return configuration.aiName || 'Document Assistant';
}

export function validateQuestions(
  configuration: Partial<AiConfiguration>,
  questions: AiSetupQuestion[],
) {
  const errors: Record<string, string> = {};

  for (const question of questions) {
    if (!question.required) {
      continue;
    }

    const value = configuration[question.id];
    const isMissing =
      value === undefined ||
      value === null ||
      (typeof value === 'string' && value.trim().length === 0);

    if (isMissing) {
      errors[question.id] = `${question.label} is required.`;
    }
  }

  return errors;
}
