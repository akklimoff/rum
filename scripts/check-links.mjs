import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const dist = new URL('../dist/', import.meta.url).pathname;

function htmlFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return htmlFiles(path);
    return name.endsWith('.html') ? [path] : [];
  });
}

function resolves(href) {
  const path = decodeURIComponent(href.split(/[?#]/)[0]);
  const target = join(dist, path);
  if (!existsSync(target)) return existsSync(`${target}.html`);
  return statSync(target).isFile() || existsSync(join(target, 'index.html'));
}

if (!existsSync(dist)) {
  console.error('dist/ not found: run npm run build first');
  process.exit(1);
}

const broken = [];
for (const file of htmlFiles(dist)) {
  const html = readFileSync(file, 'utf8');
  for (const [, href] of html.matchAll(/href="(\/[^"]*)"/g)) {
    if (!resolves(href)) broken.push(`${file.slice(dist.length)} -> ${href}`);
  }
}

if (broken.length > 0) {
  console.error(`broken links:\n${broken.join('\n')}`);
  process.exit(1);
}
console.log('links ok');
