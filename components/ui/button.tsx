import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
        variant === 'default' && 'bg-orange-600 text-white hover:bg-orange-700',
        variant === 'outline' && 'border border-gray-300 bg-white hover:bg-gray-100',
        variant === 'ghost' && 'hover:bg-gray-100',
        size === 'default' && 'h-10 px-4 py-2',
        size === 'sm' && 'h-8 px-3 text-sm',
        size === 'lg' && 'h-12 px-6 text-lg',
        className
      )}
      {...props}
    />
  )
);
Button.displayName = 'Button';
export { Button };
