'use client';

import type { ReactNode } from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';

export type LoadingButtonProps = ButtonProps & {
  loading?: boolean;
  children: ReactNode;
};

export function LoadingButton({
  loading = false,
  children,
  ...rest
}: LoadingButtonProps) {
  return (
    <Button loading={loading} {...rest}>
      {children}
    </Button>
  );
}
