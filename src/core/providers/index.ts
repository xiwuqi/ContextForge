import { OpenAIProvider } from './openai.js';
import type { TaskPackProvider } from './types.js';

export function createProviderFromEnvironment(): TaskPackProvider | null {
  const providerName = process.env.CONTEXTFORGE_PROVIDER;
  if (!providerName) {
    return null;
  }

  if (providerName !== 'openai') {
    return null;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
  return new OpenAIProvider(apiKey, model);
}

export * from './types.js';
