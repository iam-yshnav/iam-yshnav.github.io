export const FILE_SYSTEM = {
  "/": { type: "dir", perms: ["GUEST", "AUTHENTICATED", "ROOT"] },
  "/home": { type: "dir", perms: ["GUEST", "AUTHENTICATED", "ROOT"] },
  "/home/guest": { type: "dir", perms: ["GUEST", "AUTHENTICATED", "ROOT"] },
  "/home/guest/identity": { type: "dir", perms: ["GUEST", "AUTHENTICATED", "ROOT"] },
  "/home/guest/identity/profile.txt": { 
    type: "file", 
    perms: ["GUEST", "AUTHENTICATED", "ROOT"], 
    content: "Name: Vyshnav Vinod\nRole: Cybersecurity & VAPT Analyst\nEducation: B.Tech Cybersecurity (KTU)\nPassion: Ethical hacking, security research, penetration testing"
  },
  "/home/guest/capabilities": { type: "dir", perms: ["GUEST", "AUTHENTICATED", "ROOT"] },
  "/home/guest/capabilities/skills.txt": { 
    type: "file", 
    perms: ["GUEST", "AUTHENTICATED", "ROOT"], 
    content: "Web Security\nVAPT\nNetworking\nPython\nOSINT\nLinux Admin"
  },
  "/home/guest/operations": { type: "dir", perms: ["GUEST", "AUTHENTICATED", "ROOT"] },
  "/home/guest/operations/projects.log": { 
    type: "file", 
    perms: ["GUEST", "AUTHENTICATED", "ROOT"], 
    content: "[+] Sentinel\n[+] SEO Optimization\n[+] Web App Security Testing\n[+] VAPT Assessments"
  },
  "/home/guest/arsenal": { type: "dir", perms: ["GUEST", "AUTHENTICATED", "ROOT"] },
  "/home/guest/arsenal/tools.list": { 
    type: "file", 
    perms: ["GUEST", "AUTHENTICATED", "ROOT"], 
    content: "burpsuite\nnmap\nwireshark\nnessus\npostman\nmetasploit"
  },
  "/home/guest/communication": { type: "dir", perms: ["GUEST", "AUTHENTICATED", "ROOT"] },
  "/home/guest/communication/contact.sec": { 
    type: "file", 
    perms: ["GUEST", "AUTHENTICATED", "ROOT"], 
    content: "Email: vyshnav@example.com\nPortfolio: /home/vyshnav\nGitHub: github.com/vyshnav\nLinkedIn: linkedin.com/in/vyshnav\nStatus: Active"
  },
  "/home/guest/classified": { type: "dir", perms: ["AUTHENTICATED", "ROOT"] },
  "/home/guest/classified/flag.txt": { 
    type: "file", 
    perms: ["AUTHENTICATED", "ROOT"], 
    content: "FLAG{vapt_mindset_unlocked}"
  },
  "/home/guest/.hidden_log": { 
    type: "file", 
    hidden: true,
    perms: ["GUEST", "AUTHENTICATED", "ROOT"], 
    content: "VnlzaG5hdiBWaW5vZA==" // Vyshnav Vinod
  },
  "/home/guest/.access_log": { 
    type: "file", 
    hidden: true,
    perms: ["GUEST", "AUTHENTICATED", "ROOT"], 
    content: "[WARNING] Unauthorized access detected.\nHint: Use 'unlock <username>' to elevate privileges. (Check decoded identity)"
  },
  "/var": { type: "dir", perms: ["GUEST", "AUTHENTICATED", "ROOT"] },
  "/var/log": { type: "dir", perms: ["GUEST", "AUTHENTICATED", "ROOT"] },
  "/var/log/system.log": { 
    type: "file", 
    perms: ["GUEST", "AUTHENTICATED", "ROOT"], 
    content: "BOOT LOG SEQUENCE INITIATED...\nLoading kernel modules...\nMounting file systems...\n[!] ALERT: Root access requires strict verification.\n[!] Password hint stored in sector 7: 'vapt_mindset'\nUse 'sudo access' when ready."
  },
  "/root": { type: "dir", perms: ["ROOT"] },
  "/root/secret.txt": { 
    type: "file", 
    perms: ["ROOT"], 
    content: "CONGRATULATIONS. You have achieved ROOT access.\nThis system is fully compromised.\n\nThank you for exploring this interactive portfolio.\n- Vyshnav"
  }
};

export function normalizePath(currentDir, targetPath) {
  if (!targetPath) return currentDir;
  
  // Handle ~ expansion
  if (targetPath.startsWith('~')) {
    targetPath = '/home/guest' + targetPath.slice(1);
  }

  let base = targetPath.startsWith('/') ? '/' : currentDir;
  const parts = (base + '/' + targetPath).split('/').filter(p => p && p !== '.');
  const stack = [];
  
  for (const p of parts) {
    if (p === '..') stack.pop();
    else stack.push(p);
  }
  
  return '/' + stack.join('/');
}

export function checkPermission(path, accessLevel) {
  const node = FILE_SYSTEM[path];
  if (!node) return false;
  return node.perms.includes(accessLevel);
}

export function getDirContents(dirPath, showHidden, accessLevel) {
  const normalizedDir = dirPath === '/' ? '/' : dirPath + '/';
  const results = [];
  
  for (const [path, node] of Object.entries(FILE_SYSTEM)) {
    if (path === dirPath) continue; // Skip the dir itself
    
    if (path.startsWith(normalizedDir)) {
      const remainder = path.slice(normalizedDir.length);
      // Only get direct children (no slashes in remainder)
      if (!remainder.includes('/')) {
        if (!showHidden && remainder.startsWith('.')) continue;
        
        // Return if they have permission, or return it locked
        const hasPerm = node.perms.includes(accessLevel);
        results.push({
          name: remainder,
          type: node.type,
          hasPerm,
          hidden: !!node.hidden
        });
      }
    }
  }
  return results;
}