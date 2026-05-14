/**
 * Persistence utilities — repository layer only.
 * Never import these into domain components or UI code.
 */

/**
 * A persisted domain object: same shape as T with a guaranteed `id`.
 * This is the only DB-related field that escapes the repository boundary —
 * callers need the ID to reference, update, or delete a record.
 */
export type Persisted<T> = T & { id: string };

/**
 * Internal driver envelope: adds the _id / _rev fields used by DbDriver.
 * Only instantiated inside repository methods; never returned to callers.
 */
export type DbEnvelope<T> = T & {
  _id: string;
  _rev?: string;
  _deleted?: boolean;
};
