import {open, mkdir, stat, readFile} from 'node:fs/promises';
import {resolve, join} from 'node:path';
import {randomUUID} from 'node:crypto';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_JSON_BYTES = 15 * 1024 * 1024;

function imageFormat(bytes) {
  if (bytes.length > 24 && bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) && bytes.toString('ascii',12,16)==='IHDR' && bytes.readUInt32BE(16)>0 && bytes.readUInt32BE(20)>0) return ['image/png','png'];
  if (bytes.length > 4 && bytes[0]===255 && bytes[1]===216 && bytes[2]===255) return ['image/jpeg','jpg'];
  if (bytes.length > 16 && bytes.toString('ascii',0,4)==='RIFF' && bytes.toString('ascii',8,12)==='WEBP') return ['image/webp','webp'];
  if (bytes.length > 13 && ['GIF87a','GIF89a'].includes(bytes.toString('ascii',0,6))) return ['image/gif','gif'];
  throw new Error('Unsupported or invalid image. Use PNG, JPEG, WebP or GIF.');
}

function imageResult(bytes, path, action) {
  const [mimeType] = imageFormat(bytes);
  return {
    content: [
      {type:'text', text:`${action}. Image attached for display. Local file: ${path}`},
      {type:'image', data:bytes.toString('base64'), mimeType},
    ],
    details: {path, mimeType, bytes:bytes.length, imageAttached:true},
  };
}

export async function displayImage(path, cwd) {
  const absolute = resolve(cwd, path);
  const info = await stat(absolute).catch(() => { throw new Error('Image file is missing or unreadable.'); });
  if (!info.isFile() || info.size===0 || info.size>MAX_IMAGE_BYTES) throw new Error('Image must be a nonempty regular file no larger than 10 MiB.');
  const bytes=await readFile(absolute);
  if (!bytes.length || bytes.length>MAX_IMAGE_BYTES) throw new Error('Image file size changed; retry with a file up to 10 MiB.');
  return imageResult(bytes,absolute,'Existing image read');
}

async function boundedBytes(response, limit) {
  if (!response.body) throw new Error('Image service returned an empty body.');
  const reader=response.body.getReader();
  const chunks=[];
  let size=0;
  try {
    while (true) {
      const {done,value}=await reader.read();
      if(done)break;
      size+=value.length;
      if(size>limit)throw new Error('Image service response exceeds the size limit.');
      chunks.push(Buffer.from(value));
    }
  } finally {
    await reader.cancel().catch(()=>{});
    reader.releaseLock();
  }
  return Buffer.concat(chunks);
}

function httpsUrl(value) {
  const url=new URL(value);
  if(url.protocol!=='https:' || url.username || url.password || url.hash || url.search) throw new Error('Image service base URL must be HTTPS without credentials, query or fragment.');
  return url.toString().replace(/\/$/,'');
}

export async function listImageModels(config, deps={}) {
  if(!config.baseUrl||!config.apiKeyEnv)throw new Error('Image service connection is not configured.');
  const key=(deps.env??process.env)[config.apiKeyEnv];
  if(!key)throw new Error(`Missing environment variable ${config.apiKeyEnv}.`);
  const signal=deps.signal?AbortSignal.any([deps.signal,AbortSignal.timeout(20000)]):AbortSignal.timeout(20000);
  signal.throwIfAborted();
  let response;
  try {response=await (deps.fetch??fetch)(`${httpsUrl(config.baseUrl)}/models`,{headers:{Authorization:`Bearer ${key}`},redirect:'error',signal});}
  catch {throw new Error('Could not query image service models. Check the connection.');}
  if(!response.ok)throw new Error(`Model discovery HTTP ${response.status}.`);
  let payload;
  try{payload=JSON.parse((await boundedBytes(response,2*1024*1024)).toString('utf8'));}
  catch{throw new Error('Model discovery returned invalid or oversized JSON.');}
  const ids=(payload?.data??[]).map(item=>item.id).filter(id=>typeof id==='string');
  const candidates=ids.filter(id=>/image|dall|flux|imagen|stable.diffusion/i.test(id));
  return {content:[{type:'text',text:JSON.stringify({baseUrl:config.baseUrl,candidates,models:candidates.length?undefined:ids.slice(0,100),note:'Use the requested model ID. Listing does not guarantee /images/generations support.'})}],details:{modelCount:ids.length}};
}

export async function generateImage(params, cwd, config, deps={}) {
  if(!config.baseUrl || !config.apiKeyEnv) throw new Error('Image generation is not configured. Supply a connection in this conversation or optional image-tools.json.');
  if(!config.model)throw new Error('No image model selected. Use list_image_models and select the model requested by the user.');
  const base=httpsUrl(config.baseUrl);
  const key=(deps.env??process.env)[config.apiKeyEnv];
  if(!key)throw new Error(`Image generation needs the configured environment variable ${config.apiKeyEnv}.`);
  if(typeof params.prompt!=='string' || !params.prompt.trim())throw new Error('An image prompt is required.');
  const fetcher=deps.fetch??fetch;
  const signal=deps.signal ? AbortSignal.any([deps.signal,AbortSignal.timeout(240000)]) : AbortSignal.timeout(240000);
  signal.throwIfAborted();
  const request=async(url, init) => {
    try { return await fetcher(url,{...init,redirect:'error',signal}); }
    catch { throw new Error(signal.aborted ? 'Image request aborted or timed out. No automatic retry was made.' : 'Image service connection failed. No automatic retry was made.'); }
  };
  const response=await request(`${base}/images/generations`,{
    method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},
    body:JSON.stringify({model:config.model,prompt:params.prompt,n:1,size:params.size??'1024x1024'}),
  });
  if(!response.ok)throw new Error(`Image service HTTP ${response.status}; no image saved. Check service/model configuration. No automatic retry was made.`);
  let payload;
  try {payload=JSON.parse((await boundedBytes(response,MAX_JSON_BYTES)).toString('utf8'));}
  catch {throw new Error('Image service returned invalid or oversized JSON; no image saved.');}
  const item=payload?.data?.[0];
  let bytes;
  if(typeof item?.b64_json==='string' && item.b64_json.length) {
    const b64=item.b64_json.replace(/\s/g,'');
    if(!/^[A-Za-z0-9+/]+={0,2}$/.test(b64) || b64.length%4===1)throw new Error('Image service returned invalid base64.');
    bytes=Buffer.from(b64,'base64');
  } else if(typeof item?.url==='string') {
    const url=new URL(item.url);
    if(url.protocol!=='https:' || url.username || url.password)throw new Error('Image download URL must use HTTPS without credentials.');
    // Signed CDN URLs are permitted; never send provider Authorization to them.
    const download=await request(url.toString(),{method:'GET'});
    if(!download.ok)throw new Error(`Image download HTTP ${download.status}; no image saved.`);
    bytes=await boundedBytes(download,MAX_IMAGE_BYTES);
  } else throw new Error('Image service returned no image data or download URL.');
  if(!bytes.length || bytes.length>MAX_IMAGE_BYTES)throw new Error('Generated image is empty or larger than 10 MiB.');
  const [,ext]=imageFormat(bytes);
  signal.throwIfAborted();
  const directory=resolve(cwd,'generated-images');
  await mkdir(directory,{recursive:true});
  const path=join(directory,`image-${Date.now()}-${randomUUID().slice(0,8)}.${ext}`);
  const handle=await open(path,'wx');
  try {await handle.writeFile(bytes);} finally {await handle.close();}
  return imageResult(bytes,path,'Image generated and saved');
}
