import type { LLMRole } from '../../types';
import { env, isLive } from '../../config';
import { generateOpenAI } from './openai';
import { generateClaude } from './claude';

/**
 * Role-routed LLM. 'cheap' → OpenAI (grunt work), 'writer' → Claude Sonnet.
 * Modules call liveFor(role) to decide between live generation and the
 * deterministic template path (so mocks never depend on the network).
 */
export interface LLM {
  liveFor(role: LLMRole): boolean;
  generate(args: {
    role: LLMRole; system: string; prompt: string;
    maxTokens?: number; temperature?: number;
    webSearch?: boolean; // Claude-only: enable live web search during generation
  }): Promise<string>;
}

function providerFor(role: LLMRole): 'openai' | 'claude' {
  if (role === 'writer') return env.llmWriterProvider === 'openai' ? 'openai' : 'claude';
  return env.llmCheapProvider === 'claude' ? 'claude' : 'openai';
}

export function getLLM(): LLM {
  return {
    liveFor(role) {
      const p = providerFor(role);
      return p === 'claude' ? isLive.claude() : isLive.openai();
    },
    async generate(args) {
      const p = providerFor(args.role);
      if (p === 'claude' && isLive.claude()) return generateClaude(args);
      if (p === 'openai' && isLive.openai()) return generateOpenAI(args);
      // Cross-fallback: if the preferred provider has no key but the other does.
      if (isLive.claude()) return generateClaude(args);
      if (isLive.openai()) return generateOpenAI(args);
      return ''; // no live LLM — caller uses its template path
    },
  };
}
