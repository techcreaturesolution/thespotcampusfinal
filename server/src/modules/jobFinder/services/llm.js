import OpenAI from 'openai';
import { jobFinderConfig } from '../config/jobFinder.config.js';

let client;
let aiRuntimeEnabled = true;

export function setAiEnabled(val) {
  aiRuntimeEnabled = Boolean(val);
}

export function llmConfigured() {
  return Boolean(jobFinderConfig.openaiApiKey);
}

export function llmEnabled() {
  return Boolean(jobFinderConfig.openaiApiKey) && aiRuntimeEnabled;
}

export async function llmJson(system, user, { maxTokens = 800 } = {}) {
  if (!llmEnabled()) return null;
  client ||= new OpenAI({ apiKey: jobFinderConfig.openaiApiKey });
  const res = await client.chat.completions.create({
    model: jobFinderConfig.openaiModel,
    temperature: 0.2,
    max_tokens: maxTokens,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  });
  const text = res.choices?.[0]?.message?.content;
  return text ? JSON.parse(text) : null;
}
