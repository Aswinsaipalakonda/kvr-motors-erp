# Authentication Skill

## Context
Applies to secure user logins, session handling, and access tokens.

## Checklist
- [ ] Store access tokens securely (secure HTTP-only cookies or encrypted secure storage).
- [ ] Implement short-lived access tokens combined with secure refresh token rotation.
- [ ] Enforce strong password policies and use secure hashing (e.g. bcrypt, Argon2).
- [ ] Verify validation signatures on JWT tokens on every inbound request.
- [ ] Add session invalidation and logout hooks to clear local tokens.
