import { Character } from '../types';
import { DbDriver } from './drivers/rxdbDriver';
import { Persisted } from './persistenceTypes';

export class CharacterRepository {
  private db: DbDriver;
  private prefix: string;

  constructor(driver: DbDriver) {
    this.db = driver;
    this.prefix = 'character_';
  }

  async findAll(): Promise<Persisted<Character>[]> {
    return this.db.findAll<Persisted<Character>>();
  }

  async findById(id: string): Promise<Persisted<Character>> {
    const docId = id.startsWith(this.prefix) ? id : `${this.prefix}${id}`;
    return this.db.get<Persisted<Character>>(docId);
  }

  async save(character: Partial<Character> & { id?: string }): Promise<Persisted<Character>> {
    const rawId = character.id ?? `${this.prefix}${Date.now().toString(36)}`;
    const docId = rawId.startsWith(this.prefix) ? rawId : `${this.prefix}${rawId}`;

    const doc = { ...character, id: docId };
    const result = await this.db.put(doc);
    return { ...character, id: result.id } as Persisted<Character>;
  }

  async remove(id: string): Promise<void> {
    const docId = id.startsWith(this.prefix) ? id : `${this.prefix}${id}`;
    await this.db.remove(docId);
  }
}
