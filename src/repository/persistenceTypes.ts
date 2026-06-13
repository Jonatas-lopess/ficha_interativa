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
