import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

export function Modal({ isOpen, onClose, title, children, className }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary-dark/40 backdrop-blur-sm transition-opacity">
      <div 
        className={cn("bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col", className)}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-primary-dark">{title}</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-primary-dark transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue rounded-md"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
