'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { ClassicLoader } from '@/components/ui/ClassicLoader';

export type LoadingButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  loaderSize?: 'sm' | 'md';
  children: ReactNode;
};

export function LoadingButton({
  loading = false,
  loaderSize = 'sm',
  children,
  className = '',
  disabled,
  ...rest
}: LoadingButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={[className, loading ? 'is-loading' : ''].filter(Boolean).join(' ') || undefined}
    >
      {loading ? <ClassicLoader size={loaderSize} /> : children}
    </button>
  );
}
