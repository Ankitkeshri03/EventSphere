function Card({ className = '', ...props }) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white shadow-sm
        dark:border-slate-800 dark:bg-slate-900 ${className}`}
      {...props}
    />
  );
}

export default Card;
