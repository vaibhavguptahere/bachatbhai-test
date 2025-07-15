import React from 'react';
import { cn } from '@/lib/utils';

export function ProgressBar({ value, className, ...props }) {
  return (
    <div className={cn("w-full bg-gray-200 rounded-full h-2.5", className)} {...props}>
      <div 
        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}