import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve, relative, extname } from 'node:path';
import assert from 'node:assert/strict';
const root = process.cwd();
async function walk(dir) { const files = []; for (const name of await readdir(dir)) { const path = resolve(dir, name); if ((await stat(path)).isDirectory()) files.push(...await walk(path)); else files.push(path); } return files; }
const publicFiles = await walk(resolve(root, 'public'));
for (const file of publicFiles) {
  assert(!/\.(pdf|env|docx|ps1|zip)$/i.test(file), `Private artifact in public: ${relative(root, file)}`);
  if (['.html', '.css', '.js', '.json', '.svg'].includes(extname(file))) {
    const text = await readFile(file, 'utf8');
    assert(!/(?:sk-[a-zA-Z0-9_-]{20,}|Bearer\s+[a-zA-Z0-9_-]{20,}|PRIVATE KEY-----)/.test(text), `Possible secret: ${relative(root, file)}`);
    assert(!/DE_Project\.pdf|student.?id|matriculation|D:[\\/]|C:[\\/]Users/i.test(text), `Private reference: ${relative(root, file)}`);
  }
}
const html = await readFile(resolve(root, 'public/index.html'), 'utf8');
for (const match of html.matchAll(/(?:src|href)="(\/[^"#]*)"/g)) await stat(resolve(root, 'public', '.' + match[1]));
assert(!/<script\b[^>]*>(?!\s*<\/script>)/.test(html.replace(/<script[^>]+src=[^>]*><\/script>/g, '')), 'Unexpected inline script');
const app = await readFile(resolve(root, 'public/app.js'), 'utf8');
assert(!/innerHTML|outerHTML|insertAdjacentHTML|\beval\(/.test(app), 'Unsafe text rendering');
const total = (await Promise.all(publicFiles.map(file => stat(file)))).reduce((sum, entry) => sum + entry.size, 0);
console.log(`Checked ${publicFiles.length} public assets, ${(total / 1048576).toFixed(2)} MiB. Links and public-file exposure checks passed.`);
