import { Generated, Json, Timestamp } from "@docmost/db/types/db";

// embeddings type
export interface PageEmbeddings {
  attachmentId: string;
  chunkIndex: Generated<number>;
  chunkLength: Generated<number>;
  chunkStart: Generated<number>;
  createdAt: Generated<Timestamp>;
  deletedAt: Timestamp | null;
  embedding: number[];
  id: Generated<string>;
  metadata: Generated<Json>;
  modelDimensions: number;
  modelName: string;
  pageId: string;
  spaceId: string;
  updatedAt: Generated<Timestamp>;
  workspaceId: string;
}
