# Issues System

The WB Starter includes a built-in issue tracking system that allows users to report bugs and track their resolution status with user approval workflow.

## Overview

The issue system consists of:
- **Issues Panel**: Accessible via the 📝 button in the header
- **Issue Tracker Modal**: Click the issue count to view/manage all issues
- **Server API**: RESTful endpoints for CRUD operations
- **WebSocket Notifications**: Real-time updates when issues change
- **User Approval**: Issues are not resolved until user confirms the fix

## Data Files

| File | Purpose |
|------|---------|
| `data/issues.json` | User-submitted notes/issues (raw input) |
| `data/pending-issues.json` | Parsed issues with status tracking |

## Issue Lifecycle

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  User saves │ ──▶ │ Server parses│ ──▶ │   Issue is   │ ──▶ │ Claude fixes │
│   a note    │     │  paragraphs  │     │   pending    │     │  the issue   │
└─────────────┘     └──────────────┘     └──────────────┘     └──────┬───────┘
                                                               │
                                                               ▼
                    ┌──────────────┐     ┌──────────────┐
                    │   Issue is   │ ◀── │ pending-review│
                    │   resolved   │     │ (User review) │
                    └──────────────┘     └──────┬───────┘
                          ▲                   │
                          │    ✔️ Approved     │ ❌ Rejected
                          └───────────────────┴────▶ Back to pending
```

### Status Flow

1. **pending** (⏳): New issue, waiting for fix
2. **pending-review** (🔍): Claude claims fixed, awaiting user approval
3. **resolved** (✅): User confirmed the fix works
4. **rejected** → Returns to **pending**: User rejected the fix

## Issue Schema

Each issue in `pending-issues.json` has the following structure:

```json
{
  "id": "note-1234567890-p0",
  "description": "Bug description text",
  "status": "pending",
  "createdAt": "2025-01-19T12:00:00.000Z",
  "claimedFixedAt": null,
  "resolvedAt": null,
  "resolution": null
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier (format: `{noteId}-p{paragraphIndex}`) |
| `description` | string | The issue description text |
| `status` | string | One of: `pending`, `pending-review`, `resolved` |
| `createdAt` | string | ISO 8601 timestamp when created |
| `claimedFixedAt` | string? | ISO 8601 timestamp when Claude claimed fixed |
| `resolvedAt` | string? | ISO 8601 timestamp when user approved (null if not resolved) |
| `resolution` | string? | Description of how the issue was fixed |

## API Endpoints

### GET /api/pending-issues

Fetch issues list.

**Query Parameters:**
- `all=true` - Return all issues (pending + pending-review + resolved)
- _(default)_ - Return only pending issues

**Response:**
```json
{
  "issues": [...],
  "total": 5,
  "lastUpdated": "2025-01-19T12:00:00.000Z"
}
```

### POST /api/update-issue

Update issue status.

**Request Body:**
```json
{
  "issueId": "note-123-p0",
  "status": "resolved",
  "resolution": "Fixed by updating CSS"
}
```

**Status Values:**
- `resolved` or `fixed`: Sets to `pending-review` (awaiting user approval)
- `approved`: User approves, sets to `resolved`
- `rejected`: User rejects, sets back to `pending`

### POST /api/update-issue-details

Update issue description and/or resolution.

**Request Body:**
```json
{
  "issueId": "note-123-p0",
  "description": "Updated description",
  "resolution": "Root cause was X, fixed by Y"
}
```

### POST /api/delete-issue

Delete a single issue.

**Request Body:**
```json
{
  "issueId": "note-123-p0"
}
```

### POST /api/clear-resolved-issues

Remove all resolved issues from the list.

## UI Components

### Status Bar

Located in the Notes panel footer:
```
🟢 2⏳ 1🔍 3✓ ⚫
 │  │   │   │  └── Spinner (animated when working)
 │  │   │   └───── Resolved count
 │  │   └───────── Pending review count
 │  └───────────── Pending count
 └──────────────── WebSocket connection status
```

### Issue Tracker Modal

Click the issue count to open the modal:
- **Header**: Shows pending/review/resolved counts
- **Issue List**: Expandable cards for each issue
- **Pending Issues**: Show "Mark Fixed" and delete buttons
- **Review Issues**: Show "✅ Fixed" and "❌ Not Fixed" approval buttons
- **Resolved Issues**: Show resolution details
- **Footer**: Clear resolved, refresh buttons

## WebSocket Events

The server broadcasts issue updates via WebSocket on port 3001:

```json
{
  "type": "claude-response",
  "data": {
    "status": "info|success|error",
    "issue": "Issue title",
    "action": "Description of action taken"
  }
}
```

## Usage

### Reporting an Issue

1. Click 📝 in the header to open the Issues panel
2. Type your issue description
3. Press Enter or click 💾 to save
4. The server automatically parses and tracks the issue

### Managing Issues

1. Click the issue count (e.g., `2⏳ 1🔍 3✓`) to open the tracker
2. Click an issue to expand details
3. For pending issues: Edit description, mark fixed, or delete
4. For review issues: Click "✅ Fixed" to approve or "❌ Not Fixed" to reject
5. For resolved issues: View/edit resolution details

### Approving/Rejecting Fixes

When Claude marks an issue as fixed:
1. Issue status changes to `pending-review` (🔍)
2. Open the Issue Tracker to see the review panel
3. Claude's resolution message is displayed
4. Click **✅ Fixed** to approve → Issue becomes resolved
5. Click **❌ Not Fixed** to reject → Issue returns to pending

### Clearing Resolved Issues

1. Open the Issue Tracker modal
2. Click "🗑️ Clear Resolved" at the bottom
3. Confirm the action

## Configuration

The Notes component accepts these options:

```html
<wb-notes
  data-position="modal"
  data-max-width="50vw"
  data-min-width="200px"
  data-default-width="320px"
  data-placeholder="Describe the issue..."
></wb-notes>
```

## File Locations

```
wb-starter/
├── data/
│   ├── issues.json           # Raw user input
│   └── pending-issues.json   # Parsed issues with status
├── src/
│   ├── wb-models/
│   │   └── pending-issues.schema.json  # JSON Schema
│   └── wb-viewmodels/
│       └── notes.js          # UI component
└── server.js                 # API endpoints & watchers
```

## Automated Tests (Playwright)

All automated tests for Issues are implemented using Playwright (we do **not** use Jest). Tests are located under `tests/behaviors`:

- `tests/behaviors/api/issues-api.spec.ts` — API-level tests for `/api/add-issue`, `/api/pending-issues`, `/api/update-issue`, `/api/delete-issue`, and `/api/clear-resolved-issues`.
- `tests/behaviors/ui/issues-ui.spec.ts` — End-to-end UI tests for the Issues drawer and Issue Tracker modal (create via header button, save note, verify pending issues, open tracker modal).

To run the Issues tests locally (preferred):

- Run the dev server: `npm start`
- Run just the behavior tests: `npx playwright test tests/behaviors/api/issues-api.spec.ts tests/behaviors/ui/issues-ui.spec.ts`

Or use existing grouped scripts:

- `npm run test:behaviors` (runs the full behaviors suite including compliance/behavior groups)

Notes:
- Tests use Playwright's `request` fixture for API assertions and `page` for UI interactions.
- Tests are idempotent and cleanup after themselves where possible (delete the test-created issue).

