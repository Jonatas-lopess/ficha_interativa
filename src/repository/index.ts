import { LocalStorageDriver } from './drivers/localStorageDriver';
import { CharacterRepository }    from './CharacterRepository';
import { ThreatRepository }       from './ThreatRepository';
import { TraitCatalogRepository } from './TraitCatalogRepository';
import threatsJson from '../data/threats.json';
import { Threat }  from '../types';

// Single driver instance — swap to RxDbDriver (src/repository/drivers/rxdbDriver.ts)
// when you're ready to move to RxDB + Supabase.
const driver = new LocalStorageDriver('rpg-db');

export const characterRepo    = new CharacterRepository   (driver);
export const threatRepo       = new ThreatRepository      (driver);
export const traitCatalogRepo = new TraitCatalogRepository(driver);

export async function initializeDatabase() {
  try {
    const existingThreats = await threatRepo.findAll();
    if (existingThreats.length === 0 && threatsJson.length > 0) {
      console.log('[db] Seeding threats…');
      await threatRepo.seed(threatsJson as Partial<Threat>[]);
    }
  } catch (err) {
    console.error('[db] initializeDatabase failed:', err);
    throw err;
  }
}
