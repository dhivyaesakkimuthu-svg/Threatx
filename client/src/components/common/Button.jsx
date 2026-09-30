import React from 'react';
import { cn } from '../../utils/cn';

export const Button = React.forwardRef(({ 
  className, 
  variant = 'primary', 
  size = 'md', 
  icon: Icon,
  iconPosition = 'left',
  children,
  ...props 
}, ref) => {
  const baseStyles = "inline-flex items-center justify-center rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-brand-blue text-white hover:bg-blue-700 focus:ring-brand-blue",
    secondary: "bg-secondary-dark text-white hover:bg-gray-800 focus:ring-secondary-dark",
    outline: "border border-border bg-transparent text-primary-dark hover:bg-gray-50 focus:ring-gray-200",
    ghost: "bg-transparent text-secondary-text hover:bg-gray-100 hover:text-primary-dark focus:ring-gray-200",
    danger: "bg-status-danger text-white hover:bg-red-700 focus:ring-status-danger",
    success: "bg-status-success text-white hover:bg-green-700 focus:ring-status-success",
  };

  const sizes = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4 py-2",
    lg: "h-12 px-6 text-lg",
    icon: "h-10 w-10",
  };

  return (
    <button
      ref={ref}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {Icon && iconPosition === 'left' && <Icon className={cn("mr-2", size === 'sm' ? "h-4 w-4" : "h-5 w-5")} />}
      {children}
      {Icon && iconPosition === 'right' && <Icon className={cn("ml-2", size === 'sm' ? "h-4 w-4" : "h-5 w-5")} />}
    </button>
  );
});

Button.displayName = 'Button';
