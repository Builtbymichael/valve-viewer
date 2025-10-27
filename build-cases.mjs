import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const CASES_DIR = path.join(ROOT, 'cases');
const OUT_JSON = path.join(ROOT, 'cases.json');
const ALLOWED_EXTS = new Set(['.3mf', '.stl']);

function isAllowed(file){ return ALLOWED_EXTS.has(path.extname(file).toLowerCase()); }

async function main() {
  const entries = await fs.readdir(CASES_DIR, { withFileTypes: true });
  const cases = [];

  for (const dirent of entries) {
    if (!dirent.isDirectory()) continue;
    const id = dirent.name;                 
    const basePath = `cases/${id}/`;
    const files = (await fs.readdir(path.join(CASES_DIR, id)))
      .filter(isAllowed)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    if (files.length === 0) continue;

    cases.push({ id, name: id, basePath, files });
  }

  cases.sort((a,b)=>a.id.localeCompare(b.id, undefined, { numeric:true }));
  await fs.writeFile(OUT_JSON, JSON.stringify({ cases }, null, 2), 'utf-8');
  console.log(`Wrote ${OUT_JSON} with ${cases.length} case(s).`);
}
main().catch(err => { console.error(err); process.exit(1); });
