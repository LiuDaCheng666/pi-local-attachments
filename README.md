# Pi Image Display

Pi extension and Pi Web patch for displaying local image results in chat.

## What it does

- Converts image results from Pi's `read` tool into Pi image content.
- Lets Pi Web render local image paths in final assistant messages.
- Keeps chat thumbnails at 480x360; clicking opens the full-size preview.
- Supports PNG, JPG/JPEG, GIF, WebP, and BMP.
- Limits inline tool-result images to 4 MiB.

## Install the extension

Copy `extensions/image-tool-results.ts` to:

```text
~/.pi/agent/extensions/
```

On Windows with a custom Pi agent directory, use:

```text
<PI_CODING_AGENT_DIR>\extensions\
```

Then run `/reload` or restart Pi.

## Apply the Pi Web patch

This package does not replace Pi Web. Apply the patch to a local Pi Web source checkout:

```powershell
.\scripts\apply-piweb-patch.ps1 `
  -SourceDir 'C:\path\to\pi-web-source'
```

The patched Pi Web must be started from that checkout. The patch is intended for Pi Web 0.9.x and may need refreshes when upstream changes.

## Security

Only use this package with a trusted local Pi Web instance. Image paths are served through Pi Web's existing allowed-root checks. Do not expose Pi Web directly to the public internet.

## Status

This is an integration package for local Pi/Pi Web installations. It is not an official Pi Web release.
