# Security Specification: ClientGard Firestore Security

## 1. Data Invariants
1. A freelancer can only access, create, update, or delete their own client profiles (`clients`) and uploaded file metadata (`files`).
2. Documents in `/users/{userId}` are strictly restricted so that only `request.auth.uid == userId` can read or write their own user profile.
3. Every `files` record must contain a valid `userId` matching `request.auth.uid`, ensuring no freelancer can author or modify documents belonging to another freelancer.
4. Clients (`/clients/{clientId}`) require strict owner identity matching `resource.data.userId == request.auth.uid`.

## 2. Dirty Dozen Threat Vectors
1. **Unauthenticated Read / Write**: Block all unauthenticated requests to `/users`, `/clients`, and `/files`.
2. **Identity Spoofing**: Attempt to write a file record with `userId: "other_user_id"`.
3. **Ghost Field Poisoning**: Attempt to insert unapproved keys into a user or client entity.
4. **ID Injection Attacks**: Document IDs longer than 128 characters or containing invalid characters.
5. **Cross-Tenant File Deletion**: Attempt by User B to delete a file record owned by User A.
6. **Cross-Tenant File Update**: Attempt by User B to alter `clientName` or `originalName` of User A's file.
7. **PII Exposure in Users Collection**: Blanket reads to `/users` blocked; only `request.auth.uid == userId` permitted.
8. **Blind List Querying**: Rejecting `allow list` without ownership validation on `resource.data`.
9. **Tampering with Share Token**: Unauthorized alteration of `shareToken` by non-owners.
10. **Timestamp Manipulation**: Enforcing string/timestamp schema bounds on `uploadDate` and `createdAt`.
11. **Excessive File Size Poisoning**: Enforcing size constraints on file names and metadata fields.
12. **Default Deny Fallback**: Root `match /{document=**} { allow read, write: if false; }` prevents leaks on unmapped paths.
