import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';

// Set this to the installed Pi SDK's dist/core/extensions/loader.js file URL.
// Core tests run independently; this checks the real SDK adapter when available.
test('Pi tool adapters reject failures instead of returning a false success', {skip:!process.env.PI_TEST_SDK_LOADER},async()=>{
  const {loadExtensions}=await import(process.env.PI_TEST_SDK_LOADER);
  const result=await loadExtensions([resolve('extensions/image-tools/index.ts')],process.cwd());
  assert.deepEqual(result.errors,[]);
  const tools=result.extensions[0].tools;
  const ctx={cwd:process.cwd(),sessionManager:{getBranch:()=>[]}};
  await assert.rejects(()=>tools.get('display_image').definition.execute('test',{path:'missing-sdk-test-file.png'},undefined,undefined,ctx),/No image attached/);
  await assert.rejects(()=>tools.get('generate_image').definition.execute('test',{prompt:'x'},undefined,undefined,ctx),/No image attached/);
  await assert.rejects(()=>tools.get('list_image_models').definition.execute('test',{},undefined,undefined,ctx),/No image attached/);
});
