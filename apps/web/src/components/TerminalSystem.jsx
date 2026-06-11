import React, { useState, useRef, useEffect } from 'react';
import TerminalDisplay from './TerminalDisplay.jsx';
import TerminalInput from './TerminalInput.jsx';
import { processCommand, handleTabCompletion } from '../utils/CommandProcessor.js';

export default function TerminalSystem() {
  const [history, setHistory] = useState([
    { 
      type: 'output', 
      content: "VyshnavOS [Version 2.0.4]\n(c) 2026 Vyshnav Vinod. All rights reserved.\n\nType 'help' for available commands.\nHint: Escalate privileges to unlock classified sections.",
      colorCode: 'success'
    }
  ]);
  const [input, setInput] = useState('');
  
  // Game State
  const [user, setUser] = useState('guest');
  const [accessLevel, setAccessLevel] = useState('GUEST');
  const [currentPath, setCurrentPath] = useState('/home/guest');
  const [lastEncoded, setLastEncoded] = useState('');
  const [passwordMode, setPasswordMode] = useState(false);
  
  const [milestones, setMilestones] = useState({
    recon: false,
    enum: false,
    access: false,
    root: false
  });

  // Command History State
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const outputRef = useRef(null);

  const scrollToBottom = () => {
    if (outputRef.current) {
      outputRef.current.scrollTo({
        top: outputRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Auto-scroll when history changes
  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM has updated
    requestAnimationFrame(() => {
      scrollToBottom();
    });
  }, [history]);

  const getPrompt = () => {
    if (passwordMode) return "[sudo] password for root:";
    let pathDisplay = currentPath === `/home/${user}` ? '~' : currentPath;
    if (user === 'guest' && currentPath === '/home/guest') pathDisplay = '~';
    const symbol = accessLevel === 'ROOT' ? '#' : '$';
    return `${user}@vyshnav-os:${pathDisplay}${symbol}`;
  };

  const executeCommand = () => {
    const trimmed = input.trim();
    const currentPrompt = getPrompt();
    
    // Add command to display history
    setHistory(prev => [...prev, { 
      type: 'command', 
      prompt: currentPrompt, 
      command: passwordMode ? '********' : input 
    }]);
    
    setInput('');
    setHistoryIndex(-1);

    if (!trimmed && !passwordMode) return;

    if (passwordMode) {
      setPasswordMode(false);
      if (trimmed.toLowerCase() === 'vapt_mindset') {
        setUser('root');
        setAccessLevel('ROOT');
        setMilestones(m => ({ ...m, root: true }));
        setHistory(prev => [...prev, { 
          type: 'output', 
          content: "[!] AUTHENTICATION SUCCESSFUL.\n[!] ROOT PRIVILEGES GRANTED.",
          colorCode: 'success'
        }]);
      } else {
        setHistory(prev => [...prev, { 
          type: 'output', 
          content: "su: Authentication failure",
          colorCode: 'error'
        }]);
      }
      return;
    }

    // Update command history for up/down navigation
    setCommandHistory(prev => [...prev, trimmed]);

    // Process command
    const stateSnapshot = { currentPath, user, accessLevel, milestones, lastEncoded };
    const result = processCommand(trimmed, stateSnapshot);
    
    if (result.clear) {
      setHistory([]);
      return;
    }
    
    if (result.newPath) setCurrentPath(result.newPath);
    if (result.newUser) setUser(result.newUser);
    if (result.newAccessLevel) setAccessLevel(result.newAccessLevel);
    if (result.updateMilestones) setMilestones(result.updateMilestones);
    if (result.lastEncoded) setLastEncoded(result.lastEncoded);
    if (result.requestPassword) setPasswordMode(true);
    
    let finalOutput = result.output;
    if (result.showHistory) {
      finalOutput = commandHistory.concat(trimmed).map((cmd, i) => `  ${i+1}  ${cmd}`).join('\n');
    }

    if (finalOutput) {
      setHistory(prev => [...prev, { 
        type: 'output', 
        content: finalOutput,
        colorCode: result.colorCode || 'success'
      }]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeCommand();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const nextIndex = historyIndex + 1;
        if (nextIndex < commandHistory.length) {
          setHistoryIndex(nextIndex);
          setInput(commandHistory[commandHistory.length - 1 - nextIndex]);
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        setInput(commandHistory[commandHistory.length - 1 - nextIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (passwordMode) return;
      
      const { input: newStr, matches } = handleTabCompletion(input, currentPath, accessLevel);
      setInput(newStr);
      
      if (matches.length > 0) {
        setHistory(prev => [
          ...prev,
          { type: 'command', prompt: getPrompt(), command: input },
          { type: 'output', content: matches.join('  '), colorCode: 'success' }
        ]);
      }
    }
  };

  return (
    <div className="terminal-container">
      <TerminalDisplay 
        ref={outputRef}
        history={history} 
      />
      <TerminalInput 
        prompt={getPrompt()}
        value={input}
        onChange={setInput}
        onSubmit={executeCommand}
        onKeyDown={handleKeyDown}
        passwordMode={passwordMode}
      />
    </div>
  );
}