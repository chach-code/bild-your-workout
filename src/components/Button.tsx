import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'lg' | 'sm';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth,
  className = '',
  ...rest
}: Props) {
  return (
    <button
      className={`btn btn-${variant} btn-${size} ${fullWidth ? 'btn-block' : ''} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
