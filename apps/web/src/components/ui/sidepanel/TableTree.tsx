import { useSchemaStore } from '../../../stores/useSchemaStore.js';
import { EmptyState } from '../common/EmptyState.js';
import { DatabaseNode } from './DatabaseNode.js';

export function TableTree() {
  const databases = useSchemaStore((state) => state.databases);
  const isLoading = useSchemaStore((state) => state.isLoading);
  const error = useSchemaStore((state) => state.error);

  if (isLoading) {
    return <EmptyState message="Loading schema…" />;
  }

  if (error) {
    return (
      <p role="alert" className="px-3 py-4 break-words text-red-600">
        {error}
      </p>
    );
  }

  if (databases.length === 0) {
    return <EmptyState message="No databases found." />;
  }

  return (
    <ul role="tree" aria-label="Database schema" className="py-1">
      {databases.map((database) => (
        <DatabaseNode key={database.name} database={database} />
      ))}
    </ul>
  );
}
