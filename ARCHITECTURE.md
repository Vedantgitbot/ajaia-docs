# Architecture – Ajaia Docs

## 1. Project Overview

Ajaia Docs is a lightweight, full-stack collaborative document editor inspired by Google Docs. It allows users to register, log in, create and edit rich-text documents, upload text and Markdown files, and share documents with other users through role-based permissions.

The application is designed to provide a simple and reliable document-editing experience while keeping the architecture lightweight and easy to deploy.

## 2. Technology Stack

### Frontend
- **Next.js:** Frontend framework and application routing.
- **TipTap:** Rich-text editing functionality.
- **React:** Component-based user interface.
- **CSS:** Application styling and responsive layouts.

### Backend
- **FastAPI:** REST API and backend application logic.
- **SQLite:** Lightweight relational database.
- **JWT:** Authentication using JSON Web Tokens.
- **HttpOnly Cookies:** Secure handling of authentication tokens.

### Deployment and Testing
- **Render:** Application deployment and hosting.
- **Automated backend tests:** Verification of backend functionality and permissions.
- **Next.js API rewrite:** Proxies `/api` requests to the backend to keep API communication first-party.

## 3. Application Architecture

The application follows a frontend/backend architecture.

1. Users interact with the Next.js frontend.
2. The frontend sends API requests through the `/api` rewrite.
3. FastAPI handles authentication, document operations, uploads, and sharing.
4. SQLite stores user accounts, documents, and sharing information.
5. The backend validates authentication and document permissions before allowing protected operations.

This separation keeps presentation logic independent of backend business logic.

## 4. Data Model

The application uses three primary entities.

### Users
Stores account information.

- User ID
- Email address
- Password hash
- Account-related metadata

Passwords are stored as hashes rather than plaintext values.

### Documents
Stores document content and ownership information.

- Document ID
- Title
- Content (TipTap JSON)
- Owner ID
- Version number
- Creation timestamp
- Updated timestamp

Document content is stored as TipTap JSON instead of plain text or HTML. This preserves rich-text structure, including headings, lists, and formatting.

### Shares
Connects documents to users who have been granted access.

- Share ID
- Document ID
- User ID
- Role (editor or viewer)

This allows document owners to share documents with different permission levels.

## 5. Authentication and Authorization

Authentication uses email and password credentials with JWT-based sessions stored in HttpOnly cookies.

The backend validates the authentication token before processing protected requests.

Document access follows a role-based permission model:

- **Owner:** Full control over the document, including sharing and access management.
- **Editor:** Can view and modify shared document content.
- **Viewer:** Can view document content but cannot modify it.
- **Unauthorized user:** Cannot access documents they do not own or have not been granted access to.

Permission checks are enforced on the backend rather than relying only on frontend visibility or disabled controls.

## 6. Document Editing and Autosave

TipTap provides the rich-text editing experience.

The editor supports formatting options such as:

- Bold, italic, and underline
- Heading levels H1, H2, and H3
- Bulleted lists
- Numbered lists

Changes are saved automatically using a debounced save mechanism of approximately one second.

The interface provides saving-state feedback so users can distinguish between pending and completed saves.

The document's TipTap JSON representation is persisted in SQLite, allowing formatting and structure to survive page refreshes.

## 7. Versioned Saves and Conflict Handling

Ajaia Docs uses optimistic concurrency control to reduce accidental overwrites.

Each document has a version number. When the frontend saves changes, it includes the last known version.

The backend checks whether that version matches the current stored version.

- If the versions match, the changes are saved and the version is incremented.
- If the version is outdated, the backend responds with HTTP 409 Conflict.

The frontend then informs the user that the document has changed elsewhere and needs to be reloaded.

This approach provides basic conflict detection without the complexity of real-time collaborative editing.

## 8. File Uploads

The application supports uploading `.txt` and `.md` files as new documents.

The upload restrictions are:

- Supported extensions: `.txt` and `.md`
- Maximum file size: 1 MB

Uploaded content becomes a new editable document.

Unsupported file types and oversized uploads produce clear error feedback.

## 9. Sharing and Permissions

Document owners can share their documents with registered users by email.

The owner can assign either:

- Viewer access
- Editor access

Existing shares can be reviewed and removed through the sharing interface.

The backend checks document ownership and sharing permissions for protected operations. This ensures that users cannot gain access simply by modifying frontend requests or document identifiers.

## 10. Design Decisions and Tradeoffs

### SQLite instead of PostgreSQL
SQLite keeps the initial deployment simple and avoids the overhead of managing a separate database service.

The tradeoff is that persistent production storage requires additional consideration when deploying on an ephemeral hosting environment.

### TipTap JSON instead of HTML
Storing structured editor content makes it easier to preserve rich-text formatting and work with the TipTap editor.

### Optimistic concurrency instead of real-time collaboration
Versioned saves provide a simpler and more predictable way to detect conflicting edits.

### Next.js API rewrite
Proxying API requests through Next.js simplifies cookie handling and avoids the need for a separate browser-facing CORS configuration.

## 11. Scope and Deliberately Deferred Features

The project prioritizes a reliable core document workflow.

The following features were intentionally deprioritized:

- Real-time collaborative editing
- `.docx` import
- Document version history
- Document export
- Public link sharing

These features could be introduced in future iterations.

## 12. Future Improvements

Potential improvements include:

- Migrating SQLite storage to PostgreSQL.
- Adding document version history and restore functionality.
- Implementing real-time collaboration using WebSockets.
- Supporting additional document import and export formats.
- Improving automated frontend and end-to-end test coverage.

## Conclusion

Ajaia Docs focuses on delivering the essential features of a collaborative document editor through a lightweight full-stack architecture.

The combination of Next.js, TipTap, FastAPI, and SQLite provides a straightforward foundation for authentication, rich-text editing, document storage, and permission-based sharing.