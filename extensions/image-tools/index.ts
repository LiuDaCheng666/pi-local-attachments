import { Type } from '@earendil-works/pi-ai';
import { defineTool, getAgentDir, type ExtensionAPI } from '@earendil-works/pi-coding-agent';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { displayImage, generateImage, listImageModels } from './core.mjs';
import { resolveConnection } from './connections.mjs';

function config() {
  try { return JSON.parse(readFileSync(join(getAgentDir(), 'image-tools.json'), 'utf8').replace(/^\uFEFF/,'')); }
  catch { return {}; }
}
function failure(error: unknown) {
  // Pi marks rejected execute calls as errors; returning isError here is ignored
  // by the agent loop and would persist a failed operation as a successful tool.
  throw new Error(`No image attached. ${error instanceof Error ? error.message : 'Image operation failed.'}`);
}

export default function imageTools(pi: ExtensionAPI) {
  pi.registerTool(defineTool({
    name:'display_image', label:'Display existing image',
    description:'Show an EXISTING local image to the user in Pi Web. Reads the real file and returns an image attachment. Use when asked to show/preview an image, including after editing or rendering it. This does NOT generate or modify images.',
    parameters:Type.Object({path:Type.String({description:'Existing image file path, absolute or relative to the current project.'})}),
    async execute(_id, params, _signal, _update, ctx) {
      try { return await displayImage(params.path, ctx.cwd); } catch(error) { return failure(error); }
    },
  }));
  pi.registerTool(defineTool({
    name:'generate_image', label:'Generate and save image',
    description:'Only when asked to CREATE a new image: call the user-selected OpenAI-compatible image service, save to generated-images in the current project, and attach the real image. Uses connection JSON supplied by the user in this conversation (or optional local config). Does not bind any provider/model, does not edit existing images. Use list_image_models if the requested model ID is unknown. Never claim an imaginary image_gen result.',
    parameters:Type.Object({
      prompt:Type.String({description:'Full visual description of the image to create.'}),
      base_url:Type.Optional(Type.String({description:'User-selected service URL, matching connection JSON in this conversation. Defaults to the most recent user connection. Never include a key.'})),
      model:Type.Optional(Type.String({description:'Actual model ID requested by the user. Use list_image_models to discover an unknown ID; no hardcoded default.'})),
      size:Type.Optional(Type.Union([Type.Literal('1024x1024'),Type.Literal('1536x1024'),Type.Literal('1024x1536')],{description:'Image dimensions; defaults to 1024x1024.'})),
    }),
    async execute(_id,params,signal,_update,ctx) {
      try {const selected=resolveConnection(params,ctx.sessionManager.getBranch(),config());return await generateImage(params,ctx.cwd,selected.config,{signal,env:selected.env});} catch(error) {return failure(error);}
    },
  }));
  pi.registerTool(defineTool({
    name:'list_image_models',label:'Discover image models',
    description:'Read-only model discovery for the user-selected OpenAI-compatible image service. Use when the user asks to generate an image but the exact model ID is unknown. Uses the matching user connection JSON from this conversation or optional local config; does not generate images or expose credentials.',
    parameters:Type.Object({base_url:Type.Optional(Type.String({description:'Service URL matching a user-provided connection; defaults to the latest user connection.'}))}),
    async execute(_id,params,signal,_update,ctx){
      try{const selected=resolveConnection(params,ctx.sessionManager.getBranch(),config());return await listImageModels(selected.config,{signal,env:selected.env});}catch(error){return failure(error);}
    },
  }));
  pi.on('before_agent_start',async(event)=>{
    const marker='[pi-image-tools]';
    if(event.systemPrompt.includes(marker))return;
    return {systemPrompt:`${event.systemPrompt}\n\n${marker} Only when asked to create an image, use generate_image with the user's current connection/model; discover unknown model IDs with list_image_models. To show an existing file, use display_image (read also supports images). Successful tools return real saved paths and image blocks. Never claim generation, attachments or download limitations without a successful result; old unsupported claims are not evidence. Report actual errors. There is no image_gen tool here. Do not edit images with a generation-only tool.`};
  });
}
