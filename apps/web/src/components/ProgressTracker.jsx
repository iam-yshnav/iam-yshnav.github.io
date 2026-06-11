import React from 'react';

export default function ProgressTracker({ accessLevel, milestones }) {
  const getLevelColor = () => {
    switch(accessLevel) {
      case 'ROOT': return 'text-red-500 text-glow-red border-red-500';
      case 'AUTHENTICATED': return 'text-cyan-400 text-glow-cyan border-cyan-400';
      default: return 'text-green-500 text-glow-green border-green-500';
    }
  };

  return (
    <div className="w-full bg-black/80 border-b border-gray-800 p-3 sm:p-4 flex flex-col md:flex-row justify-between items-start md:items-center shrink-0 z-10 backdrop-blur-sm shadow-md">
      <div className={`font-bold px-3 py-1 border rounded bg-black/50 mb-3 md:mb-0 ${getLevelColor()}`}>
        [ACCESS LEVEL: {accessLevel}]
      </div>
      
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs sm:text-sm text-green-500 text-glow-green opacity-90">
        <div className={`flex items-center gap-1 ${milestones.recon ? 'opacity-100' : 'opacity-40'}`}>
          <span>{milestones.recon ? '[✓]' : '[ ]'}</span> Recon
        </div>
        <div className={`flex items-center gap-1 ${milestones.enum ? 'opacity-100' : 'opacity-40'}`}>
          <span>{milestones.enum ? '[✓]' : '[ ]'}</span> Enumeration
        </div>
        <div className={`flex items-center gap-1 ${milestones.access ? 'opacity-100' : 'opacity-40'}`}>
          <span>{milestones.access ? '[✓]' : '[ ]'}</span> Access Granted
        </div>
        <div className={`flex items-center gap-1 ${milestones.root ? 'opacity-100 text-red-500 text-glow-red' : 'opacity-40'}`}>
          <span>{milestones.root ? '[✓]' : '[ ]'}</span> Privilege Esc.
        </div>
      </div>
    </div>
  );
}