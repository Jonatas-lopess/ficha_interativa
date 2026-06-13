import { RxDbDriver } from './drivers/rxdbDriver';
import { CharacterRepository }    from './CharacterRepository';
import { ThreatRepository }       from './ThreatRepository';
import { TraitCatalogRepository } from './TraitCatalogRepository';
import { getDatabase } from '../db';
import { migrateFromLocalStorageDriver } from '../db/migration';
import threatsJson from '../data/threats.json';
import { Threat }  from '../types';

const characterDriver = new RxDbDriver('characters');
const threatDriver    = new RxDbDriver('threats');
const traitDriver     = new RxDbDriver('traits');

export const characterRepo    = new CharacterRepository   (characterDriver);
export const threatRepo       = new ThreatRepository      (threatDriver);
export const traitCatalogRepo = new TraitCatalogRepository(traitDriver);

export async function initializeDatabase() {
  try {
    await getDatabase();

    await migrateFromLocalStorageDriver(characterRepo, threatRepo, traitCatalogRepo);

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
