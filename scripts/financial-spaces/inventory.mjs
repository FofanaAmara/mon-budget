/** Static migration inventory; prints metadata only, never loads .env or DB. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sourceRoots = ['app', 'components', 'lib'];
const policies = {
  claim: {
    hasOrphanedData: ['legacy', 'Disable public orphan discovery after migration.'],
    claimOrphanedData: ['legacy', 'Remove public claim; no authenticated user may appropriate unclaimed data.'],
    ensureDefaultSections: ['financial', 'Initialize sections only inside an explicitly authorized space.'],
  },
  settings: {
    getSettings: ['mixed', 'Split account contact/notification preferences from space currency/reminder defaults.'],
    updateSettings: ['mixed', 'Same split; account fields never grant access to another member profile.'],
  },
  'onboarding-carousel': {
    hasSeenOnboarding: ['individual', 'Presentation consent stays per account.'],
    markOnboardingSeen: ['individual', 'Presentation consent stays per account.'],
  },
  'demo-data': {
    hasUserData: ['financial', 'Query selected space only.'],
    loadDemoData: ['mixed', 'Financial demo rows belong to selected space; preserve individual account settings.'],
    clearAllUserData: ['mixed', 'Reset financial data in named space only; preserve subscriptions, account and other spaces.'],
  },
};

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(file) : /\.[cm]?[jt]sx?$/.test(file) ? [file] : [];
  });
}
const relative = file => path.relative(root, file).split(path.sep).join('/');
const parse = file => ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
const sources = sourceRoots.flatMap(directory => walk(path.join(root, directory))).map(file => ({ file, ast: parse(file) }));
const tables = new Set(JSON.parse(fs.readFileSync(path.join(root, '.Codex/plans/espaces-financiers-evidence/schema-live.json'), 'utf8')).columns.map(item => item.table_name));
const actions = [];

for (const { file, ast } of sources.filter(item => relative(item.file).startsWith('lib/actions/'))) {
  const module = path.basename(file, '.ts');
  for (const node of ast.statements) {
    if (!ts.isFunctionDeclaration(node) || !node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) continue;
    if (!node.name || !node.modifiers.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword)) {
      throw new Error('Unclassified server export in ' + relative(file));
    }
    const name = node.name.text;
    const [scope, rationale] = policies[module]?.[name] ?? ['financial', 'Require membership and scope all SQL, parent IDs, generation, revalidation and side effects to explicit space ID.'];
    const referencedTables = new Set();
    const calls = new Set();
    const sqlSites = [];
    function visit(child) {
      if (ts.isCallExpression(child)) calls.add(child.expression.getText(ast));
      if (ts.isTaggedTemplateExpression(child) && child.tag.getText(ast) === 'sql') {
        const text = child.template.getText(ast);
        for (const table of tables) if (new RegExp('\\b' + table + '\\b', 'i').test(text)) referencedTables.add(table);
        sqlSites.push(ast.getLineAndCharacterOfPosition(child.getStart(ast)).line + 1);
      }
      ts.forEachChild(child, visit);
    }
    visit(node);
    actions.push({ file: relative(file), export: name, line: ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1,
      scope, rationale, tables: [...referencedTables].sort(), sqlSites, calls: [...calls].sort(), callers: [] });
  }
}

for (const { file, ast } of sources) {
  const imported = new Map();
  for (const node of ast.statements) {
    if (!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier)) continue;
    const specifier = node.moduleSpecifier.text;
    const resolved = specifier.startsWith('@/') ? specifier.slice(2)
      : specifier.startsWith('.') ? relative(path.resolve(path.dirname(file), specifier)) : null;
    if (!resolved?.startsWith('lib/actions/')) continue;
    const binding = node.importClause?.namedBindings;
    if (binding && ts.isNamedImports(binding)) {
      for (const item of binding.elements) imported.set(item.name.text, { module: resolved.replace(/\.ts$/, '') + '.ts', name: (item.propertyName ?? item.name).text });
    } else throw new Error('Action import requires explicit inventory support in ' + relative(file));
  }
  function visit(node) {
    if (ts.isIdentifier(node) && imported.has(node.text) && !ts.isImportSpecifier(node.parent)) {
      const binding = imported.get(node.text);
      const action = actions.find(item => item.file === binding.module && item.export === binding.name);
      // Imported server types are intentionally excluded from executable actions.
      if (action) action.callers.push({ file: relative(file), line: ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1,
        usage: ts.isCallExpression(node.parent) ? 'call' : 'reference' });
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
}

const outsideActionSql = [];
for (const { file, ast } of sources.filter(item => !relative(item.file).startsWith('lib/actions/'))) {
  function visit(node) {
    if (ts.isTaggedTemplateExpression(node) && node.tag.getText(ast) === 'sql') {
      const text = node.template.getText(ast);
      outsideActionSql.push({ file: relative(file), line: ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1,
        tables: [...tables].filter(table => new RegExp('\\b' + table + '\\b', 'i').test(text)) });
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
}
console.log(JSON.stringify({ purpose: 'Baseline for explicit-space migration; not evidence that isolation is implemented.',
  limits: 'Static references, including callbacks. Direct SQL table matches are lexical; helper call chains must be reviewed during migration.',
  modules: new Set(actions.map(item => item.file)).size, count: actions.length,
  scopes: Object.fromEntries(['financial', 'individual', 'mixed', 'legacy'].map(scope => [scope, actions.filter(item => item.scope === scope).length])),
  actions, outsideActionSql }, null, 2));
