import type { ProviderEnhancement, ProviderInput, TaskPackProvider } from './types.js';

interface OpenAIChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

function buildPrompt(input: ProviderInput): string {
  return JSON.stringify(
    {
      repoContext: input.repoContext,
      parsedTask: input.parsedTask,
      heuristicTaskPack: input.heuristicTaskPack,
      instructions: [
        'Return JSON only.',
        'Prefer compact lists over long prose.',
        'Do not invent paths that are not in the repository context.',
        'Improve summary, path ranking, plan, and confidence where possible.',
      ],
    },
    null,
    2,
  );
}

export class OpenAIProvider implements TaskPackProvider {
  public readonly name = 'openai';

  public constructor(
    private readonly apiKey: string,
    private readonly model: string,
    private readonly baseUrl = 'https://api.openai.com/v1/chat/completions',
  ) {}

  public async enhance(input: ProviderInput): Promise<ProviderEnhancement> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You improve repository task packs. Return a single JSON object with only the fields that should override the heuristic task pack.',
          },
          {
            role: 'user',
            content: buildPrompt(input),
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as OpenAIChatCompletionResponse;
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI response did not include content');
    }

    return JSON.parse(content) as ProviderEnhancement;
  }
}
