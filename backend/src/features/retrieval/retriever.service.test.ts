import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

const similaritySearch = jest.fn<() => Promise<unknown[]>>();

let retrieveRelevantDocuments: typeof import(
  './retriever.service.js'
).retrieveRelevantDocuments;

describe('retrieveRelevantDocuments', () => {
  beforeAll(async () => {
    jest.doMock('./vector-store.js', () => ({
      getVectorStore: () => ({
        similaritySearch,
      }),
    }));
    ({ retrieveRelevantDocuments } = await import('./retriever.service.js'));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('filters vector search by company id', async () => {
    similaritySearch.mockResolvedValue([
      {
        pageContent: 'Company scoped content',
        metadata: { company_id: 'company-1' },
      },
    ]);

    await retrieveRelevantDocuments('policy', {
      userId: 'user-1',
      companyId: 'company-1',
    });

    expect(similaritySearch).toHaveBeenCalledWith('policy', 5, {
      company_id: 'company-1',
    });
  });

  it('keeps optional document filters inside the same company scope', async () => {
    similaritySearch.mockResolvedValue([]);

    await retrieveRelevantDocuments('policy', {
      userId: 'user-1',
      companyId: 'company-1',
      documentId: 'document-1',
    });

    expect(similaritySearch).toHaveBeenCalledWith('policy', 5, {
      company_id: 'company-1',
      document_id: 'document-1',
    });
  });

  it('rejects retrieval without a company id', async () => {
    await expect(
      retrieveRelevantDocuments('policy', {
        userId: 'user-1',
        companyId: '',
      }),
    ).rejects.toThrow('Retrieval requires a company id.');
  });
});
