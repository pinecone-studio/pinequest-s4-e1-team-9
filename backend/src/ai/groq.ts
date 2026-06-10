import { ChatGroq } from '@langchain/groq';
import { env } from '../config/env.js';

export function createChatModel() {
  return new ChatGroq({
    model: env.groqChatModel,
    temperature: 0,
  });
}
