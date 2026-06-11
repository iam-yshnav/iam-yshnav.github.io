import { FILE_SYSTEM, normalizePath, getDirContents, checkPermission } from './FileSystem.js';

const VALID_COMMANDS = ['ls', 'cd', 'pwd', 'cat', 'clear', 'decode', 'whoami', 'id', 'unlock', 'sudo', 'help', 'hint', 'history', 'exit', 'flag'];

export function processCommand(input, state) {
  const { currentPath, user, accessLevel, milestones, lastEncoded } = state;
  const args = input.trim().split(/\s+/).filter(Boolean);

  if (args.length === 0) {
    return { output: "", colorCode: "success" };
  }

  const cmd = args[0].toLowerCase();
  let output = "";
  let colorCode = "success";
  let newState = {};

  switch (cmd) {
    case 'ls': {
      const isLa = args[1] === '-la' || args[1] === '-al' || args[1] === '-a' || args[1] === '-l';
      const targetArg = (isLa && args[2]) ? args[2] : (args[1] !== '-la' && args[1] !== '-al' && args[1] !== '-a' && args[1] !== '-l' ? args[1] : '');
      const targetPath = normalizePath(currentPath, targetArg);

      if (!FILE_SYSTEM[targetPath]) {
        output = `ls: cannot access '${targetArg || targetPath}': No such file or directory`;
        colorCode = "error";
        break;
      }
      if (FILE_SYSTEM[targetPath].type !== 'dir') {
        output = targetArg || targetPath;
        break;
      }
      if (!checkPermission(targetPath, accessLevel)) {
        output = `ls: cannot open directory '${targetArg || targetPath}': Permission denied`;
        colorCode = "error";
        break;
      }

      const contents = getDirContents(targetPath, isLa, accessLevel);
      if (contents.length === 0) {
        output = "";
      } else {
        if (isLa) {
          output = "total " + (contents.length * 4) + "\n";
          output += "drwxr-xr-x 2 " + (user) + " user 4096 .\n";
          output += "drwxr-xr-x 3 " + (user) + " user 4096 ..\n";
          output += contents.map(item => {
            const perms = item.type === 'dir' ? 'drwxr-xr-x' : '-rw-r--r--';
            return `${perms} 1 ${item.hasPerm ? user : 'root'} ${item.hasPerm ? 'user' : 'root'} 4096 ${item.name}`;
          }).join('\n');
        } else {
          output = contents.map(i => i.type === 'dir' ? `<span class="text-[#00FFFF] drop-shadow-[0_0_5px_rgba(0,255,255,0.6)] font-bold">${i.name}/</span>` : i.name).join('  ');
        }
      }

      if (isLa && !milestones.recon) {
        newState.updateMilestones = { ...milestones, recon: true };
      }
      break;
    }

    case 'cd': {
      const target = args[1] || '~';
      const newPath = normalizePath(currentPath, target);

      if (!FILE_SYSTEM[newPath]) {
        output = `bash: cd: ${target}: No such file or directory`;
        colorCode = "error";
      } else if (FILE_SYSTEM[newPath].type !== 'dir') {
        output = `bash: cd: ${target}: Not a directory`;
        colorCode = "error";
      } else if (!checkPermission(newPath, accessLevel)) {
        output = `bash: cd: ${target}: Permission denied`;
        colorCode = "error";
      } else {
        newState.newPath = newPath;
      }
      break;
    }

    case 'pwd': {
      output = currentPath;
      break;
    }

    case 'cat': {
      if (!args[1]) {
        output = "cat: missing file operand";
        colorCode = "error";
        break;
      }
      const target = normalizePath(currentPath, args[1]);

      if (!FILE_SYSTEM[target]) {
        output = `cat: ${args[1]}: No such file or directory`;
        colorCode = "error";
      } else if (FILE_SYSTEM[target].type === 'dir') {
        output = `cat: ${args[1]}: Is a directory. Use 'cd ${args[1]}' instead.`;
        colorCode = "error";
      } else if (!checkPermission(target, accessLevel)) {
        output = `cat: ${args[1]}: Permission denied`;
        colorCode = "error";
      } else {
        output = FILE_SYSTEM[target].content;
        if (target.endsWith('.hidden_log')) {
          newState.lastEncoded = FILE_SYSTEM[target].content;
        }
      }
      break;
    }

    case 'clear': {
      newState.clear = true;
      break;
    }

    case 'whoami': {
      output = user;
      break;
    }

    case 'id': {
      if (user === 'root') {
        output = "uid=0(root) gid=0(root) groups=0(root)";
      } else if (user === 'vyshnav') {
        output = "uid=1000(vyshnav) gid=1000(vyshnav) groups=1000(vyshnav),27(sudo)";
      } else {
        output = "uid=1001(guest) gid=1001(guest) groups=1001(guest)";
      }
      break;
    }

    case 'decode': {
      if (!args[1]) {
        output = "decode: missing operand\nUsage: decode <text> | decode auto | decode <filename>";
        colorCode = "error";
        break;
      }

      let toDecode = args.slice(1).join(' ');

      if (toDecode === 'auto') {
        toDecode = lastEncoded || '';
        if (!toDecode) {
          output = "decode: no encoded string in memory. Try reading a file first.";
          colorCode = "error";
          break;
        }
      } else {
        const fileTarget = normalizePath(currentPath, args[1]);
        if (FILE_SYSTEM[fileTarget] && FILE_SYSTEM[fileTarget].type === 'file') {
          if (checkPermission(fileTarget, accessLevel)) {
            toDecode = FILE_SYSTEM[fileTarget].content;
          }
        }
      }

      try {
        const decoded = atob(toDecode);
        output = `[DECODED]: ${decoded}`;

        if (decoded === 'Vyshnav Vinod' && !milestones.enum) {
          output += "\n\n[SYSTEM HINT]: Identity confirmed. You may now 'unlock vyshnav'.";
          newState.updateMilestones = { ...milestones, enum: true };
        }
      } catch (e) {
        output = "decode: invalid base64 payload.";
        colorCode = "error";
      }
      break;
    }

    case 'unlock': {
      if (!args[1]) {
        output = "unlock: missing username";
        colorCode = "error";
        break;
      }
      if (args[1].toLowerCase() === 'vyshnav') {
        if (accessLevel === 'ROOT') {
          output = "Already operating at maximum privilege level.";
          colorCode = "info";
        } else {
          output = "[+] Access Granted.\nPrivilege level updated: AUTHENTICATED\nNew directories available.";
          newState.newUser = 'vyshnav';
          newState.newAccessLevel = 'AUTHENTICATED';
          if (!milestones.access) {
            newState.updateMilestones = { ...milestones, access: true };
          }
        }
      } else {
        output = "[-] Access Denied. Unknown identity.";
        colorCode = "error";
      }
      break;
    }

    case 'sudo': {
      if (args[1] === 'access' || args[1] === 'su' || args[1] === '-i') {
        newState.requestPassword = true;
        output = "";
      } else if (args[1] === 'root') {
        output = "Nice try. Use 'sudo access' to escalate privileges properly.";
        colorCode = "error";
      } else {
        output = "sudo: command requires interactive escalation. Try 'sudo access'";
        colorCode = "error";
      }
      break;
    }

    case 'help': {
      output = `<div class="help-grid">
  <div class="help-section">AVAILABLE COMMANDS:</div>
  <div class="help-row"><span>ls [-la]</span><span>List directory contents</span></div>
  <div class="help-row"><span>cd &lt;dir&gt;</span><span>Change working directory</span></div>
  <div class="help-row"><span>pwd</span><span>Print working directory</span></div>
  <div class="help-row"><span>cat &lt;file&gt;</span><span>Display file contents</span></div>
  <div class="help-row"><span>clear</span><span>Clear terminal screen</span></div>
  <div class="help-row"><span>decode &lt;arg&gt;</span><span>Decode Base64 (arg: text, auto, or filename)</span></div>
  <div class="help-row"><span>whoami</span><span>Display current user</span></div>
  <div class="help-row"><span>id</span><span>Display user identity info</span></div>
  <div class="help-row"><span>history</span><span>Show command history</span></div>
  <div class="help-row"><span>hint</span><span>Get contextual help</span></div>
  
  <div class="help-section mt-4">PRIVILEGE ESCALATION:</div>
  <div class="help-row"><span>unlock &lt;user&gt;</span><span>Unlock authenticated access</span></div>
  <div class="help-row"><span>sudo access</span><span>Attempt root privilege escalation</span></div>
</div>`;
      break;
    }

    case 'hint': {
      if (accessLevel === 'ROOT') {
        output = "You are root. Explore /root/secret.txt";
      } else if (accessLevel === 'AUTHENTICATED') {
        output = "You have authenticated access. Look for system logs that might contain passwords, maybe in /var/log/?";
      } else if (milestones.enum) {
        output = "You decoded the identity. Try 'unlock vyshnav'.";
      } else if (milestones.recon) {
        output = "You found a hidden file. Try reading it and decoding its contents.";
      } else {
        output = "Start with basic recon. Try 'ls -la' to find hidden files.";
      }
      colorCode = "info";
      break;
    }

    case 'history': {
      newState.showHistory = true;
      break;
    }

    case 'exit': {
      output = "There is no escape. The terminal is eternal. 😎";
      colorCode = "info";
      break;
    }

    case 'flag': {
      if (accessLevel === 'AUTHENTICATED' || accessLevel === 'ROOT') {
        output = "You already know where to find it. Check /home/guest/classified/flag.txt";
      } else {
        output = "Access denied. Privilege escalation required.";
        colorCode = "error";
      }
      break;
    }

    default: {
      const suggestion = VALID_COMMANDS.find(c => c.startsWith(cmd.substring(0, 2)) || cmd.includes(c));
      output = `bash: ${cmd}: command not found`;
      colorCode = "error";
      if (suggestion) {
        output += `\nDid you mean '${suggestion}'?`;
        newState.suggestions = [suggestion];
      }
      break;
    }
  }

  return { output, colorCode, ...newState };
}

export function handleTabCompletion(input, currentPath, accessLevel) {
  const parts = input.split(' ');
  const toComplete = parts[parts.length - 1];

  const isPath = toComplete.includes('/');

  let targetDir = currentPath;
  let partial = toComplete;

  if (isPath) {
    const lastSlash = toComplete.lastIndexOf('/');
    const dirStr = toComplete.substring(0, lastSlash);
    targetDir = normalizePath(currentPath, dirStr || '/');
    partial = toComplete.substring(lastSlash + 1);
  }

  const contents = getDirContents(targetDir, true, accessLevel);
  const matches = contents.filter(c => c.name.startsWith(partial));

  if (matches.length === 1) {
    const match = matches[0];
    const prefix = isPath ? toComplete.substring(0, toComplete.lastIndexOf('/') + 1) : '';
    const completed = prefix + match.name + (match.type === 'dir' ? '/' : '');
    parts[parts.length - 1] = completed;
    return { input: parts.join(' '), matches: [] };
  } else if (matches.length > 1) {
    return { input, matches: matches.map(m => m.type === 'dir' ? m.name + '/' : m.name) };
  }

  return { input, matches: [] };
}