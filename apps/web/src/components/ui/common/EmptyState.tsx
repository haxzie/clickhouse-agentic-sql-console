type EmptyStateProps = {
  message: string;
};

export function EmptyState({ message }: EmptyStateProps) {
  return <p className="px-3 py-4 text-neutral-500">{message}</p>;
}
