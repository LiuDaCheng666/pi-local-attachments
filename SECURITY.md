# Security

- Keep Pi Web bound to `127.0.0.1` unless remote access is deliberately secured.
- Do not expose the file API or Pi Web to the public internet.
- Do not bypass Pi Web allowed-root checks.
- Review the patch before applying it to a Pi Web checkout.
- Fallback `read` attachments are capped at 4 MiB; explicit image tools are capped at 10 MiB.
- Image generation sends the requested prompt to the user-selected HTTPS service. Loading the extension does not make network requests.
- Credentials are resolved from user-provided connection JSON in the current conversation or a named local environment variable. They are not copied into tool arguments, results or generated files. Credentials pasted into chat still remain in the original chat history.
- Provider credentials are never forwarded to returned image download URLs; authenticated service redirects are rejected.
