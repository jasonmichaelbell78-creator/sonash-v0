<!-- prettier-ignore-start -->
**Document Version:** 1.1
**Last Updated:** 2026-04-13
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Security Policy

## Purpose

Security policy for SoNash — vulnerability reporting, supported versions, and
security measures implemented in the application.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue in
this project, please report it through one of the following channels:

### Preferred: GitHub Private Vulnerability Reporting

1. Navigate to the
   [Security tab](https://github.com/jasonmichaelbell78-creator/sonash-v0/security)
   of this repository.
2. Click
   [**Report a vulnerability**](https://github.com/jasonmichaelbell78-creator/sonash-v0/security/advisories/new).
3. Provide a clear description of the vulnerability, including steps to
   reproduce if possible.

### Alternate: Direct Email

If you cannot use GitHub PVR (or your finding involves the GitHub account
itself), email **<jason@sonash.app>** with the subject line
`[SECURITY] <short summary>`. For critical vulnerabilities (active exploitation,
credential exposure, data integrity), prefix the subject with
`[SECURITY-CRITICAL]`.

Please include:

- A description of the vulnerability and its potential impact
- Steps to reproduce (or a proof-of-concept if applicable)
- Affected version, branch, or commit SHA
- Your name or handle if you would like credit (optional)

References:

- [GitHub Security Advisories database](https://github.com/advisories) — for
  cross-referencing CVE / GHSA IDs in your report
- [CVE Mitre](https://cve.mitre.org/) and [CWE list](https://cwe.mitre.org/) —
  for vulnerability classification

Please **do not** open a public issue for security vulnerabilities.

## Security Considerations

This application implements the following security measures:

- **Firebase App Check** is used to verify client authenticity and protect
  backend resources from abuse.
- **Cloud Functions enforce server-side validation.** Sensitive collections
  (`journal`, `daily_logs`, `inventoryEntries`) do not accept direct Firestore
  writes from clients. All mutations go through Cloud Functions with server-side
  validation.
- **Rate limiting** is applied to Cloud Functions. Clients that exceed rate
  limits receive `429` responses and are expected to handle them gracefully.

## Responsible Disclosure Timeline

- **Acknowledgment:** We will acknowledge receipt of your vulnerability report
  within **7 days**.
- **Resolution:** We aim to investigate, address, and release a fix in a timely
  manner.
- **Disclosure:** We follow a **90-day disclosure timeline** from the date a fix
  is released. We ask that reporters refrain from public disclosure until this
  period has elapsed or until a fix has been made available, whichever comes
  first.

## Version History

| Version | Date       | Changes                                                                                                                          |
| ------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 1.1     | 2026-04-13 | Add direct email contact (<jason@sonash.app>) + advisory/CVE/CWE reference links to raise OpenSSF Scorecard SecurityPolicy score |
| 1.0     | 2026-03-17 | Initial security policy                                                                                                          |
