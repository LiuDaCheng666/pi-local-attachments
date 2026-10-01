// Read credentials only from user-authored connection JSON in this branch, never
// from assistant claims, tool output, or another provider's configuration.
function objects(text) {
  const results=[];
  for(let start=0;start<text.length;start++) {
    if(text[start]!=='{')continue;
    let depth=0,quoted=false,escaped=false;
    for(let end=start;end<text.length;end++) {
      const c=text[end];
      if(quoted) {if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')quoted=false;continue;}
      if(c==='"')quoted=true;
      else if(c==='{')depth++;
      else if(c==='}' && --depth===0){try{results.push(JSON.parse(text.slice(start,end+1)));}catch{}start=end;break;}
    }
  }
  return results;
}
export function normalizeBase(value) {
  const url=new URL(value);
  if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash)throw new Error('Connection must be an HTTPS service URL without credentials, query or fragment.');
  if(url.pathname==='/'||!url.pathname)url.pathname='/v1';
  return url.toString().replace(/\/$/,'');
}
export function resolveConnection(params,branch,saved={}) {
  const requested=params.base_url?normalizeBase(params.base_url):undefined;
  for(const entry of [...branch].reverse()) {
    const message=entry.message;
    if(message?.role!=='user')continue;
    const content=typeof message.content==='string'?message.content:(message.content??[]).filter(b=>b.type==='text').map(b=>b.text).join('\n');
    for(const obj of objects(content).reverse()) {
      if(obj?._type!=='newapi_channel_conn'||typeof obj.url!=='string'||typeof obj.key!=='string'||!obj.key)continue;
      const baseUrl=normalizeBase(obj.url);
      if(requested&&requested!==baseUrl)continue;
      const envReference=/^\$([A-Za-z_][A-Za-z0-9_]*)$/.exec(obj.key);
      if(envReference)return {config:{baseUrl,model:params.model??obj.model,apiKeyEnv:envReference[1]},env:process.env};
      return {config:{baseUrl,model:params.model??obj.model,apiKeyEnv:'PI_IMAGE_REQUEST_KEY'},env:{PI_IMAGE_REQUEST_KEY:obj.key}};
    }
  }
  if(saved.baseUrl && saved.apiKeyEnv && (!requested||requested===normalizeBase(saved.baseUrl))) {
    return {config:{...saved,baseUrl:normalizeBase(saved.baseUrl),model:params.model??saved.model},env:process.env};
  }
  throw new Error('No matching image service connection in this conversation. Supply NewAPI connection JSON, or configure optional image-tools.json. No request was sent.');
}
