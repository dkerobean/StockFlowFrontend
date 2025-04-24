// core/modals/stocks/viewnotemodal.js
import React from 'react';

const ViewNoteModal = ({ isOpen, onClose, note }) => {
    if (!isOpen) return null;

    return (
        <div className="modal fade show d-block" id="view-notes-modal" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header border-0 custom-modal-header pb-0">
                        <div className="page-title">
                            <h4>Adjustment Note</h4>
                        </div>
                        <button
                            type="button"
                            className="close"
                            onClick={onClose}
                            aria-label="Close"
                        >
                            <span aria-hidden="true">×</span>
                        </button>
                    </div>
                    <div className="modal-body custom-modal-body">
                        {note ? (
                             <p style={{ whiteSpace: 'pre-wrap' }}>{note}</p> // Use pre-wrap to respect newlines
                        ) : (
                            <p className="text-muted">No note provided for this adjustment.</p>
                        )}
                    </div>
                     <div className="modal-footer modal-footer-btn pt-0 border-0">
                            <button
                                type="button"
                                className="btn btn-cancel" // Or btn-secondary
                                onClick={onClose}
                            >
                                Close
                            </button>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default ViewNoteModal;