import { useState } from 'react';
import { APP_VERSION } from '../../constants';
import { Terminal, Check, Copy } from 'lucide-react';

/**
 * High-visibility version badge for development & testing.
 * Displays version, git commit hash, and build timestamp on screen.
 */
export function DevVersionBadge() {
  const [copied, setCopied] = useState(false);

  const commitHash = typeof __COMMIT_HASH__ !== 'undefined' ? __COMMIT_HASH__ : 'dev';
  const buildTime = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : '';

  const fullVersionText = `ChoreQuest ${APP_VERSION} (Commit #${commitHash}) Built @ ${buildTime}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullVersionText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed bottom-2 right-2 z-[9999] pointer-events-auto">
      <button
        onClick={handleCopy}
        title="Click to copy build info"
        className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/90 backdrop-blur-md text-slate-200 border border-slate-700/80 rounded-full text-[10px] font-mono shadow-xl hover:bg-slate-800 hover:text-white transition-all active:scale-95 group"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <Terminal className="h-3 w-3 text-indigo-400" />
        <span className="font-bold text-white">{APP_VERSION}</span>
        <span className="text-slate-400">#{commitHash}</span>
        {buildTime && <span className="text-slate-500 hidden sm:inline">• {buildTime}</span>}
        {copied ? (
          <Check className="h-3 w-3 text-emerald-400 ml-0.5" />
        ) : (
          <Copy className="h-3 w-3 text-slate-500 group-hover:text-slate-300 ml-0.5" />
        )}
      </button>
    </div>
  );
}
