# Firestore Rules & Client Validation

The app assumes every Firestore document lives under the signed-in user's root document. The production ruleset in `firestore.rules` enforces:

- `/users/{uid}` is readable/writable only by `request.auth.uid == uid`.
- `/users/{uid}/daily_logs/{logId}` inherits the same user-only constraint.

These rules block cross-user access and align with how the client constructs document paths.

## Client-side guards

To prevent accidental misuse on the client, the `lib/security/firestore-validation.ts` helpers validate access before any Firestore call is made:

- `assertUserScope` ensures a user id is present, well-formed, and matches the target document owner.
- `validateUserDocumentPath` rejects paths that escape the authenticated user's document tree.

All Firestore writes and reads use these guards, so the client fails fast if code tries to read another user's data. This mirrors the security guarantees enforced by the deployed rules.
