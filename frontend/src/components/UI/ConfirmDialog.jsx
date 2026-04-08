import Modal from './Modal'
import LoadingSpinner from './LoadingSpinner'

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Delete', loading = false, variant = 'danger' }) {
  const btnClass = variant === 'danger'
    ? 'btn-danger'
    : 'btn-primary'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
      <div className="flex items-center justify-end gap-3 mt-6">
        <button onClick={onClose} className="btn-secondary" disabled={loading}>Cancel</button>
        <button onClick={onConfirm} className={btnClass} disabled={loading}>
          {loading && <LoadingSpinner size="sm" color="white" />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
