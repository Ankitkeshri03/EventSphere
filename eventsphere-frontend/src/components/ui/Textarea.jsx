function Textarea({ label, className = '', id, ...props }) {
  const inputId = id || props.name;

  const textarea = (
    <textarea
      id={inputId}
      className={`w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800
        placeholder:text-slate-400 transition-colors
        focus:border-violet-500 focus:outline focus:outline-2 focus:outline-violet-100
        dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500
        dark:focus:outline-violet-950
        ${className}`}
      {...props}
    />
  );

  if (!label) return textarea;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      {textarea}
    </div>
  );
}

export default Textarea;
