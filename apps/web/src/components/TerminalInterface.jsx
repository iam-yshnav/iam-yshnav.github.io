import React, { useState, useEffect, useRef } from 'react';

// --- Constants & Data ---
const BOOT_SEQUENCE = [
  "Booting secure environment...",
  "Access restricted.",
  "Recon required.",
  "Type 'help' to begin."
];

const VALID_COMMANDS = ['help', 'ls', 'cat', 'decode', 'unlock', 'scan', 'hint', 'history', 'clear', 'sudo', 'whoami', 'exit', 'flag'];

const FILE_SYSTEM = {
  level1_dirs: ['public', 'intel', 'assets'],
  level1_files: ['hidden.log'],
  level2_dirs: ['identity', 'capabilities', 'operations', 'arsenal', 'communication', 'classified'],
  contents: {
    'hidden.log': 'VnlzaG5hdiBWaW5vZA==',
    'identity/profile.txt': 'Vyshnav Vinod\nCybersecurity & VAPT Analyst\nB.Tech (Cybersecurity)\nPassionate about ethical hacking and security research',
    'capabilities/skills.txt': 'Web Security (XSS, SQLi, CSRF)\nVAPT (Vulnerability Assessment & Penetration Testing)\nNetworking (TCP/IP, DNS, HTTP/HTTPS)\nPython, APIs, Bash scripting\nOSINT Techniques\nLinux & System Administration',
    'operations/projects.log': '[+] Sentinel – Threat Intelligence Platform (Real-time threat detection system)\n[+] SEO Optimization Project (45% performance boost, security hardening)\n[+] Web Security Testing Labs (Educational CTF challenges)\n[+] VAPT Assessments (Multiple client engagements)',
    'arsenal/tools.list': 'Burp Suite (Web application testing)\nNmap (Network reconnaissance)\nWireshark (Network analysis)\nNessus (Vulnerability scanning)\nPostman (API testing)\nMetasploit (Penetration testing framework)',
    'communication/contact.sec': 'Email: contact@example.com\nPortfolio: https://portfolio.local\nGitHub: github.com/vyshnavvinod\nLinkedIn: linkedin.com/in/vyshnavvinod\nStatus: Open to opportunities in cybersecurity',
    'classified/flag.txt': 'FLAG{vapt_mindset_unlocked}'
  }
};

const BASE64_TARGET = 'VnlzaG5hdiBWaW5vZA==';

// --- Helper Components ---
const InteractiveOutput = ({ text, onCopy }) => {
  if (!text) return null;
  
  // Look for the specific base64 string to make it clickable
  const parts = text.split(BASE64_TARGET);
  if (parts.length > 1) {
    return (
      <span>
        {parts[0]}
        <span 
          className="interactive-element"
          onClick={() => onCopy(BASE64_TARGET)}
          title="Click to copy"
        >
          [{BASE64_TARGET}]
        </span>
        <span className="text-xs text-muted-foreground ml-2">(click to copy)</span>
        {parts[1]}
      </span>
    );
  }
  return <span>{text}</span>;
};

export default function TerminalInterface() {
  // Game State
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [level, setLevel] = useState(1);
  const [lastEncoded, setLastEncoded] = useState('');
  
  // Terminal State
  const [history, setHistory] = useState([]); // [{ type: 'input'|'output'|'error', text: string }]
  const [inputValue, setInputValue] = useState('');
  const [cmdHistory, setCmdHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // UI State
  const [isBooting, setIsBooting] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [currentTypingText, setCurrentTypingText] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // --- Scroll Management ---
  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [history, currentTypingText, isBooting, toastMsg]);

  // --- Boot Sequence ---
  useEffect(() => {
    let currentLine = 0;
    
    const runBoot = async () => {
      for (const line of BOOT_SEQUENCE) {
        await typeOutput(line, 30);
        setHistory(prev => [...prev, { type: 'output', text: line }]);
        setCurrentTypingText('');
      }
      setIsBooting(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    };

    runBoot();
  }, []);

  // --- Typing Engine ---
  const typeOutput = (text, speed = 20) => {
    return new Promise(resolve => {
      setIsTyping(true);
      let i = 0;
      setCurrentTypingText('');
      
      const interval = setInterval(() => {
        setCurrentTypingText(prev => prev + text.charAt(i));
        i++;
        if (i >= text.length) {
          clearInterval(interval);
          setIsTyping(false);
          resolve();
        }
      }, speed);
    });
  };

  // --- Command Execution ---
  const handleCommand = async (cmdString) => {
    const rawCmd = cmdString.trim();
    if (!rawCmd) return;

    // Add to history
    setHistory(prev => [...prev, { type: 'input', text: rawCmd }]);
    setCmdHistory(prev => [...prev, rawCmd]);
    setHistoryIndex(-1);

    const args = rawCmd.split(' ').filter(Boolean);
    const baseCmd = args[0].toLowerCase();

    setIsTyping(true);
    // Processing delay
    await new Promise(r => setTimeout(r, 250));

    let output = '';
    let isError = false;

    // Smart Suggestions for invalid commands
    if (!VALID_COMMANDS.includes(baseCmd)) {
      const suggestion = VALID_COMMANDS.find(c => 
        c.startsWith(baseCmd.substring(0, 2)) || baseCmd.includes(c)
      );
      output = `Command not found: ${baseCmd}`;
      if (suggestion) {
        output += `\nDid you mean '${suggestion}'?`;
      }
      isError = true;
    } else {
      // Command Router
      switch (baseCmd) {
        case 'help':
          output = `Available Commands:
  help       - Display this help message
  ls         - List directory contents (use -la for hidden info)
  cat        - Display file contents (e.g., cat hidden.log)
  decode     - Decode encoded strings (auto | <text> | <file>)
  unlock     - Unlock system access with keyword
  scan       - Enumerate system resources (scan system)
  hint       - Get a contextual hint for your current level
  history    - Show recent command history
  clear      - Clear terminal screen`;
          break;

        case 'clear':
          setHistory([]);
          setCurrentTypingText('');
          setIsTyping(false);
          return; // Skip standard output

        case 'ls':
          const isLa = args[1] === '-la';
          if (!isUnlocked) {
            output = FILE_SYSTEM.level1_dirs.map(d => `drwxr-xr-x  root  root  ${d}/`).join('\n') + '\n';
            output += `-rw-r--r--  root  root  hidden.log`;
            if (!isLa) {
              output = FILE_SYSTEM.level1_dirs.map(d => `${d}/`).join('  ') + '  hidden.log';
            }
          } else {
            const allDirs = [...FILE_SYSTEM.level1_dirs, ...FILE_SYSTEM.level2_dirs];
            if (isLa) {
              output = allDirs.map(d => `drwxr-xr-x  root  root  ${d}/`).join('\n') + '\n';
              output += `-rw-r--r--  root  root  hidden.log`;
            } else {
              output = allDirs.map(d => `${d}/`).join('  ') + '  hidden.log';
            }
          }
          break;

        case 'cat':
          if (args.length < 2) {
            output = 'cat: missing file operand';
            isError = true;
            break;
          }
          const target = args[1];
          if (target === 'hidden.log') {
            output = FILE_SYSTEM.contents['hidden.log'];
            setLastEncoded(output);
            output += `\n\nHint: use 'decode <text>' or 'decode hidden.log' to reveal`;
          } else if (FILE_SYSTEM.contents[target]) {
            if (!isUnlocked && target.includes('/')) {
              output = `cat: ${target}: Permission denied. System locked.`;
              isError = true;
            } else {
              output = FILE_SYSTEM.contents[target];
            }
          } else if ([...FILE_SYSTEM.level1_dirs, ...FILE_SYSTEM.level2_dirs].includes(target.replace('/',''))) {
            output = `cat: ${target}: Is a directory`;
            isError = true;
          } else {
            output = `cat: ${target}: No such file or directory`;
            isError = true;
          }
          break;

        case 'decode':
          if (args.length < 2) {
            output = 'decode: missing operand\nUsage: decode <text> | decode auto | decode <filename>';
            isError = true;
            break;
          }
          let toDecode = args.slice(1).join(' ');
          
          if (toDecode === 'auto') {
            toDecode = lastEncoded || '';
            if (!toDecode) {
              output = 'decode: no recent encoded string found in memory.';
              isError = true;
              break;
            }
          } else if (toDecode === 'hidden.log') {
            toDecode = FILE_SYSTEM.contents['hidden.log'];
          }

          try {
            // Basic base64 decode
            if (toDecode === BASE64_TARGET) {
              output = `Decoded output: Vyshnav Vinod\n\n[!] Hint: this identity may grant access to the system.`;
              if (level === 1) setLevel(2);
            } else {
              output = `Decoded output: ${atob(toDecode)}`;
            }
          } catch (e) {
            output = `decode: invalid input format. Unable to parse.`;
            isError = true;
          }
          break;

        case 'unlock':
          if (args.length < 2) {
            output = 'unlock: missing keyword operand';
            isError = true;
            break;
          }
          const keyword = args.slice(1).join(' ').toLowerCase();
          if (keyword === 'vyshnav' || keyword === 'vyshnav vinod') {
            setIsUnlocked(true);
            setLevel(3);
            output = `[+] Access granted.\nPrivilege level: AUTHENTICATED\nSystem directories now accessible. Use 'ls' to view.`;
          } else {
            output = `[-] Access denied. Incorrect keyword.`;
            isError = true;
          }
          break;

        case 'scan':
          if (args[1] === 'system') {
            // Simulate progress bar visually during typing phase
            let progress = "[                    ] 0%";
            await typeOutput("Scanning system configuration...\n", 10);
            
            // Fast fake progress
            for(let i=1; i<=20; i++) {
              let bar = "█".repeat(i) + " ".repeat(20-i);
              setCurrentTypingText(`Scanning system configuration...\n[${bar}] ${i*5}%`);
              await new Promise(r => setTimeout(r, 80));
            }
            output = `[████████████████████] 100% - System enumeration complete\n\nIdentified standard structure.\nAuthentication mechanism detected.`;
          } else {
            output = "scan: target required. Try 'scan system'.";
            isError = true;
          }
          break;

        case 'hint':
          if (level === 1) {
            output = "Hint: Try listing files with 'ls' or examining 'hidden.log'";
          } else if (level === 2 && !isUnlocked) {
            output = "Hint: Use the decoded identity name with the 'unlock' command.";
          } else {
            output = "Hint: You have full access. Explore directories with 'ls' and 'cat'. Find classified/flag.txt";
          }
          break;

        case 'history':
          output = cmdHistory.slice(-10).map((c, i) => `  ${i+1}  ${c}`).join('\n');
          if (!output) output = "No command history.";
          break;

        // Easter Eggs
        case 'sudo':
          output = "Permission denied. Nice try 😏\nThis incident will be reported.";
          isError = true;
          break;
        case 'whoami':
          output = isUnlocked ? "Vyshnav Vinod (Authenticated)" : "guest_user\nYou are inside VyshnavOS";
          break;
        case 'exit':
          output = "You cannot leave yet 😎";
          break;
        case 'flag':
          output = isUnlocked ? "CTF{vapt_mindset_unlocked}" : "Nice try. Unlock the system first.";
          break;
          
        default:
          break;
      }
    }

    if (output) {
      if (baseCmd !== 'scan' || args[1] !== 'system') {
         await typeOutput(output, 15);
      }
      setHistory(prev => [...prev, { type: isError ? 'error' : 'output', text: output }]);
    }
    
    setCurrentTypingText('');
    setIsTyping(false);
  };

  // --- Input Handlers ---
  const handleSubmit = (e) => {
    e.preventDefault();
    if (isTyping || isBooting) return;
    
    handleCommand(inputValue);
    setInputValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmdHistory.length > 0) {
        const nextIndex = historyIndex + 1;
        if (nextIndex < cmdHistory.length) {
          setHistoryIndex(nextIndex);
          setInputValue(cmdHistory[cmdHistory.length - 1 - nextIndex]);
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        setInputValue(cmdHistory[cmdHistory.length - 1 - nextIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInputValue('');
      }
    }
  };

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setToastMsg('Copied to clipboard.');
      setTimeout(() => setToastMsg(''), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div 
      className="terminal-container" 
      ref={containerRef}
      onClick={() => {
        // Only focus if not clicking a selection
        if (window.getSelection().toString().length === 0) {
          inputRef.current?.focus();
        }
      }}
    >
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-4 right-4 bg-zinc-900 border border-cyan-500 text-cyan-400 px-4 py-2 rounded shadow-lg shadow-cyan-500/20 z-50">
          {toastMsg}
        </div>
      )}

      <div className="max-w-4xl mx-auto pb-8">
        {/* Render History */}
        {!isBooting && history.map((entry, idx) => (
          <div key={idx} className="mb-2">
            {entry.type === 'input' && (
              <div className="flex">
                <span className="prompt">guest@vyshnav-os:~$</span>
                <span className="text-cyan-400">{entry.text}</span>
              </div>
            )}
            {entry.type === 'output' && (
              <div className="terminal-output mt-1">
                <InteractiveOutput text={entry.text} onCopy={handleCopy} />
              </div>
            )}
            {entry.type === 'error' && (
              <div className="terminal-output error mt-1">
                {entry.text}
              </div>
            )}
          </div>
        ))}

        {/* Current Typing Animation */}
        {currentTypingText && (
          <div className="terminal-output mt-1">
            {currentTypingText}
            {isTyping && <span className="cursor"></span>}
          </div>
        )}

        {/* Input Area */}
        {!isBooting && !isTyping && (
          <form onSubmit={handleSubmit} className="terminal-input-row">
            <span className="prompt">guest@vyshnav-os:~$</span>
            <div className="relative flex-1 flex">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="terminal-input"
                autoComplete="off"
                spellCheck="false"
                autoFocus
              />
              {/* Virtual Cursor overlaid on text */}
              <span 
                className="cursor absolute pointer-events-none"
                style={{
                  left: `${inputValue.length}ch`,
                  top: '0'
                }}
              ></span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}