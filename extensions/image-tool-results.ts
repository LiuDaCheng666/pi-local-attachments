import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { readFileSync, statSync } from "node:fs";
import { extname, resolve } from "node:path";

const MAX_INLINE_BYTES = 4 * 1024 * 1024;
const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".bmp": "image/bmp",
};

/**
 * Convert image results from the built-in read tool into Pi ImageContent.
 * Pi Web already renders ImageContent in MessageView; this bridges the
 * developer read tool's file attachment path into the persisted Pi message.
 */
export default function imageToolResults(pi: ExtensionAPI) {
  const marker = "[pi-local-attachments: image display]";
  pi.on("before_agent_start", async (event) => {
    if (event.systemPrompt.includes(marker)) return;
    return {
      systemPrompt: `${event.systemPrompt}\n\n${marker}\nTo show an existing local image to the user, call read with its file path; this extension attaches image content for compatible Pi Web clients. After creating or editing an image, read the output to present it. Only claim an image is attached after a successful image result; report failures honestly. This extension does not generate images: use an actually available generation tool, or explain that none is available.`,
    };
  });

  pi.on("tool_result", async (event, ctx) => {
    if (event.toolName !== "read" || event.isError) return;
    // A native read may already supply a resized image. Preserve it as-is.
    if (event.content.some((block) => block.type === "image")) return;

    const input = event.input as { path?: unknown };
    if (typeof input.path !== "string") return;

    const file = resolve(ctx.cwd, input.path);
    const mimeType = MIME_TYPES[extname(file).toLowerCase()];
    if (!mimeType) return;

    const failure = (reason: string) => {
      const text = `Image not attached: ${reason}`;
      return {
        isError: true,
        content: [...event.content, { type: "text" as const, text }],
        details: {
          ...(typeof event.details === "object" && event.details ? event.details : {}),
          imagePreview: text,
        },
      };
    };

    let bytes: Buffer;
    try {
      const stat = statSync(file);
      if (!stat.isFile()) return failure("path is not a regular file.");
      if (stat.size <= 0) return failure("file is empty.");
      if (stat.size > MAX_INLINE_BYTES) return failure("file exceeds the 4 MiB inline limit; resize it or use the project file preview.");
      bytes = readFileSync(file);
      if (bytes.length <= 0 || bytes.length > MAX_INLINE_BYTES) return failure("file size changed; retry with a nonempty image up to 4 MiB.");
    } catch {
      return failure("file is missing or unreadable.");
    }
    const data = bytes.toString("base64");
    return {
      content: [
        ...event.content,
        {
          type: "image" as const,
          data,
          mimeType,
        },
      ],
      details: {
        ...(typeof event.details === "object" && event.details ? event.details : {}),
        imagePreview: "Inline image attached for Pi Web rendering.",
      },
    };
  });
}
