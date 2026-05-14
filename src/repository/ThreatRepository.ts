import { Threat } from '../types';
import { DbDriver } from './drivers/localStorageDriver';
import { Persisted, DbEnvelope } from './persistenceTypes';

export class ThreatRepository {
  private db: DbDriver;
  private prefix: string;

  constructor(driver: DbDriver) {
    this.db = driver;
    this.prefix = 'threat_';
  }

  async findAll(filters: Partial<Pick<Threat, 'ranque'>> = {}): Promise<Persisted<Threat>[]> {
    const result = await this.db.allDocs<DbEnvelope<Threat>>({
      include_docs: true,
      startkey: this.prefix,
      endkey: this.prefix + '\uffff',
    });

    let threats = result.rows.map(row => row.doc!).filter(Boolean).map(doc => this._toPublic(doc));
    if (filters.ranque) {
      threats = threats.filter(t => t.ranque === filters.ranque);
    }
    return threats;
  }

  async findById(id: string): Promise<Persisted<Threat>> {
    const docId = id.startsWith(this.prefix) ? id : `${this.prefix}${id}`;
    const doc = await this.db.get<DbEnvelope<Threat>>(docId);
    return this._toPublic(doc);
  }

  async save(threat: Partial<Threat> & { id?: string }): Promise<Persisted<Threat>> {
    const baseId = (threat as any).id ?? Date.now().toString(36);
    const docId = `${this.prefix}${baseId}`.replace(new RegExp(`^(${this.prefix})+`), this.prefix);

    let existingRev: string | undefined;
    try {
      const existing = await this.db.get<DbEnvelope<Threat>>(docId);
      existingRev = existing._rev;
    } catch { /* new */ }

    const envelope: DbEnvelope<Partial<Threat>> = { ...(threat as any), _id: docId, _rev: existingRev };
    delete (envelope as any).id;

    const response = await this.db.put(envelope);
    return { ...threat, id: response.id } as Persisted<Threat>;
  }

  async remove(id: string): Promise<void> {
    const docId = id.startsWith(this.prefix) ? id : `${this.prefix}${id}`;
    const doc = await this.db.get<DbEnvelope<Threat>>(docId);
    await this.db.remove({ _id: doc._id, _rev: doc._rev });
  }

  async seed(threatsArray: Partial<Threat>[]): Promise<void> {
    const existing = await this.findAll();
    if (existing.length > 0) return;
    for (const threat of threatsArray) {
      await this.save(threat);
    }
  }

  private _toPublic(doc: DbEnvelope<Threat>): Persisted<Threat> {
    const { _id, _rev, _deleted, ...rest } = doc as any;
    return { ...rest, id: _id } as Persisted<Threat>;
  }
}
