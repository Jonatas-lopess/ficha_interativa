import { Threat } from '../types';
import { DbDriver } from './drivers/rxdbDriver';
import { Persisted } from './persistenceTypes';

export class ThreatRepository {
  private db: DbDriver;
  private prefix: string;

  constructor(driver: DbDriver) {
    this.db = driver;
    this.prefix = 'threat_';
  }

  async findAll(filters: Partial<Pick<Threat, 'ranque'>> = {}): Promise<Persisted<Threat>[]> {
    let threats = await this.db.findAll<Persisted<Threat>>();
    if (filters.ranque) {
      threats = threats.filter(t => t.ranque === filters.ranque);
    }
    return threats;
  }

  async findById(id: string): Promise<Persisted<Threat>> {
    const docId = id.startsWith(this.prefix) ? id : `${this.prefix}${id}`;
    return this.db.get<Persisted<Threat>>(docId);
  }

  async save(threat: Partial<Threat> & { id?: string }): Promise<Persisted<Threat>> {
    const baseId = threat.id ?? Date.now().toString(36);
    const docId = `${this.prefix}${baseId}`.replace(new RegExp(`^(${this.prefix})+`), this.prefix);

    const doc = { ...threat, id: docId };
    const result = await this.db.put(doc);
    return { ...threat, id: result.id } as Persisted<Threat>;
  }

  async remove(id: string): Promise<void> {
    const docId = id.startsWith(this.prefix) ? id : `${this.prefix}${id}`;
    await this.db.remove(docId);
  }

  async seed(threatsArray: Partial<Threat>[]): Promise<void> {
    const existing = await this.findAll();
    if (existing.length > 0) return;
    for (const threat of threatsArray) {
      await this.save(threat);
    }
  }
}
