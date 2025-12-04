import React from 'react';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label: string;
  textarea?: boolean;
  helperText?: string;
}

export const InputField: React.FC<InputFieldProps> = ({ label, textarea, helperText, className = '', ...props }) => {
  const baseClasses = "w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border transition-colors duration-200 outline-none";
  
  return (
    <div className="space-y-1">
      <label htmlFor={props.id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      {textarea ? (
        <textarea
          className={`${baseClasses} min-h-[80px] resize-y ${className}`}
          {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input
          className={`${baseClasses} ${className}`}
          {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
        />
      )}
      {helperText && <p className="text-xs text-slate-500">{helperText}</p>}
    </div>
  );
};