import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

// NEW: updated folders
const CASES_DIR = path.join(ROOT, 'valve-cases');
const MODELS_DIR = path.join(ROOT, 'valve-models');

const OUT_JSON = path.join(ROOT, 'cases.json');

// For now we keep support to 3MF + STL.
// We'll add GLB support when the viewer has a GLB loader wired in.
const ALLOWED_EXTS = new Set(['.3mf', '.stl']);

function isAllowed(file) {
  return ALLOWED_EXTS.has(path.extname(file).toLowerCase());
}

async function buildCases() {
  const cases = [];
  let entries;

  try {
    entries = await fs.readdir(CASES_DIR, { withFileTypes: true });
  } catch (err) {
    console.error(`Failed to read cases directory: ${CASES_DIR}`);
    throw err;
  }

  for (const dirent of entries) {
    if (!dirent.isDirectory()) continue;

    const id = dirent.name; // e.g. "case-001"
    const caseDir = path.join(CASES_DIR, id);

    let files = await fs.readdir(caseDir);
    files = files.filter(isAllowed);

    if (files.length === 0) continue;

    files.sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true })
    );

    const basePath = `valve-cases/${id}/`;

    cases.push({
      id,          // "case-001"
      name: id,    // display name (we can prettify later if needed)
      basePath,    // path prefix used by the viewer
      files        // file names only
    });
  }

  // Sort cases nicely (numeric-aware)
  cases.sort((a, b) =>
    a.id.localeCompare(b.id, undefined, { numeric: true })
  );

  return cases;
}

async function buildModels() {
  const models = [];
  let entries;

  try {
    entries = await fs.readdir(MODELS_DIR, { withFileTypes: true });
  } catch (err) {
    // If there is no models folder yet, just return empty.
    if (err.code === 'ENOENT') {
      console.warn(`Models directory not found, skipping: ${MODELS_DIR}`);
      return models;
    }
    throw err;
  }

  for (const dirent of entries) {
    if (!dirent.isDirectory()) continue;

    const id = dirent.name; // e.g. "model-004"
    const modelDir = path.join(MODELS_DIR, id);

    let files = await fs.readdir(modelDir);
    files = files.filter(isAllowed);

    if (files.length === 0) continue;

    files.sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true })
    );

    const basePath = `valve-models/${id}/`;

    models.push({
      id,          // "model-004"
      name: id,    // display name (can prettify later)
      basePath,
      files
    });
  }

  models.sort((a, b) =>
    a.id.localeCompare(b.id, undefined, { numeric: true })
  );

  return models;
}

async function main() {
  const cases = await buildCases();
  const models = await buildModels();

  const payload = { cases, models };

  await fs.writeFile(OUT_JSON, JSON.stringify(payload, null, 2), 'utf-8');
  console.log(
    `Wrote ${OUT_JSON} with ${cases.length} case(s) and ${models.length} model(s).`
  );
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
