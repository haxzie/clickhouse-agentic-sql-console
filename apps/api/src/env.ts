const CLICKHOUSE_URL = process.env.CLICKHOUSE_URL ?? 'http://localhost:8123';
const PORT = Number(process.env.PORT ?? 8080);
const WEB_ORIGIN = process.env.WEB_ORIGIN ?? 'http://localhost:5173';

export const env = { CLICKHOUSE_URL, PORT, WEB_ORIGIN };
