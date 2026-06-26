import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const srcRoot = path.join(root, 'src');

const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const walk = (dir, files = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else {
      files.push(fullPath);
    }
  }
  return files;
};

const toRelative = (filePath) => path.relative(root, filePath).replaceAll(path.sep, '/');
const sourceFiles = walk(srcRoot).filter((file) => /\.(ts|tsx|js|jsx)$/.test(file));
const violations = [];

for (const file of sourceFiles) {
  const relative = toRelative(file);
  const text = fs.readFileSync(file, 'utf8');

  if (relative !== 'src/api/client.ts' && /axios\.create\s*\(/.test(text)) {
    violations.push(`${relative}: creates its own axios client instead of using src/api/client.ts`);
  }

  if (/from ['"]\.\.\/auth\/useAuth['"]|from ['"]\.\/useAuth['"]/.test(text) && /import\s*\{[^}]*\bapi\b/.test(text)) {
    violations.push(`${relative}: imports the legacy api export from auth/useAuth`);
  }

  if (/assets\/audio|require\s*\(\s*['"][^'"]*assets\/audio/.test(text)) {
    violations.push(`${relative}: references local bundled audio assets`);
  }

  if (relative.endsWith('.jsx')) {
    violations.push(`${relative}: stale JSX fallback file remains in src`);
  }
}

const app = read('App.tsx');
for (const screen of ['BreathingFormScreen', 'MeditationFormScreen']) {
  if (!new RegExp(`import\\s+${screen}\\s+from`).test(app)) {
    violations.push(`App.tsx: missing ${screen} import`);
  }
  if (!new RegExp(`name=["']${screen.replace('Screen', '')}["'][^>]*component=\\{${screen}\\}`).test(app)) {
    violations.push(`App.tsx: missing ${screen} stack route`);
  }
}

if (violations.length > 0) {
  console.error('API client usage check failed:');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log('API client usage check passed.');
