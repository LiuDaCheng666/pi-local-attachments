import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { existsSync, readFileSync, statSync } from "node:fs";
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
  pi.on("tool_result", async (event) => {
    if (event.toolName !== "read") return;

    const input = event.input as { path?: unknown };
    if (typeof input.path !== "string") return;

    const file = resolve(input.path);
    const mimeType = MIME_TYPES[extname(file).toLowerCase()];
    if (!mimeType || !existsSync(file)) return;

    const size = statSync(file).size;
    if (size <= 0 || size > MAX_INLINE_BYTES) {
      return {
        details: {
          ...(typeof event.details === "object" && event.details ? event.details : {}),
          imagePreview: size > MAX_INLINE_BYTES
            ? `Image is ${size} bytes; use the project file preview for large images.`
            : "Image is empty.",
        },
      };
    }

    const data = readFileSync(file).toString("base64");
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
