import { cpSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const from = fileURLToPath(new URL('../node_modules/@coderline/alphatab/dist/', import.meta.url));
const to = fileURLToPath(new URL('../public/alphatab/', import.meta.url));

mkdirSync(`${to}font`, { recursive: true });
mkdirSync(`${to}soundfont`, { recursive: true });
cpSync(`${from}alphaTab.min.js`, `${to}alphaTab.min.js`);
for (const font of ['Bravura.woff2', 'Bravura.woff', 'Bravura.otf', 'Bravura-OFL.txt']) cpSync(`${from}font/${font}`, `${to}font/${font}`);
for (const file of ['sonivox.sf3', 'LICENSE']) cpSync(`${from}soundfont/${file}`, `${to}soundfont/${file}`);
