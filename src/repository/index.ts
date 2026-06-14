import { RxDbDriver } from "./drivers/rxdbDriver";
import { CharacterRepository } from "./CharacterRepository";
import { ThreatRepository } from "./ThreatRepository";
import { TraitCatalogRepository } from "./TraitCatalogRepository";
import { getDatabase } from "../db";
import { migrateFromLocalStorageDriver } from "../db/migration";
import { startCatalogReplication } from "../db/replication/catalogReplication";

const characterDriver = new RxDbDriver("characters");
const threatDriver = new RxDbDriver("threats");
const traitDriver = new RxDbDriver("traits");

export const characterRepo = new CharacterRepository(characterDriver);
export const threatRepo = new ThreatRepository(threatDriver);
export const traitCatalogRepo = new TraitCatalogRepository(traitDriver);

export async function initializeDatabase() {
  try {
    const db = await getDatabase();

    await migrateFromLocalStorageDriver(
      characterRepo,
      threatRepo,
      traitCatalogRepo,
      
    );

    // Nota: A semeadura local a partir de arquivos JSON foi depreciada.
    // O catálogo de ameaças e traços agora é sincronizado e puxado diretamente do Supabase.
    // Inicia replicação em segundo plano com o Supabase
    await startCatalogReplication(db);
  } catch (err) {
    console.error("[db] initializeDatabase failed:", err);
    throw err;
  }
}

