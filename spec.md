# Personal File Storage

## Current State
New project. No existing features.

## Requested Changes (Diff)

### Add
- User authentication (login/logout)
- File upload (single and multiple files, large file support)
- File listing in a grid/list view with name, size, type, upload date
- File download
- File deletion
- Storage usage indicator

### Modify
N/A

### Remove
N/A

## Implementation Plan
- Select `authorization` and `blob-storage` components
- Generate Motoko backend: user-scoped file metadata storage, upload/download/delete APIs backed by blob-storage
- Build React frontend: authenticated dashboard with file upload dropzone, file grid/list, storage usage bar, download and delete actions
