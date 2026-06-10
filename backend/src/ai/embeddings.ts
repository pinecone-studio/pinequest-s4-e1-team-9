import {
  GoogleGenerativeAIEmbeddings,
  type GoogleGenerativeAIEmbeddingsParams,
} from '@langchain/google-genai';
import { env, getGoogleApiKey } from '../config/env.js';

type GeminiTaskType = NonNullable<
  GoogleGenerativeAIEmbeddingsParams['taskType']
>;

const retrievalDocumentTaskType = 'RETRIEVAL_DOCUMENT' as GeminiTaskType;
const retrievalQueryTaskType = 'RETRIEVAL_QUERY' as GeminiTaskType;

let documentEmbeddings: GoogleGenerativeAIEmbeddings | null = null;
let queryEmbeddings: GoogleGenerativeAIEmbeddings | null = null;

function supportsEmbeddingTaskType(modelName: string) {
  const normalizedModelName = modelName.replace(/^models\//, '');

  return (
    normalizedModelName === 'embedding-001' ||
    normalizedModelName === 'gemini-embedding-001'
  );
}

function createEmbeddings(taskType?: GeminiTaskType) {
  const params: GoogleGenerativeAIEmbeddingsParams = {
    apiKey: getGoogleApiKey(),
    modelName: env.geminiEmbeddingModel,
  };

  if (taskType && supportsEmbeddingTaskType(env.geminiEmbeddingModel)) {
    params.taskType = taskType;
  }

  return new GoogleGenerativeAIEmbeddings(params);
}

export function getDocumentEmbeddings() {
  documentEmbeddings ??= createEmbeddings(retrievalDocumentTaskType);
  return documentEmbeddings;
}

export function getQueryEmbeddings() {
  queryEmbeddings ??= createEmbeddings(retrievalQueryTaskType);
  return queryEmbeddings;
}

export async function embedDocumentChunks(texts: string[]) {
  const concurrency = env.geminiEmbeddingConcurrency;
  const vectors: number[][] = [];
  let expectedDimensions: number | null = null;

  for (let start = 0; start < texts.length; start += concurrency) {
    const batch = texts.slice(start, start + concurrency);
    const batchVectors = await Promise.all(
      batch.map(async (text, batchIndex) => {
        const chunkIndex = start + batchIndex;
        const vector = await getDocumentEmbeddings().embedQuery(text);

        if (vector.length === 0) {
          throw new Error(
            `Gemini returned an empty embedding for chunk ${chunkIndex + 1}. Check GOOGLE_API_KEY, Gemini API access/quota, and GEMINI_EMBEDDING_MODEL.`,
          );
        }

        if (expectedDimensions === null) {
          expectedDimensions = vector.length;
        } else if (vector.length !== expectedDimensions) {
          throw new Error(
            `Gemini returned inconsistent embedding dimensions. Expected ${expectedDimensions}, got ${vector.length} for chunk ${chunkIndex + 1}.`,
          );
        }

        return vector;
      }),
    );

    vectors.push(...batchVectors);
    console.log(`Generated ${vectors.length}/${texts.length} embeddings...`);
  }

  return vectors;
}
