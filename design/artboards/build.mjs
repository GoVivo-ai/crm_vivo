// Genera los .dc.html de cada pantalla reutilizando el shell (helmet + sidebar + topbar) de Main.dc.html
// Uso: node build.mjs   (lee screens/<Name>.frag.html; la 1ª línea es JSON: {title, crumb, active, minh?, topExtra?})
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const main = readFileSync('Main.dc.html', 'utf8');
const contentStart = main.indexOf('<div class="content">');
const contentEndMarker = '    </div>\n  </div>\n</div>\n</x-dc>';
const contentEnd = main.lastIndexOf(contentEndMarker);
if (contentStart < 0 || contentEnd < 0) throw new Error('markers not found');
const head = main.slice(0, contentStart);
const tail = main.slice(contentEnd);

for (const f of readdirSync('screens')) {
  if (!f.endsWith('.frag.html')) continue;
  const raw = readFileSync('screens/' + f, 'utf8');
  const nl = raw.indexOf('\n');
  const cfg = JSON.parse(raw.slice(0, nl));
  const frag = raw.slice(nl + 1);
  let out = head
    .replace('<h1>Inicio 360</h1>', `<h1>${cfg.title}</h1>`)
    .replace('<span class="crumb">Agosto 2026 · consolidado COP</span>', `<span class="crumb">${cfg.crumb}</span>`);
  if (cfg.minh) out = out.replace('min-height:1024px', `min-height:${cfg.minh}px`);
  // mover el estado activo del sidebar
  out = out.split('\n').map(line => {
    if (!line.includes('class="sb-item')) return line;
    let l = line.replace('class="sb-item on"', 'class="sb-item"');
    if (l.includes(`>${cfg.active}<span class="odot"`)) l = l.replace('class="sb-item"', 'class="sb-item on"');
    return l;
  }).join('\n');
  const name = f.replace('.frag.html', '.dc.html');
  writeFileSync(name, out + '<div class="content">\n' + frag + '\n' + tail);
  console.log('built', name);
}
