import { useState } from 'react';

import { runQuery, type QueryRow } from './api.js';

export function App() {
  const [query, setQuery] = useState('SELECT 1');
  const [rows, setRows] = useState<QueryRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const onRun = async () => {
    setIsRunning(true);
    setError(null);

    try {
      setRows(await runQuery(query));
    } catch (cause) {
      setRows([]);
      setError(cause instanceof Error ? cause.message : 'Query failed');
    } finally {
      setIsRunning(false);
    }
  };

  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <main className="console">
      <h1>ClickHouse SQL Console</h1>

      <textarea
        className="editor"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        spellCheck={false}
        rows={8}
      />

      <button type="button" onClick={onRun} disabled={isRunning}>
        {isRunning ? 'Running…' : 'Run query'}
      </button>

      {error && <p className="error">{error}</p>}

      {columns.length > 0 && (
        <table className="results">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                {columns.map((column) => (
                  <td key={column}>{String(row[column])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
