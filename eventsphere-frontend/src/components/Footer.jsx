import { Link } from 'react-router-dom';
import Logo from './Logo';

function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 sm:flex-row">
        <Logo iconOnly />
        <div className="flex items-center gap-5 text-sm text-slate-500 dark:text-slate-400">
          <Link to="/about" className="hover:text-slate-800 dark:hover:text-slate-200">About</Link>
          <Link to="/contact" className="hover:text-slate-800 dark:hover:text-slate-200">Contact & support</Link>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
