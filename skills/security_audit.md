# Security Audit Skill

## Context
Applies to reviewing codebases for security vulnerabilities.

## Checklist
- [ ] Scan dependency packages for vulnerabilities using audit tools (`npm audit`, etc.).
- [ ] Enforce sanitization for all external inputs (SQLi, XSS protections).
- [ ] Verify CORS headers and frame options to prevent clickjacking.
- [ ] Check permissions endpoints to prevent IDOR (Indirect Object Reference) hacks.
- [ ] Audit server environment files to ensure no keys are exposed.
