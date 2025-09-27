import { logIssue } from "../contract";

export interface QueuedLog {
  id: string; // report id
  location: string;
  description: string;
  status: string;
  imageUrl?: string;
  reporterEmail?: string;
  attempts?: number;
  lastError?: string;
  createdAt: number;
}

const STORAGE_KEY = "nagarsetu_blockchain_queue";

function readQueue(): QueuedLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as QueuedLog[];
  } catch (e) {
    console.error("Failed to read blockchain retry queue:", e);
    return [];
  }
}

function writeQueue(queue: QueuedLog[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error("Failed to write blockchain retry queue:", e);
  }
}

export const BlockchainRetryService = {
  enqueue: (entry: Omit<QueuedLog, "attempts" | "lastError" | "createdAt">) => {
    const queue = readQueue();
    const item: QueuedLog = {
      ...entry,
      attempts: 0,
      lastError: undefined,
      createdAt: Date.now(),
    };
    queue.push(item);
    writeQueue(queue);
    return item;
  },

  dequeue: (id: string) => {
    const queue = readQueue();
    const newQueue = queue.filter((q) => q.id !== id);
    writeQueue(newQueue);
    return newQueue;
  },

  list: (): QueuedLog[] => {
    return readQueue();
  },

  retryAll: async () => {
    const queue = readQueue();
    for (const item of queue) {
      try {
        await logIssue(
          item.id,
          item.location,
          item.description,
          item.status,
          item.imageUrl || "",
          0,
          item.reporterEmail || ""
        );
        // on success remove
        BlockchainRetryService.dequeue(item.id);
      } catch (e: any) {
        console.error("Retry failed for", item.id, e);
        item.attempts = (item.attempts || 0) + 1;
        item.lastError = e?.message || String(e);
      }
    }
    writeQueue(readQueue());
  },
};
