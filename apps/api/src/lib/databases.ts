/**
 * Engine-internal databases. Hidden from both the explorer and the schema
 * search: they are ClickHouse's own bookkeeping, and `system` alone is ~100
 * tables that bury the user's own data.
 *
 * They remain queryable — nothing stops `SELECT * FROM system.parts` — this
 * only keeps them out of the places that list what you have.
 */
export const INTERNAL_DATABASES = ['INFORMATION_SCHEMA', 'information_schema', 'system'];

/** Formatted for a `NOT IN (…)` clause. */
export const INTERNAL_DATABASES_SQL = INTERNAL_DATABASES.map((name) => `'${name}'`).join(', ');
