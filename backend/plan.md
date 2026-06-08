# 1-Week Internal Company Copilot Plan (Phase 1)

This plan outlines the steps to finalize a functional RAG-based copilot within one week, leveraging the existing Supabase, LangGraph, and OpenAI/Gemini foundation.

## Goal
Employees can ask questions about company documents and receive accurate answers with citations.

---

## Weekly Schedule

### Day 1: Foundation & Data Preparation
- [ ] **Database Setup:** Verify `documents` and `document_chunks` table schemas in Supabase (align with provided SQL). The current `prisma/schema.prisma` has a `documents` model, but it needs to be reconciled with the explicit `document_chunks` and `chat_messages` tables recommended for optimal RAG performance.
- [ ] **Data Sourcing:** Identify the first batch of high-priority PDFs and set up a local ingestion test pipeline.

### Day 2: Ingestion & Embedding Pipeline
- [ ] **Refine `ingest.ts`:** Ensure the PDF ingestion script correctly chunks content (800 token size, 150 overlap) and stores both chunks and embeddings in the appropriate Supabase tables.
- [ ] **Verify Embeddings:** Run the ingestion script on test PDFs and verify entries in Supabase.

### Day 3: RAG Retrieval Layer
- [ ] **Implement Retrieval:** Integrate the `SupabaseVectorStore` retriever into the chat flow.
- [ ] **Implement Context Injection:** Update `src/chatbot.ts` to take the user query, perform a vector search, retrieve the top 5 chunks, and inject them as context into the LLM prompt.

### Day 4: Chat Workflow & History
- [ ] **Add Chat History:** Update the `chat_messages` table and modify `generateChatResponse` to retrieve and include recent conversation history to provide better context.
- [ ] **LangGraph Workflow:** Transition from a simple function call to a minimal LangGraph node-based workflow for the RAG chain.

### Day 5: Citations & User Experience
- [ ] **Implement Citations:** Modify the LLM prompt to require citations based on the retrieved chunks (e.g., "Cite the document title for each fact").
- [ ] **Frontend Integration:** Ensure the frontend can properly display sources/citations provided by the backend.

### Days 6-7: Testing & Refinement
- [ ] **Query Testing:** Test with diverse questions (e.g., "What is the PTO policy?", "How do I deploy?").
- [ ] **Refinement:** Adjust chunking strategy or prompt if answers are inaccurate.
- [ ] **Security Review:** Ensure API keys and Supabase credentials are secure and not exposed.

---

## Technical Debt / Immediate Actions
1. **Schema Update:** Reconcile `prisma/schema.prisma` with the recommended `document_chunks` and `chat_messages` tables.
2. **Retrieval Integration:** Connect the existing `vectorStore` (in `src/ingest.ts`) to `src/chatbot.ts`.
3. **Prompt Engineering:** Refine the system prompt to enforce citation-based answers.
