/**
 * Ad tutarlılığı denetimi (model çağrısı yok) — skill / agent adları ve metinlerdeki atıflar birbirini tutuyor mu.
 * Yeni bir adım, skill veya agent eklerken kırık atıfları ve yazım hatalarını yakalar.
 *
 * Kullanım:
 *   node check-names.mjs [--root <repo veya proje kökü>]
 *
 * Kontroller:
 *   1. .claude/skills/*.md ve .claude/agents/*.md dosyalarında frontmatter `name:` = dosya adı
 *   2. Metinlerdeki her `ads-…` adı bir skill'e veya agent'a çıkıyor
 *      (izinli: ads-stage, ads-test; durum dosyası adları — /tmp/ads-migrate-a3f9.json, /tmp/ads-figma-use-…;
 *      tırnak içindeki geçici klasör önekleri — 'ads-runner-')
 *   3. Çift önek (`ads-ads-`) yok
 *   4. Eski ad kalıntısı yok: "ldf" yalnızca README'deki köken notunda ("türetildi") geçebilir
 *   5. .claude/commands/ varsa .claude/skills/ ile aynı dosyaları içeriyor (kurulumdaki kopya)
 *
 * Kapsam: yalnızca adStudio'nun kendi dosyaları (.claude/, scripts/, README.md, TESTING.md, CONTRIBUTING.md) —
 * kurulu bir projede kullanıcının kendi HTML / CSS'i taranmaz.
 *
 * Çıkış kodu: 0 sorun yok, 1 sorun var.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join, relative, basename, extname } from 'path';
import { argValue } from './lib/common.mjs';

const root = argValue('--root') ? argValue('--root') : join(import.meta.dirname, '..', '..');
const problems = [];
const TEXT = new Set(['.md', '.mjs', '.js', '.json', '.html', '.css', '.sh', '.yml', '.yaml']);
const ALLOWED = new Set(['ads-stage', 'ads-test']);

const listMd = dir => (existsSync(dir) ? readdirSync(dir).filter(f => f.endsWith('.md')) : []);
const skillsDir = join(root, '.claude', 'skills');
const agentsDir = join(root, '.claude', 'agents');
const skills = listMd(skillsDir).map(f => basename(f, '.md'));
const agents = listMd(agentsDir).map(f => basename(f, '.md'));
const known = new Set([...skills, ...agents]);

// 1. frontmatter name = dosya adı
for (const [dir, names] of [[skillsDir, skills], [agentsDir, agents]]) {
  for (const n of names) {
    const text = readFileSync(join(dir, `${n}.md`), 'utf8');
    const m = text.match(/^---[\s\S]*?^name:\s*(\S+)/m);
    if (!m) problems.push(`${relative(root, join(dir, n + '.md'))}: frontmatter name yok`);
    else if (m[1] !== n) problems.push(`${relative(root, join(dir, n + '.md'))}: name "${m[1]}" ≠ dosya adı "${n}"`);
  }
}

// Metin dosyalarını dolaş
function* walk(dir) {
  for (const e of readdirSync(dir)) {
    if (['node_modules', '.git', 'snapshots'].includes(e)) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (TEXT.has(extname(e))) yield p;
  }
}

const refRe = /(?<![\w-])ads-[a-z0-9]+(?:-[a-z0-9]+)*/g;
const scope = ['.claude', 'scripts', 'README.md', 'TESTING.md', 'CONTRIBUTING.md'].map(x => join(root, x)).filter(existsSync);
const files = scope.flatMap(x => (statSync(x).isDirectory() ? [...walk(x)] : [x]));
for (const p of files) {
  const rel = relative(root, p);
  if (rel.startsWith('.claude/commands/')) continue;   // skills'in kopyası; 5. kontrol ayrı
  // kendi açıklama metni ve öz-testteki bilerek hatalı örnekler
  if (['scripts/test/check-names.mjs', 'scripts/test/run-all.selftest.mjs'].includes(rel)) continue;
  const text = readFileSync(p, 'utf8');
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    // 2. atıflar
    for (const m of line.matchAll(refRe)) {
      const name = m[0];
      if (known.has(name) || ALLOWED.has(name)) continue;
      if (skills.some(s => name.startsWith(s + '-'))) continue;   // durum dosyası: ads-migrate-a3f9
      if (skills.some(s => !s.startsWith('ads-') && name.startsWith('ads-' + s))) continue;   // ads-figma-use-…
      const after = line.slice(m.index + name.length, m.index + name.length + 2);
      if (/^-['"`]/.test(after)) continue;   // tırnak içinde geçici klasör öneki: 'ads-runner-'
      problems.push(`${rel}:${i + 1}: bilinmeyen ad "${name}" (skill / agent yok)`);
    }
    // 3. çift önek
    if (/ads-ads-/.test(line)) problems.push(`${rel}:${i + 1}: çift önek "ads-ads-"`);
    // 4. eski ad kalıntısı
    if (/ldf/i.test(line) && !(rel === 'README.md' && /türetildi/.test(line))) {
      problems.push(`${rel}:${i + 1}: eski ad kalıntısı: ${line.trim().slice(0, 80)}`);
    }
  });
}

// 5. commands = skills
const commandsDir = join(root, '.claude', 'commands');
if (existsSync(commandsDir)) {
  const cmds = new Set(listMd(commandsDir));
  for (const f of listMd(skillsDir)) if (!cmds.has(f)) problems.push(`.claude/commands/${f} eksik (skills ile aynı olmalı)`);
}

for (const p of problems) console.log(`  ✗ ${p}`);
console.log(problems.length
  ? `[BAŞARISIZ] check-names — ${problems.length} sorun`
  : `[GEÇTİ] check-names — ${skills.length} skill, ${agents.length} agent, tüm atıflar tutarlı`);
process.exit(problems.length ? 1 : 0);
