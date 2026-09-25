# Security

- Keep Pi Web bound to `127.0.0.1` unless remote access is deliberately secured.
- Do not expose the file API or Pi Web to the public internet.
- Do not bypass Pi Web allowed-root checks.
- Review the patch before applying it to a Pi Web checkout.
- Inline tool-result images are capped at 4 MiB to limit context and memory use.
