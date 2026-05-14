import { DivineTrait, Traco } from '../types';
import { DbDriver } from './drivers/localStorageDriver';
import { Persisted, DbEnvelope } from './persistenceTypes';

export type CatalogTrait = Traco | DivineTrait;

type TraitFilters = Partial<Pick<DivineTrait, 'origem' | 'caminho' | 'ranqueRequisito'>>;

export class TraitCatalogRepository {
  private db: DbDriver;
  private prefix: string;

  constructor(driver: DbDriver) {
    this.db = driver;
    this.prefix = 'trait_';
  }

  async findAll(filters: TraitFilters = {}): Promise<Persisted<CatalogTrait>[]> {
    const result = await this.db.allDocs<DbEnvelope<CatalogTrait>>({
      include_docs: true,
      startkey: this.prefix,
      endkey: this.prefix + '\uffff',
    });

    let traits = result.rows.map(row => row.doc!).filter(Boolean).map(doc => this._toPublic(doc));

    if (filters.origem)         traits = traits.filter(t => t.origem === filters.origem);
    if (filters.caminho)        traits = traits.filter(t => (t as DivineTrait).caminho === filters.caminho);
    if (filters.ranqueRequisito) traits = traits.filter(t => (t as DivineTrait).ranqueRequisito === filters.ranqueRequisito);

    return traits;
  }

  async findById(id: string): Promise<Persisted<CatalogTrait>> {
    const docId = id.startsWith(this.prefix) ? id : `${this.prefix}${id}`;
    const doc = await this.db.get<DbEnvelope<CatalogTrait>>(docId);
    return this._toPublic(doc);
  }

  async save(trait: Partial<CatalogTrait> & { id?: string }): Promise<Persisted<CatalogTrait>> {
    const baseId = (trait as any).id ?? Date.now().toString(36);
    const docId = `${this.prefix}${baseId}`.replace(new RegExp(`^(${this.prefix})+`), this.prefix);

    let existingRev: string | undefined;
    try {
      const existing = await this.db.get<DbEnvelope<CatalogTrait>>(docId);
      existingRev = existing._rev;
    } catch { /* new */ }

    const envelope: DbEnvelope<Partial<CatalogTrait>> = { ...(trait as any), _id: docId, _rev: existingRev };
    delete (envelope as any).id;

    const response = await this.db.put(envelope);
    return { ...trait, id: response.id } as Persisted<CatalogTrait>;
  }

  async remove(id: string): Promise<void> {
    const docId = id.startsWith(this.prefix) ? id : `${this.prefix}${id}`;
    const doc = await this.db.get<DbEnvelope<CatalogTrait>>(docId);
    await this.db.remove({ _id: doc._id, _rev: doc._rev });
  }

  async seed(traitsArray: Partial<CatalogTrait>[]): Promise<void> {
    const existing = await this.findAll();
    if (existing.length > 0) return;
    for (const trait of traitsArray) {
      await this.save(trait);
    }
  }

  private _toPublic(doc: DbEnvelope<CatalogTrait>): Persisted<CatalogTrait> {
    const { _id, _rev, _deleted, ...rest } = doc as any;
    return { ...rest, id: _id } as Persisted<CatalogTrait>;
  }
}
