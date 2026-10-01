import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, readFileSync, existsSync, readdirSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {displayImage, generateImage, listImageModels} from '../extensions/image-tools/core.mjs';

const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64');
function setup(t){const cwd=mkdtempSync(join(tmpdir(),'pi-image-tools-')); t.after(()=>rmSync(cwd,{recursive:true,force:true})); return cwd;}
const config={baseUrl:'https://images.example/v1',model:'test-image',apiKeyEnv:'TEST_IMAGE_KEY'};
const env={TEST_IMAGE_KEY:'secret-value'};
test('display returns actual bytes, absolute path and no network',async t=>{const cwd=setup(t);writeFileSync(join(cwd,'a.png'),png);const r=await displayImage('a.png',cwd);assert.equal(r.content[1].data,png.toString('base64'));assert.equal(r.details.path,join(cwd,'a.png'));});
test('missing and non-image files fail instead of claiming display',async t=>{const cwd=setup(t);await assert.rejects(()=>displayImage('missing.png',cwd));writeFileSync(join(cwd,'bad.png'),'not an image');await assert.rejects(()=>displayImage('bad.png',cwd),/image/i);});
test('generation posts configured model and saves before returning image',async t=>{const cwd=setup(t);let calls=0;const r=await generateImage({prompt:'A safe',size:'1024x1024'},cwd,config,{env,fetch:async(url,init)=>{calls++;assert.equal(url,'https://images.example/v1/images/generations');assert.equal(init.headers.Authorization,'Bearer secret-value');assert.equal(init.redirect,'error');assert.deepEqual(JSON.parse(init.body),{model:'test-image',prompt:'A safe',n:1,size:'1024x1024'});return Response.json({data:[{b64_json:png.toString('base64')}]});}});assert.equal(calls,1);assert.ok(existsSync(r.details.path));assert.deepEqual(readFileSync(r.details.path),png);assert.equal(r.content[1].type,'image');});
test('URL image downloads never forward provider credentials',async t=>{const cwd=setup(t);let calls=0;const r=await generateImage({prompt:'A safe'},cwd,config,{env,fetch:async(url,init)=>{calls++;if(calls===1)return Response.json({data:[{url:'https://cdn.example/test.png'}]});assert.equal(url,'https://cdn.example/test.png');assert.equal(init.headers,undefined);return new Response(png);}});assert.equal(calls,2);assert.deepEqual(readFileSync(r.details.path),png);});
test('missing config or key makes zero network requests',async t=>{const cwd=setup(t);const f=()=>{throw Error('must not fetch')};await assert.rejects(()=>generateImage({prompt:'x'},cwd,{}, {env,fetch:f}),/config/i);await assert.rejects(()=>generateImage({prompt:'x'},cwd,config,{env:{},fetch:f}),/TEST_IMAGE_KEY/);});
test('HTTP failure does not leak response bodies or retry paid requests',async t=>{const cwd=setup(t);let calls=0;await assert.rejects(()=>generateImage({prompt:'x'},cwd,config,{env,fetch:async()=>{calls++;return new Response('secret-value',{status:401});}}),e=>e.message.includes('401')&&!e.message.includes('secret-value'));assert.equal(calls,1);assert.equal(readdirSync(cwd).length,0);});
test('invalid and empty output fail without creating files',async t=>{const cwd=setup(t);for(const data of [[],[{b64_json:Buffer.from('not image').toString('base64')}],[{b64_json:'@@@'}]])await assert.rejects(()=>generateImage({prompt:'x'},cwd,config,{env,fetch:async()=>Response.json({data})}));assert.equal(readdirSync(cwd).length,0);});
test('generation filenames never overwrite earlier output',async t=>{const cwd=setup(t);const deps={env,fetch:async()=>Response.json({data:[{b64_json:png.toString('base64')}]})};const a=await generateImage({prompt:'x'},cwd,config,deps);const b=await generateImage({prompt:'x'},cwd,config,deps);assert.notEqual(a.details.path,b.details.path);});
test('aborted request never calls service',async t=>{const cwd=setup(t);const ac=new AbortController();ac.abort();await assert.rejects(()=>generateImage({prompt:'x'},cwd,config,{env,signal:ac.signal,fetch:()=>{throw Error('must not fetch')}}),/abort/i);});
test('model discovery uses selected service and exposes no credential',async()=>{
 const r=await listImageModels(config,{env,fetch:async(url,init)=>{assert.equal(url,'https://images.example/v1/models');assert.equal(init.headers.Authorization,'Bearer secret-value');return Response.json({data:[{id:'custom-image-v3'},{id:'chat-only'}]});}});
 assert.deepEqual(JSON.parse(r.content[0].text).candidates,['custom-image-v3']);assert.ok(!JSON.stringify(r).includes('secret-value'));
});
test('different per-call service and model are honored',async t=>{
 const cwd=setup(t);await generateImage({prompt:'x'},cwd,{...config,baseUrl:'https://another.example/api',model:'another-image'},{env,fetch:async(url,init)=>{assert.equal(url,'https://another.example/api/images/generations');assert.equal(JSON.parse(init.body).model,'another-image');return Response.json({data:[{b64_json:png.toString('base64')}]});}});
});
