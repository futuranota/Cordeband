import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { ClassicLoader } from '@/components/ui/ClassicLoader';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--acc)]/70 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--acc)] text-[var(--acc-ink)] shadow-sm shadow-black/5 hover:bg-[var(--acc-press)]',
        destructive:
          'bg-red-600 text-white shadow-sm shadow-black/5 hover:bg-red-600/90',
        outline:
          'border border-[var(--line-2)] bg-transparent text-[var(--text-2)] shadow-sm shadow-black/5 hover:bg-[var(--elev-2)] hover:text-[var(--text)]',
        secondary:
          'bg-[var(--elev-2)] text-[var(--text)] shadow-sm shadow-black/5 hover:bg-[var(--elev-3)]',
        ghost: 'text-[var(--text-2)] hover:bg-[var(--elev-2)] hover:text-[var(--text)]',
        link: 'text-[var(--acc)] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-lg px-3 text-xs',
        lg: 'h-10 rounded-lg px-6 text-sm',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function loaderToneForVariant(variant: ButtonProps['variant']): 'default' | 'onPrimary' {
  return variant === 'default' || variant === 'destructive' || !variant ? 'onPrimary' : 'default';
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    const tone = loaderToneForVariant(variant);

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }), loading && 'cursor-wait')}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? <ClassicLoader size="sm" tone={tone} /> : children}
      </Comp>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
