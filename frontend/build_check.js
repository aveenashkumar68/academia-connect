const { execSync } = require('child_process');
const fs = require('fs');

try {
  const out = execSync('npx vite build', { 
    encoding: 'utf8', 
    maxBuffer: 5*1024*1024,
    env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' }
  });
  fs.writeFileSync('build_clean.log', 'SUCCESS\n' + out, 'utf8');
} catch(e) {
  const content = 'FAILED\nSTDOUT:\n' + (e.stdout || '') + '\n\nSTDERR:\n' + (e.stderr || '');
  fs.writeFileSync('build_clean.log', content, 'utf8');
}
