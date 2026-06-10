import { Annotation, StateGraph } from '@langchain/langgraph';

const graphState = Annotation.Root({
  messages: Annotation<unknown[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
});

const workflow = new StateGraph(graphState);

// Placeholder for future LangGraph orchestration. The HTTP API is the real
// backend entrypoint today.
export const graph = workflow.compile();
