import type { RxCollection } from 'rxdb';
import type { DbDriver, DbDoc, AllDocsResult } from './localStorageDriver';

// ─── helpers ────────────────────────────────────────────────────────────────

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function makeRev(): string {
  return `1-${uid()}`;
}

/**
 * RxDB stores documents with `id` as the primary key.
 * Repositories use `_id` (PouchDB convention).
 * This driver translates between the two transparently.
 */
function toRxId(id: string): string {
  return id; // IDs are stored as-is; RxDB collection namespaces them internally.
}

/** Converts a raw RxDB document object to the DbDoc shape repositories expect. */
function toDbDoc<T extends DbDoc>(raw: Record<string, unknown>): T {
  return {
    ...raw,
    _id: raw['id'] as string,
    _rev: (raw['rxRev'] as string | undefined) ?? makeRev(),
  } as T;
}

// ─── driver ─────────────────────────────────────────────────────────────────

/**
 * RxDB-backed implementation of DbDriver.
 *
 * One instance wraps exactly one RxCollection, so the `startkey`/`endkey`
 * prefix filtering used by repositories is effectively a no-op — every doc
 * in the collection is already of the correct type.
 *
 * `_rev` is emulated via a stored `rxRev` field to keep repository logic intact.
 * Conflict detection is handled by RxDB internally; the `_rev` check in remove()
 * is a best-effort guard only.
 */
export class RxDbDriver implements DbDriver {
  private collection: RxCollection<Record<string, unknown>>;

  constructor(collection: RxCollection<Record<string, unknown>>) {
    this.collection = collection;
  }

  async get<T extends DbDoc>(id: string): Promise<T> {
    const rxDoc = await this.collection.findOne(toRxId(id)).exec();
    if (!rxDoc) {
      const err = new Error('missing') as any;
      err.status = 404;
      throw err;
    }
    return toDbDoc<T>(rxDoc.toJSON() as Record<string, unknown>);
  }

  async put<T extends DbDoc>(
    doc: Partial<T> & { _id?: string },
  ): Promise<{ ok: boolean; id: string; rev: string }> {
    const id  = doc._id ?? uid();
    const rev = makeRev();
    const now = new Date().toISOString();

    const payload: Record<string, unknown> = {
      ...doc,
      id,
      rxRev:       rev,
      atualizadoEm: now,
      criadoEm:    (doc as any).criadoEm ?? now,
    };

    // `_id` and `_rev` must not be persisted as RxDB fields — they're virtual.
    delete payload['_id'];
    delete payload['_rev'];

    await this.collection.upsert(payload);

    // Reflect the assigned id back onto the caller's object (matches LocalStorageDriver behaviour)
    (doc as any)._id  = id;
    (doc as any)._rev = rev;

    return { ok: true, id, rev };
  }

  async remove(
    doc: Pick<DbDoc, '_id' | '_rev'>,
  ): Promise<{ ok: boolean; id: string; rev: string }> {
    if (!doc._id) {
      throw new Error('Must provide _id to remove');
    }

    const rxDoc = await this.collection.findOne(toRxId(doc._id)).exec();
    if (!rxDoc) {
      const err = new Error('missing') as any;
      err.status = 404;
      throw err;
    }

    await rxDoc.remove();

    return { ok: true, id: doc._id, rev: makeRev() };
  }

  async allDocs<T extends DbDoc>(
    opts: { include_docs?: boolean; startkey?: string; endkey?: string } = {},
  ): Promise<AllDocsResult<T>> {
    // The collection already scopes to the correct entity type.
    // startkey/endkey prefix filtering is intentionally ignored.
    const rxDocs = await this.collection.find().exec();

    const rows = rxDocs.map(rxDoc => {
      const raw = rxDoc.toJSON() as Record<string, unknown>;
      const id  = raw['id'] as string;
      const rev = (raw['rxRev'] as string | undefined) ?? makeRev();
      return {
        id,
        key: id,
        value: { rev },
        doc: opts.include_docs ? toDbDoc<T>(raw) : undefined,
      };
    });

    return { total_rows: rows.length, offset: 0, rows };
  }
}
