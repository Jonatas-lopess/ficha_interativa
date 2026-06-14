import { RxDbDriver } from "./drivers/rxdbDriver";
import { CharacterRepository } from "./CharacterRepository";
import { ThreatRepository } from "./ThreatRepository";
import { TraitCatalogRepository } from "./TraitCatalogRepository";
import { SkillRepository } from "./SkillRepository";
import { getDatabase } from "../db";
import { startCatalogReplication } from "../db/replication/catalogReplication";

const characterDriver = new RxDbDriver("characters");
const threatDriver = new RxDbDriver("threats");
const traitDriver = new RxDbDriver("traits");
const skillDriver = new RxDbDriver("skills");

export const characterRepo = new CharacterRepository(characterDriver);
export const threatRepo = new ThreatRepository(threatDriver);
export const traitCatalogRepo = new TraitCatalogRepository(traitDriver);
export const skillRepo = new SkillRepository(skillDriver);

export async function initializeDatabase() {
  try {
    const db = await getDatabase();

    // Nota: A semeadura local a partir de arquivos JSON foi depreciada.
    // O catálogo de ameaças e traços agora é sincronizado e puxado diretamente do Supabase.
    // Inicia replicação em segundo plano com o Supabase
    await startCatalogReplication(db);
  } catch (err) {
    console.error("[db] initializeDatabase failed:", err);
    throw err;
  }
}
