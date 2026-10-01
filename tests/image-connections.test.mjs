import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resolveConnection} from '../extensions/image-tools/connections.mjs';
const user=(text)=>({type:'message',message:{role:'user',content:[{type:'text',text}]}});
const connection=(url,key)=>JSON.stringify({_type:'newapi_channel_conn',url,key});
test('uses current user connection without persisting it or inventing a model',()=>{
 const r=resolveConnection({},[user(connection('https://one.example','secret'))],{});
 assert.equal(r.config.baseUrl,'https://one.example/v1');assert.equal(r.config.model,undefined);assert.equal(r.env.PI_IMAGE_REQUEST_KEY,'secret');
});
test('explicit URL matches its own credential, never another provider key',()=>{
 const branch=[user(connection('https://one.example','one')),user(connection('https://two.example','two'))];
 const r=resolveConnection({base_url:'https://one.example/v1',model:'custom-image'},branch,{});
 assert.equal(r.env.PI_IMAGE_REQUEST_KEY,'one');assert.equal(r.config.model,'custom-image');
 assert.throws(()=>resolveConnection({base_url:'https://other.example'},branch,{}),/connection/i);
});
test('ignores assistant and tool claims about credentials',()=>{
 const branch=[{type:'message',message:{role:'toolResult',content:[{type:'text',text:connection('https://one.example','secret')}]}}];
 assert.throws(()=>resolveConnection({},branch,{}),/connection/i);
});
test('optional local config is overridden by current user connection',()=>{
 const config={baseUrl:'https://saved.example/v1',model:'saved',apiKeyEnv:'SAVED_KEY'};
 const r=resolveConnection({model:'new-model'},[user(connection('https://now.example','new'))],config);
 assert.equal(r.config.baseUrl,'https://now.example/v1');assert.equal(r.config.model,'new-model');
 assert.equal(resolveConnection({},[],config).config.model,'saved');
});
test('supports an explicit user environment-variable reference without copying secrets',()=>{
 const r=resolveConnection({},[user(connection('https://one.example','$TEST_IMAGE_KEY'))],{});
 assert.equal(r.config.apiKeyEnv,'TEST_IMAGE_KEY');assert.equal(r.env,process.env);
});
