import { useConnectionStore } from '../../../stores/useConnectionStore.js';
import { Modal } from '../common/Modal.js';
import { ConnectionForm } from './ConnectionForm.js';

export function AddConnectionModal() {
  const isModalOpen = useConnectionStore((state) => state.isModalOpen);
  const closeModal = useConnectionStore((state) => state.closeModal);

  if (!isModalOpen) {
    return null;
  }

  return (
    <Modal title="Add ClickHouse connection" onClose={closeModal}>
      <ConnectionForm />
    </Modal>
  );
}
