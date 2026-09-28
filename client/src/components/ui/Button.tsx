import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon | React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  children?: React.ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 h-8',
    md: 'text-xs px-3.5 py-2 gap-2 h-9 font-semibold',
    lg: 'text-sm px-4 py-2.5 gap-2.5 h-10 font-semibold',
  };

  const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-sm border border-[#1D4ED8] focus:ring-[#2563EB]',
    secondary: 'bg-[#F1F4F9] hover:bg-[#E4E7EC] text-[#172033] border border-[#E4E7EC] focus:ring-[#98A2B3]',
    outline: 'bg-white hover:bg-[#F8FAFC] text-[#172033] border border-[#E4E7EC] shadow-sm focus:ring-[#2563EB]',
    ghost: 'bg-transparent hover:bg-[#F1F4F9] text-[#667085] hover:text-[#172033] border border-transparent focus:ring-[#98A2B3]',
    danger: 'bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] border border-[#FEE2E2] focus:ring-[#EF4444]',
    success: 'bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#059669] border border-[#A7F3D0] focus:ring-[#10B981]',
  };

  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) {
      return icon;
    }
    const IconComponent = icon as LucideIcon;
    return <IconComponent size={size === 'sm' ? 14 : 16} className="shrink-0" />;
  };

  return (
    <button
      disabled={disabled || loading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 size={size === 'sm' ? 14 : 16} className="animate-spin text-current" />
      ) : (
        icon && iconPosition === 'left' && renderIcon()
      )}
      {children && <span>{children}</span>}
      {!loading && icon && iconPosition === 'right' && renderIcon()}
    </button>
  );
}
