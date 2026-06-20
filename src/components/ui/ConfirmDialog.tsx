'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { LoadingButton } from '@/components/ui/LoadingButton';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  loading?: boolean;
  danger?: boolean;
  icon?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  loading = false,
  danger = false,
  icon,
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading) onCancel();
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, loading, onCancel]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="modal-scrim"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onCancel();
      }}
    >
      <div
        className="modal confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
      >
        {icon && (
          <div className={`modal-cap${danger ? ' modal-cap--danger' : ''}`}>
            {icon}
          </div>
        )}
        <p id="confirm-dialog-title" style={{ margin: '0 0 8px', fontWeight: 800, fontSize: 20 }}>
          {title}
        </p>
        <p id="confirm-dialog-desc" className="muted" style={{ margin: 0, fontSize: 14, lineHeight: 1.55 }}>
          {message}
        </p>
        {children}
        <div className="row gap-12 confirm-modal-actions">
          <button type="button" className="btn btn-ghost" disabled={loading} onClick={onCancel}>
            {cancelLabel}
          </button>
          <LoadingButton
            type="button"
            className={`btn${danger ? ' cancel-confirm' : ' btn-primary'}`}
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </LoadingButton>
        </div>
      </div>
    </div>,
    document.body,
  );
}
