import React from 'react';
import { cn } from '../../utils/cn';

export function Badge({ className, variant = 'default', children, ...props }) {
  const variants = {
    default: "bg-gray-100 text-gray-800",
    primary: "bg-blue-100 text-blue-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-800",
    dark: "bg-gray-800 text-gray-100",
  };

  return (
    <span 
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status, className }) {
  const statusMap = {
    ONLINE: 'success',
    HEALTHY: 'success',
    RESOLVED: 'success',
    OFFLINE: 'danger',
    CRITICAL: 'danger',
    DEGRADED: 'warning',
    WARNING: 'warning',
    OPEN: 'warning',
    INVESTIGATING: 'primary',
    DISMISSED: 'default',
  };

  const variant = statusMap[status?.toUpperCase()] || 'default';

  return (
    <Badge variant={variant} className={className}>
      {status}
    </Badge>
  );
}
