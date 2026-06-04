import { StateGraph } from "@langchain/langgraph";

// Define the state of the graph
const graphState = {
  messages: {
    value: (x: any, y: any) => x.concat(y),
    default: () => [],
  },
};

// Create the graph
const workflow = new StateGraph({
  channels: graphState,
});

// Add nodes and edges here

export const graph = workflow.compile();
