# ToolNova Security Baseline

This document distinguishes protections that are active in the current static site from controls that only become applicable when a server-side feature is introduced. It is not a penetration-test report or a guarantee that the deployment is vulnerability-free.

## Current architecture

ToolNova builds static HTML, CSS, and JavaScript. Tool logic runs in the visitor's browser. The current repository has no application login/session flow, database-backed user records, private per-user objects, inbound webhook endpoint, or application API route. Therefore several server-side controls cannot honestly be described as active features yet.

## Reel security checklist

| Concern | Current treatment | Required before adding the relevant feature |
| --- | --- | --- |
| SQL injection | Not applicable to the current app: no SQL/database query endpoint exists. | Use parameterized queries; never concatenate untrusted input into SQL. |
| CSRF | No cookie-authenticated, state-changing application endpoint exists; regression tests guard against silently adding one. | Add CSRF tokens and Origin validation for cookie-authenticated unsafe methods; never mutate state through GET. |
| File upload validation | Current file utilities run in the browser; there is no server upload endpoint. Browser-side validation is not a server security boundary. | For each file tool, validate allowed formats, size limits, and file contents before processing; do not trust the filename or MIME header alone. If uploads are ever sent to a server, repeat validation server-side and store files safely. |
| Broken object-level authorization (BOLA/IDOR) | No private server-side objects or object API exists; regression tests block introducing endpoints/data dependencies without an authorization review. | Scope every read/update/delete/export to the verified session owner; deny by default and test cross-user ID tampering. |
| Rate limiting | No application API exists, so no application-level request limiter can be enforced today. A browser timer is not security. | Enforce shared/server-side limits before exposing APIs; return 429 and Retry-After. Configure deployment WAF limits separately if available. |
| API secrets | Browser-source regression tests scan for common provider-key patterns and reject process.env references. AI maintenance keys belong in GitHub Actions secrets, never in generated assets. | Keep provider credentials in server/CI secret stores and proxy privileged calls through a trusted server endpoint. Rotate any exposed key. |
| Password hashing | Server-only scrypt helper and tests exist, but there is no live registration/login endpoint. | Prefer Argon2id (or scrypt when unavailable), unique salts, secure sessions, recovery protections, and server-side rate limits. Never store plaintext passwords. |
| Multi-factor authentication | TOTP/recovery-code helper and tests exist, but MFA is not connected to a live account/session flow. | Integrate with trusted server-side authentication; encrypt TOTP secrets, require the second factor during sign-in, and atomically consume recovery codes. |
| CORS | Vercel config uses a specific ToolNova origin on /api/(.*) rather than *, and there are currently no app API routes. | When APIs are added, allow only required origins/methods/headers and do not use CORS as authentication or CSRF protection. |
| Auth tokens in localStorage | ToolNova has no active login system. The browser runtime now removes known legacy keys (access_token, auth_token, authToken, refresh_token, id_token) on page load; the theme preference is separate. | Do not put session/refresh tokens in browser storage. Prefer appropriately configured HttpOnly, Secure, SameSite cookies when a server auth flow exists. |
| Server-side permissions | No protected server actions currently exist, so there are no server permissions to enforce yet. | Authenticate and authorize every admin/premium/privileged request on the server. Never trust a role or entitlement supplied by the browser. |
| Webhook signatures | No inbound webhook endpoint exists. | Verify provider signatures over the raw request body using a server-side secret, compare safely, and reject invalid/replayed events. |
| SSRF | No server endpoint fetches user-supplied URLs on behalf of a visitor. | Restrict destinations and protocols, block private/link-local/metadata IP ranges, validate redirects and DNS results, and use egress controls. |
| Exposed source maps | Production verification now fails if the built dist/ contains .map files or JavaScript sourceMappingURL references. | Keep production source maps private unless there is a deliberate, reviewed release process. |
| Sensitive data in logs | The static app has no application server request logs. Never print credentials, tokens, passwords, OTPs, or full sensitive payloads in maintenance/CI logs. | Redact secrets and personal data; log security events with minimal metadata and restricted access. |
| Vulnerable dependencies | package.json currently has no runtime or development dependencies, so package audit has no installed dependency tree to audit. | Keep dependencies minimal, review and update any new dependency, commit the relevant lockfile if dependencies are added, and run vulnerability scanning in CI. |

## Release gate

- node --test tests/
- node scripts/build.mjs
- node scripts/verify.mjs

A future login, payment, admin, premium, API, upload-to-server, database, or webhook feature must not ship merely because the static-site checks pass. Add a trusted backend/authentication provider and implementation-level tests for the new server-side security boundary first.
