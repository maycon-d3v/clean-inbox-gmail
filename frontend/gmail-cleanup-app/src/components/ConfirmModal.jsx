import './ConfirmModal.css';

function ConfirmModal({ isOpen, onClose, onConfirm, title, message, details, confirmText = 'Confirm', cancelText = 'Cancel', danger = false }) {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-container">
        <div className="modal-header">
          <div className={`modal-icon ${danger ? 'danger' : 'info'}`}>
            <i className={`bx ${danger ? 'bx-error-circle' : 'bx-info-circle'}`}></i>
          </div>
          <h2>{title}</h2>
        </div>

        <div className="modal-body">
          <p className="modal-message">{message}</p>

          {details && details.length > 0 && (
            <div className="modal-details">
              {details.map((detail, index) => (
                <div key={index} className="detail-item">
                  <i className='bx bx-check-circle'></i>
                  <span>{detail}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="modal-button cancel" onClick={onClose}>
            <i className='bx bx-x'></i>
            {cancelText}
          </button>
          <button className={`modal-button confirm ${danger ? 'danger' : ''}`} onClick={onConfirm}>
            <i className={`bx ${danger ? 'bx-trash' : 'bx-check'}`}></i>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
