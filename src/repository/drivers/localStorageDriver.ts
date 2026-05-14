export interface DbDoc {
  _id: string
  _rev?: string
  _deleted?: boolean
}

export interface AllDocsResult<T extends DbDoc> {
  total_rows: number
  offset: number
  rows: Array<{ id: string; key: string; value: { rev: string }; doc?: T }>
}

export interface DbDriver {
  get<T extends DbDoc>(id: string): Promise<T>
  put<T extends DbDoc>(doc: Partial<T> & { _id?: string }): Promise<{ ok: boolean; id: string; rev: string }>
  remove(doc: Pick<DbDoc, '_id' | '_rev'>): Promise<{ ok: boolean; id: string; rev: string }>
  allDocs<T extends DbDoc>(opts?: { include_docs?: boolean; startkey?: string; endkey?: string }): Promise<AllDocsResult<T>>
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

function generateRev(prevRev?: string) {
  const revNum = prevRev ? parseInt(prevRev.split('-')[0]) + 1 : 1;
  return `${revNum}-${generateId()}`;
}

export class LocalStorageDriver implements DbDriver {
  prefix: string;

  constructor(dbName = 'rpg-db') {
    this.prefix = `${dbName}:`;
  }

  async get<T extends DbDoc>(id: string): Promise<T> {
    const raw = localStorage.getItem(this.prefix + id);
    if (!raw) {
      const err = new Error('missing') as any;
      err.status = 404;
      throw err;
    }
    return JSON.parse(raw);
  }

  async put<T extends DbDoc>(doc: Partial<T> & { _id?: string }): Promise<{ ok: boolean; id: string; rev: string }> {
    if (!doc._id) {
      doc._id = generateId();
    }
    
    let existing: DbDoc | null = null;
    try {
      existing = await this.get(doc._id);
    } catch (e) {
      // not found, that's ok for new doc
    }

    if (existing && existing._rev !== doc._rev) {
      const err = new Error('Document update conflict') as any;
      err.status = 409;
      throw err;
    }

    const docToSave = { ...doc } as Record<string, any>;
    docToSave._rev = generateRev(doc._rev);
    docToSave.atualizadoEm = new Date().toISOString();
    if (!docToSave.criadoEm) {
      docToSave.criadoEm = docToSave.atualizadoEm;
    }
    
    localStorage.setItem(this.prefix + docToSave._id, JSON.stringify(docToSave));
    
    // Return original doc updated with new rev
    doc._rev = docToSave._rev;
    return { ok: true, id: docToSave._id as string, rev: docToSave._rev };
  }

  async remove(doc: Pick<DbDoc, '_id' | '_rev'>): Promise<{ ok: boolean; id: string; rev: string }> {
    if (!doc._id || !doc._rev) {
      throw new Error('Must provide _id and _rev to remove');
    }
    
    const existing = await this.get(doc._id);
    if (existing._rev !== doc._rev) {
      const err = new Error('Document update conflict') as any;
      err.status = 409;
      throw err;
    }

    // Using tombstone to mock PouchDB sync logic
    const tombstone = { _id: doc._id, _rev: generateRev(doc._rev), _deleted: true };
    localStorage.setItem(this.prefix + doc._id, JSON.stringify(tombstone));
    return { ok: true, id: doc._id, rev: tombstone._rev };
  }

  async allDocs<T extends DbDoc>(options: { include_docs?: boolean; startkey?: string; endkey?: string } = {}): Promise<AllDocsResult<T>> {
    const { include_docs = false, startkey = '', endkey = '\uffff' } = options;
    const rows: Array<{ id: string; key: string; value: { rev: string }; doc?: T }> = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        const id = key.substring(this.prefix.length);
        if (id >= startkey && id <= endkey) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const doc = JSON.parse(raw);
            if (!doc._deleted) {
              rows.push({
                id: doc._id,
                key: doc._id,
                value: { rev: doc._rev },
                doc: include_docs ? doc : undefined
              });
            }
          }
        }
      }
    }
    
    rows.sort((a, b) => a.id.localeCompare(b.id));
    
    return {
      total_rows: rows.length,
      offset: 0,
      rows
    };
  }
}
