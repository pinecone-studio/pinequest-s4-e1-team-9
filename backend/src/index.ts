import { Annotation, StateGraph } from '@langchain/langgraph';

const graphState = Annotation.Root({
  messages: Annotation<unknown[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
});

const workflow = new StateGraph(graphState);

// Add nodes and edges here

export const graph = workflow.compile();
