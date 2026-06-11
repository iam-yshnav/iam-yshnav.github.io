import React, { useRef, useEffect } from 'react';

export default function TerminalInput({
  prompt,
  value,
  onChange,
  onSubmit,
  onKeyDown,
  passwordMode
}) {
  const inputRef = useRef(null);

  // Expose focus method to parent via a custom event or just rely on parent clicking
  useEffect(() => {
    const handleGlobalClick = () => {
      if (window.getSelection().toString().length === 0 && inputRef.current) {
        inputRef.current.focus();
      }
    };

    document.addEventListener('click', handleGlobalClick);
    // Initial focus
    if (inputRef.current) inputRef.current.focus();

    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form
      onSubmit={handleFormSubmit}
      className="terminal-input-area flex flex-col md:flex-row md:items-start"
    >
      <span className="prompt pt-[2px] mb-1 md:mb-0">{prompt}</span>
      <div className="relative w-full md:flex-1 flex items-start">
        <input
          ref={inputRef}
          type={passwordMode ? "password" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          autoComplete="off"
          spellCheck="false"
          autoCapitalize="off"
          autoCorrect="off"
          className="w-full bg-transparent border-none outline-none font-inherit text-inherit text-transparent caret-transparent absolute inset-0 opacity-0 z-10"
          autoFocus
        />

        {/* Visual representation of input */}
        <div className="w-full min-h-[1.6em] break-all pt-[2px] pointer-events-none flex flex-wrap">
          <span className={passwordMode ? "text-gray-500" : "command"}>
            {passwordMode ? '•'.repeat(value.length) : value}
          </span>
          <span className="inline-block w-[0.6em] h-[1.2em] bg-[#00FF00] shadow-[0_0_5px_rgba(0,255,0,0.6)] animate-blink ml-[1px] align-middle mt-[2px]"></span>
        </div>
      </div>
    </form>
  );
}