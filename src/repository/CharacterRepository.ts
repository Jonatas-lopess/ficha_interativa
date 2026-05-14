import { Character } from '../types';
import { DbDriver } from './drivers/localStorageDriver';
import { Persisted, DbEnvelope } from './persistenceTypes';

export class CharacterRepository {
  private db: DbDriver;
  private prefix: string;

  constructor(driver: DbDriver) {
    this.db = driver;
    this.prefix = 'character_';
  }

  async findAll(): Promise<Persisted<Character>[]> {
    const result = await this.db.allDocs<DbEnvelope<Character>>({
      include_docs: true,
      startkey: this.prefix,
      endkey: this.prefix + '\uffff',
    });
    return result.rows
      .map(row => row.doc!)
      .filter(Boolean)
      .map(doc => this._toPublic(doc));
  }

  async findById(id: string): Promise<Persisted<Character>> {
    const docId = id.startsWith(this.prefix) ? id : `${this.prefix}${id}`;
    const doc = await this.db.get<DbEnvelope<Character>>(docId);
    return this._toPublic(doc);
  }

  async save(character: Partial<Character> & { id?: string }): Promise<Persisted<Character>> {
    const rawId = character.id ?? `${this.prefix}${Date.now().toString(36)}`;
    const docId = rawId.startsWith(this.prefix) ? rawId : `${this.prefix}${rawId}`;

    // Fetch existing _rev so the driver can detect conflicts
    let existingRev: string | undefined;
    try {
      const existing = await this.db.get<DbEnvelope<Character>>(docId);
      existingRev = existing._rev;
    } catch { /* new document */ }

    const envelope: DbEnvelope<Partial<Character>> = {
      ...(character as Partial<Character>),
      _id: docId,
      _rev: existingRev,
    };
    // strip any client-side id fields that may linger
    delete (envelope as any).id;

    const response = await this.db.put(envelope);
    return { ...character, id: response.id } as Persisted<Character>;
  }

  async remove(id: string): Promise<void> {
    const docId = id.startsWith(this.prefix) ? id : `${this.prefix}${id}`;
    const doc = await this.db.get<DbEnvelope<Character>>(docId);
    await this.db.remove({ _id: doc._id, _rev: doc._rev });
  }

  /** Maps the DB envelope to a clean public object with `id`. */
  private _toPublic(doc: DbEnvelope<Character>): Persisted<Character> {
    const { _id, _rev, _deleted, ...rest } = doc as any;
    return { ...rest, id: _id } as Persisted<Character>;
  }
}
