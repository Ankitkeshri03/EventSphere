const variants = {
  primary:
    'bg-violet-600 text-white hover:bg-violet-500 disabled:bg-violet-300 dark:disabled:bg-violet-900 dark:disabled:text-violet-400',
  secondary:
    'bg-slate-100 text-slate-800 hover:bg-slate-200 disabled:text-slate-400 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
  outline:
    'border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800',
  danger:
    'bg-red-600 text-white hover:bg-red-500 disabled:bg-red-300 dark:disabled:bg-red-950 dark:disabled:text-red-500',
  ghost:
    'text-slate-600 hover:bg-slate-100 disabled:text-slate-400 dark:text-slate-300 dark:hover:bg-slate-800',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

function Button({ variant = 'primary', size = 'md', className = '', ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium
        transition-colors duration-150 disabled:cursor-not-allowed
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500
        ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}

export default Button;
