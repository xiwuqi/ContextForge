import type { RepoContext, TaskPack } from '../schema/index.js';

export interface ProviderInput {
  repoContext: RepoContext;
  taskMarkdown: string;
  parsedTask: {
    title: string;
    summary: string;
    objective: string;
    constraints: string[];
    validationCommands: string[];
    doneWhen: string[];
  };
  heuristicTaskPack: TaskPack;
}

export type ProviderEnhancement = Partial<
  Pick<
    TaskPack,
    | 'objective'
    | 'userRequestSummary'
    | 'relevantPaths'
    | 'relevantFiles'
    | 'possiblyRelatedPaths'
    | 'constraints'
    | 'assumptions'
    | 'risks'
    | 'validationCommands'
    | 'doneWhen'
    | 'implementationPlan'
    | 'openQuestions'
    | 'confidence'
  >
>;

export interface TaskPackProvider {
  name: string;
  enhance(input: ProviderInput): Promise<ProviderEnhancement>;
}
