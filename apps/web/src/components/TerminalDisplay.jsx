import React, { forwardRef } from 'react';

const TerminalDisplay = forwardRef(({ history }, ref) => {
  return (
    <div ref={ref} className="terminal-output">
      {history.map((item, index) => (
        <div key={index} className="mb-4 last:mb-0">
          {item.type === 'command' && (
            <div className="flex flex-col md:flex-row md:flex-wrap md:gap-x-2 mb-2 md:mb-0">
              <span className="prompt mb-1 md:mb-0">{item.prompt}</span>
              <span className="command break-all">{item.command}</span>
            </div>
          )}

          {item.type === 'output' && item.content && (
            <pre
              className={`whitespace-pre-wrap font-inherit m-0 mt-1 ${item.colorCode === 'error' ? 'error' :
                item.colorCode === 'info' ? 'text-cyan-400 glow-text' :
                  'command'
                }`}
              dangerouslySetInnerHTML={{ __html: item.content }}
            />
          )}
        </div>
      ))}
    </div>
  );
});

TerminalDisplay.displayName = 'TerminalDisplay';

export default TerminalDisplay;