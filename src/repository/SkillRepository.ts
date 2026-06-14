import { DivineSkill } from "../types";
import { DbDriver } from "./drivers/rxdbDriver";
import { Persisted } from "./persistenceTypes";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

export class SkillRepository {
  private db: DbDriver;
  private prefix: string;

  constructor(driver: DbDriver) {
    this.db = driver;
    this.prefix = "skill_";
  }

  async findAll(
    filters: Partial<
      Pick<DivineSkill, "tipo" | "caminho" | "ranqueRequisito">
    > = {},
  ): Promise<Persisted<DivineSkill>[]> {
    let skills = await this.db.findAll<Persisted<DivineSkill>>();

    if (filters.tipo) skills = skills.filter((s) => s.tipo === filters.tipo);
    if (filters.caminho)
      skills = skills.filter((s) => s.caminho === filters.caminho);
    if (filters.ranqueRequisito)
      skills = skills.filter(
        (s) => s.ranqueRequisito === filters.ranqueRequisito,
      );

    return skills;
  }

  observeAll(
    filters: Partial<
      Pick<DivineSkill, "tipo" | "caminho" | "ranqueRequisito">
    > = {},
  ): Observable<Persisted<DivineSkill>[]> {
    return this.db.observeAll<Persisted<DivineSkill>>().pipe(
      map((skills) => {
        let filtered = skills;
        if (filters.tipo)
          filtered = filtered.filter((s) => s.tipo === filters.tipo);
        if (filters.caminho)
          filtered = filtered.filter((s) => s.caminho === filters.caminho);
        if (filters.ranqueRequisito)
          filtered = filtered.filter(
            (s) => s.ranqueRequisito === filters.ranqueRequisito,
          );
        return filtered;
      }),
    );
  }

  async findById(id: string): Promise<Persisted<DivineSkill>> {
    const docId = id.startsWith(this.prefix) ? id : `${this.prefix}${id}`;
    return this.db.get<Persisted<DivineSkill>>(docId);
  }

  async save(
    skill: Partial<DivineSkill> & { id?: string },
  ): Promise<Persisted<DivineSkill>> {
    const baseId = skill.id ?? Date.now().toString(36);
    const docId = `${this.prefix}${baseId}`.replace(
      new RegExp(`^(${this.prefix})+`),
      this.prefix,
    );

    const doc = { ...skill, id: docId };
    const result = await this.db.put(doc);
    return { ...skill, id: result.id } as Persisted<DivineSkill>;
  }

  async remove(id: string): Promise<void> {
    const docId = id.startsWith(this.prefix) ? id : `${this.prefix}${id}`;
    await this.db.remove(docId);
  }
}
