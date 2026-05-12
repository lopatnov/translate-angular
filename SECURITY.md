# Security Policy

## Supported Versions

Only the latest version of Translate Studio (on the `main` branch) receives security updates.

| Version | Supported |
| ------- | --------- |
| latest  | ✅        |
| older   | ❌        |

## Reporting a Security Issue

Please **do not** open a public GitHub issue for security-sensitive findings.

Instead, contact the maintainer directly via
**[LinkedIn](https://www.linkedin.com/in/lopatnov/)** with:

1. A description of the issue and its potential impact
2. Steps to reproduce (or a proof-of-concept, if applicable)
3. Any suggested mitigation or fix

You can expect an initial response within **72 hours**.

## Disclosure Policy

- The maintainer will confirm receipt and investigate the report
- A fix will be prepared and released as soon as reasonably possible
- Credit will be given in the release notes (unless you prefer to remain anonymous)
- Public disclosure will be coordinated with the reporter

## Scope

This policy covers the Translate Studio application code in this repository.
Third-party dependencies should be reported to their respective maintainers.

## Best Practices for Self-Hosters

- Run behind HTTPS (terminate TLS at nginx or a reverse proxy)
- Do not expose the SSR server (port 4000) directly to the public internet
- The `.env` file contains only non-sensitive defaults — avoid adding secrets to it
- Keep Node.js and npm dependencies up to date (`npm audit` will flag known vulnerabilities)
