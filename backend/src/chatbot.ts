import { Annotation, StateGraph, START, END } from '@langchain/langgraph';
import {
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages'; // 🛠️ FIX: Removed the trailing '.js' to align with NodeNext subpath exports map
import { Document } from '@langchain/core/documents';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ingestPDF, vectorStore } from './ingest.js';

// 1. Explicitly define the TypeScript Interface for your state
interface IChatState {
  messages: BaseMessage[];
  pdfContext: string;
}

// Define Graph State using the interface
const ChatState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  pdfContext: Annotation<string>({
    reducer: (x, y) => y,
    default: () => '',
  }),
});

// 2. Define Node: Retrieve matching snippets from the PDF
async function retrieveNode(state: IChatState) {
  // Safe array access
  const lastUserMessage = state.messages[state.messages.length - 1]
    ?.content as string;

  if (!lastUserMessage) {
    return { pdfContext: '' };
  }

  // Query the vector store
  const retriever = vectorStore.asRetriever({ k: 3 });
  const relevantDocs: Document[] = await retriever.invoke(lastUserMessage);

  // Combine matching text snippets into a single context string
  const contextText = relevantDocs.map((doc) => doc.pageContent).join('\n\n');

  return { pdfContext: contextText };
}

// 3. Define Node: Generate Answer using LLM + Context
const model = new ChatGoogleGenerativeAI({
  model: 'gemini-2.5-flash',
  temperature: 0,
});

async function answerNode(state: IChatState) {
  const systemPrompt = `You are an AI assistant analyzing a PDF document. 
Answer the user's question using ONLY the provided PDF context below. If the answer cannot be found in the context, say "I cannot find that information in the uploaded document."

---
PDF CONTEXT:
${state.pdfContext}
---`;

  // 🛠️ FIX: Format all messages into clean, explicit plain objects
  const completeMessages = [
    { role: 'system', content: systemPrompt },
    ...state.messages.map((msg) => ({
      role: msg._getType() === 'human' ? 'user' : 'assistant',
      content: msg.content,
    })),
  ];

  // TypeScript will now cleanly accept this plain object array
  const response = await model.invoke(completeMessages);
  return { messages: [response] };
}
// 4. Assemble the Graph Structure
const workflow = new StateGraph(ChatState)
  .addNode('retrieve', retrieveNode)
  .addNode('answer', answerNode)
  .addEdge(START, 'retrieve')
  .addEdge('retrieve', 'answer')
  .addEdge('answer', END);

const chatbotApp = workflow.compile();

// --- 5. Execution Runner Loop ---
async function main() {
  try {
    await ingestPDF('./sample.pdf');
  } catch (error) {
    console.warn(
      'Could not ingest sample.pdf. Proceeding with existing data if any.',
      error,
    );
  }

  const thread = {
    messages: [
      new HumanMessage('What are the core conclusions of this document?'),
    ],
  };

  console.log('\n🤖 Thinking...');
  const output = await chatbotApp.invoke(thread);

  const finalAnswer = output.messages[output.messages.length - 1].content;
  console.log(`\n💬 Assistant:\n${finalAnswer}`);
}

main().catch(console.error);
