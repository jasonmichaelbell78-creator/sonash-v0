<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-17
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue in
this project, please report it through **GitHub Private Vulnerability Reporting
(PVR)**.

1. Navigate to the
   [Security tab](https://github.com/jasonmichaelbell78-creator/sonash-v0/security)
   of this repository.
2. Click **"Report a vulnerability"**.
3. Provide a clear description of the vulnerability, including steps to
   reproduce if possible.

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
