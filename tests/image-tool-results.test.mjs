import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import extension from '../extensions/image-tool-results.ts';

const handlers = new Map();
extension({ on: (name, handler) => handlers.set(name, handler) });
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
function fixture(t) {
  const cwd = mkdtempSync(join(tmpdir(), 'pi-images-'));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  writeFileSync(join(cwd, 'sample.png'), png);
  return cwd;
}
function read(path, extra = {}) {
  return { toolName: 'read', input: { path }, content: [{ type: 'text', text: 'read result' }], isError: false, ...extra };
}
test('appends concise capability guidance without replacing or repeating the prompt', async () => {
  const handler = handlers.get('before_agent_start');
  assert.equal(typeof handler, 'function');
  const first = await handler({ systemPrompt: 'Existing instructions' });
  assert.ok(first.systemPrompt.startsWith('Existing instructions'));
  assert.match(first.systemPrompt, /read/);
  assert.ok(first.systemPrompt.length < 1100);
  assert.equal(await handler({ systemPrompt: first.systemPrompt }), undefined);
});
test('resolves image paths against the session cwd and preserves text', async t => {
  const result = await handlers.get('tool_result')(read('sample.png'), { cwd: fixture(t) });
  assert.equal(result.content[0].text, 'read result');
  assert.equal(result.content[1].data, png.toString('base64'));
});
test('does not append another image when read already returned one', async t => {
  const cwd = fixture(t);
  assert.equal(await handlers.get('tool_result')(read(join(cwd, 'sample.png'), { content: [{ type: 'image', data: 'resized', mimeType: 'image/png' }] }), { cwd }), undefined);
});
for (const kind of ['missing', 'empty', 'large']) {
  test(`returns visible failure for ${kind} images`, async t => {
    const cwd = fixture(t);
    if (kind !== 'missing') writeFileSync(join(cwd, `${kind}.png`), Buffer.alloc(kind === 'large' ? 4 * 1024 * 1024 + 1 : 0));
    const result = await handlers.get('tool_result')(read(`${kind}.png`), { cwd });
    assert.equal(result.isError, true);
    assert.match(result.content.at(-1).text, /not attached/i);
    assert.equal(result.content.filter(b => b.type === 'image').length, 0);
  });
}
test('does not bypass a failed read or change non-image tools', async t => {
  const cwd = fixture(t);
  for (const event of [read(join(cwd, 'sample.png'), { isError: true }), read('notes.txt'), read('sample.png', { toolName: 'write' })]) {
    assert.equal(await handlers.get('tool_result')(event, { cwd }), undefined);
  }
});
