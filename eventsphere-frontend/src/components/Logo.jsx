function Logo({ iconOnly = false, variant = 'dark', className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-violet-600 to-fuchsia-500 text-sm font-bold text-white shadow-sm">
        E
      </span>
      {!iconOnly && (
        <span
          className={`text-lg font-semibold tracking-tight ${
            variant === 'light' ? 'text-white' : 'text-slate-900 dark:text-white'
          }`}
        >
          EventSphere
        </span>
      )}
    </span>
  );
}

export default Logo;
