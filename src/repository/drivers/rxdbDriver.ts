import type { RxCollection } from "rxdb";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { getDatabase } from "../../db";

// ─── interface ──────────────────────────────────────────────────────────────

export interface DbDriver {
  get<T>(id: string): Promise<T>;
  put<T extends { id?: string }>(doc: T): Promise<{ id: string }>;
  remove(id: string): Promise<void>;
  findAll<T>(): Promise<T[]>;
  observeAll<T>(): Observable<T[]>;
}

// ─── helpers ────────────────────────────────────────────────────────────────

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ─── driver ─────────────────────────────────────────────────────────────────

type CollectionName = "characters" | "threats" | "traits" | "skills";

/**
 * RxDB-backed implementation of DbDriver.
 * Lazily resolves the underlying RxCollection on first access via getDatabase().
 * Each instance wraps exactly one collection.
 */
export class RxDbDriver implements DbDriver {
  private collectionName: CollectionName;

  constructor(collectionName: CollectionName) {
    this.collectionName = collectionName;
  }

  private async getCollection(): Promise<RxCollection> {
    const db = await getDatabase();
    const col = (db as any)[this.collectionName] as RxCollection | undefined;
    if (!col) throw new Error(`Collection "${this.collectionName}" not found`);
    return col;
  }

  async get<T>(id: string): Promise<T> {
    const col = await this.getCollection();
    const doc = await col.findOne(id).exec();
    if (!doc) {
      const err = new Error("missing") as any;
      err.status = 404;
      throw err;
    }
    return doc.toJSON() as T;
  }

  async put<T extends { id?: string }>(doc: T): Promise<{ id: string }> {
    const col = await this.getCollection();
    const id = doc.id ?? uid();
    const now = new Date().toISOString();

    const payload: Record<string, unknown> = {
      ...doc,
      id,
      atualizadoEm: (doc as any).atualizadoEm ?? now,
      criadoEm: (doc as any).criadoEm ?? now,
    };

    await col.upsert(payload);
    return { id };
  }

  async remove(id: string): Promise<void> {
    const col = await this.getCollection();
    const doc = await col.findOne(id).exec();
    if (!doc) {
      const err = new Error("missing") as any;
      err.status = 404;
      throw err;
    }
    await doc.remove();
  }

  async findAll<T>(): Promise<T[]> {
    const col = await this.getCollection();
    const docs = await col.find().exec();
    return docs.map((d) => d.toJSON() as T);
  }

  observeAll<T>(): Observable<T[]> {
    return new Observable<T[]>((subscriber) => {
      let subscription: any;
      this.getCollection()
        .then((col) => {
          subscription = col
            .find()
            .$.pipe(map((docs) => docs.map((d) => d.toJSON() as T)))
            .subscribe(subscriber);
        })
        .catch((err) => subscriber.error(err));

      return () => {
        if (subscription) subscription.unsubscribe();
      };
    });
  }
}
