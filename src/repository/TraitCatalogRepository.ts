import { DivineTrait, Traco } from "../types";
import { DbDriver } from "./drivers/rxdbDriver";
import { Persisted } from "./persistenceTypes";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

export type CatalogTrait = Traco | DivineTrait;

type TraitFilters = Partial<
  Pick<DivineTrait, "origem" | "caminho" | "ranqueRequisito">
>;

export class TraitCatalogRepository {
  private db: DbDriver;
  private prefix: string;

  constructor(driver: DbDriver) {
    this.db = driver;
    this.prefix = "trait_";
  }

  async findAll(
    filters: TraitFilters = {},
  ): Promise<Persisted<CatalogTrait>[]> {
    let traits = await this.db.findAll<Persisted<CatalogTrait>>();

    if (filters.origem)
      traits = traits.filter((t) => t.origem === filters.origem);
    if (filters.caminho)
      traits = traits.filter(
        (t) => (t as DivineTrait).caminho === filters.caminho,
      );
    if (filters.ranqueRequisito)
      traits = traits.filter(
        (t) => (t as DivineTrait).ranqueRequisito === filters.ranqueRequisito,
      );

    return traits;
  }

  observeAll(
    filters: TraitFilters = {},
  ): Observable<Persisted<CatalogTrait>[]> {
    return this.db.observeAll<Persisted<CatalogTrait>>().pipe(
      map((traits) => {
        let filtered = traits;
        if (filters.origem)
          filtered = filtered.filter((t) => t.origem === filters.origem);
        if (filters.caminho)
          filtered = filtered.filter(
            (t) => (t as DivineTrait).caminho === filters.caminho,
          );
        if (filters.ranqueRequisito)
          filtered = filtered.filter(
            (t) =>
              (t as DivineTrait).ranqueRequisito === filters.ranqueRequisito,
          );
        return filtered;
      }),
    );
  }

  async findById(id: string): Promise<Persisted<CatalogTrait>> {
    const docId = id.startsWith(this.prefix) ? id : `${this.prefix}${id}`;
    return this.db.get<Persisted<CatalogTrait>>(docId);
  }

  async save(
    trait: Partial<CatalogTrait> & { id?: string },
  ): Promise<Persisted<CatalogTrait>> {
    const baseId = trait.id ?? Date.now().toString(36);
    const docId = `${this.prefix}${baseId}`.replace(
      new RegExp(`^(${this.prefix})+`),
      this.prefix,
    );

    const doc = { ...trait, id: docId };
    const result = await this.db.put(doc);
    return { ...trait, id: result.id } as Persisted<CatalogTrait>;
  }

  async remove(id: string): Promise<void> {
    const docId = id.startsWith(this.prefix) ? id : `${this.prefix}${id}`;
    await this.db.remove(docId);
  }

  async seed(traitsArray: Partial<CatalogTrait>[]): Promise<void> {
    const existing = await this.findAll();
    if (existing.length > 0) return;
    for (const trait of traitsArray) {
      await this.save(trait);
    }
  }
}
