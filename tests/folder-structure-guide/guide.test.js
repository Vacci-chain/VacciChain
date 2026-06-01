'use strict';

/**
 * Test suite for docs/folder-structure.md guide coverage verification.
 *
 * Run from the repository root:
 *   cd backend && npx jest ../tests/folder-structure-guide/guide.test.js
 *
 * All relative paths are resolved from the repository root (process.cwd() when
 * Jest is invoked from the backend/ directory resolves to backend/, so we use
 * path.resolve(__dirname, '../..') to get the repo root reliably).
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Repo root — all paths in this suite are relative to this directory
// ---------------------------------------------------------------------------
const REPO_ROOT = path.resolve(__dirname, '../..');

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/**
 * Read `docs/folder-structure.md` as a UTF-8 string.
 *
 * @returns {string} The full content of the guide.
 */
function readGuide() {
  const guidePath = path.join(REPO_ROOT, 'docs', 'folder-structure.md');
  return fs.readFileSync(guidePath, 'utf8');
}

/**
 * Read a directory and return its filenames (not full paths).
 *
 * @param {string} dir  Path to the directory, relative to the repo root.
 * @param {object} [opts]
 * @param {string} [opts.extension]   If provided, only return files whose name
 *                                    ends with this string (e.g. '.js').
 * @param {string} [opts.exclude]     If provided, exclude files whose name
 *                                    ends with this string (e.g. '.test.jsx').
 * @param {boolean} [opts.filesOnly]  If true (default), skip sub-directories.
 * @returns {string[]} Array of filenames.
 */
function listFiles(dir, opts = {}) {
  const { extension, exclude, filesOnly = true } = opts;
  const absDir = path.join(REPO_ROOT, dir);
  const entries = fs.readdirSync(absDir, { withFileTypes: true });

  return entries
    .filter((entry) => {
      if (filesOnly && !entry.isFile()) return false;
      if (extension && !entry.name.endsWith(extension)) return false;
      if (exclude && entry.name.endsWith(exclude)) return false;
      return true;
    })
    .map((entry) => entry.name);
}

// ---------------------------------------------------------------------------
// Export helpers so sub-tasks can import them
// ---------------------------------------------------------------------------
module.exports = { readGuide, listFiles, REPO_ROOT };

// ---------------------------------------------------------------------------
// Placeholder test — confirms the helpers load and the test file is wired up
// ---------------------------------------------------------------------------
describe('guide.test.js bootstrap', () => {
  it('readGuide and listFiles helpers are exported functions', () => {
    expect(typeof readGuide).toBe('function');
    expect(typeof listFiles).toBe('function');
  });
});

// ---------------------------------------------------------------------------
// Requirement 4.2 — README link to the guide
// ---------------------------------------------------------------------------
describe('README.md contains a link to the Folder Structure Guide', () => {
  it('contains the markdown link [Folder Structure Guide](docs/folder-structure.md)', () => {
    const readmePath = path.join(REPO_ROOT, 'README.md');
    const readmeContent = fs.readFileSync(readmePath, 'utf8');
    expect(readmeContent).toContain('[Folder Structure Guide](docs/folder-structure.md)');
  });
});

// ---------------------------------------------------------------------------
// Task 4.2 — Smoke tests: file existence
// Requirements: 4.1, 4.3
// ---------------------------------------------------------------------------
describe('smoke tests — file existence', () => {
  it('docs/ directory exists at the repository root', () => {
    const docsDir = path.join(REPO_ROOT, 'docs');
    expect(fs.existsSync(docsDir)).toBe(true);
  });

  it('docs/folder-structure.md exists at the correct path', () => {
    const guidePath = path.join(REPO_ROOT, 'docs', 'folder-structure.md');
    expect(fs.existsSync(guidePath)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Requirement 5.5 — PR template checklist item
// ---------------------------------------------------------------------------
describe('PR template checklist item (Requirement 5.5)', () => {
  it('contains the folder-structure.md checklist item', () => {
    const templatePath = path.join(REPO_ROOT, '.github', 'pull_request_template.md');
    const content = fs.readFileSync(templatePath, 'utf8');
    expect(content).toContain(
      'If this PR adds a new directory or key file, I have updated `docs/folder-structure.md`'
    );
  });
});

// ---------------------------------------------------------------------------
// Task 4.5 — Structural sections
// ---------------------------------------------------------------------------

// Requirement 5.1 — "Keeping This Guide Up to Date" section
describe('"Keeping This Guide Up to Date" section', () => {
  it('docs/folder-structure.md contains a "Keeping This Guide Up to Date" section', () => {
    const guide = readGuide();
    expect(guide).toContain('Keeping This Guide Up to Date');
  });
});

// Requirement 5.4 — Last-reviewed date in YYYY-MM-DD format
describe('Last-reviewed date in YYYY-MM-DD format', () => {
  it('docs/folder-structure.md contains a date matching the YYYY-MM-DD pattern', () => {
    const guide = readGuide();
    expect(guide).toMatch(/\d{4}-\d{2}-\d{2}/);
  });
});

// Requirement 3.1 — "Separation of Concerns" section with all four service names
describe('"Separation of Concerns" section', () => {
  it('docs/folder-structure.md contains a "Separation of Concerns" section', () => {
    const guide = readGuide();
    expect(guide).toContain('Separation of Concerns');
  });

  it('Separation of Concerns section mentions Backend', () => {
    const guide = readGuide();
    expect(guide).toContain('Backend');
  });

  it('Separation of Concerns section mentions Smart Contract', () => {
    const guide = readGuide();
    expect(guide).toContain('Smart Contract');
  });

  it('Separation of Concerns section mentions Analytics Service', () => {
    const guide = readGuide();
    expect(guide).toContain('Analytics Service');
  });

  it('Separation of Concerns section mentions Frontend', () => {
    const guide = readGuide();
    expect(guide).toContain('Frontend');
  });
});

// Requirement 1.4 — Tooling-only directories are marked as not deployed
describe('Tooling-only directories are marked as not deployed', () => {
  const toolingDirs = ['.github/', 'scripts/', '.vscode/', '.kiro/'];

  for (const dir of toolingDirs) {
    it(`guide contains "not deployed" language near "${dir}"`, () => {
      const guide = readGuide();
      // Find the index of the directory name in the guide
      const dirIndex = guide.indexOf(dir);
      expect(dirIndex).toBeGreaterThanOrEqual(0);

      // Extract a window of text around the directory mention (±500 chars)
      const windowStart = Math.max(0, dirIndex - 100);
      const windowEnd = Math.min(guide.length, dirIndex + 500);
      const window = guide.slice(windowStart, windowEnd).toLowerCase();

      // The window should contain language indicating it is not deployed
      const notDeployedPattern = /not deployed|tooling|ci\/cd|editor config|local dev/;
      expect(window).toMatch(notDeployedPattern);
    });
  }
});
