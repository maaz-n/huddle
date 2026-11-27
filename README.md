<h1 align="center">Huddle</h1>

<p align="center">
  <strong>A multi-workspace task management app built with modern web technologies. Its focused, clean, and role-based.</strong> <br><br>
  <a href='https://teamhuddle.vercel.app'>
  <img src="https://img.shields.io/badge/Check it out-↗-purple"/>
  </a>
  

</p>

![](./public/huddle-bg.png)

Huddle was built to explore:

* Multi-tenant workspace architecture
* Role-based permissions
* Task workflows with review systems
* Server actions & modern fullstack patterns
* Optimistic status changes, subtask toggles, and notification reads with rollback on failure
* Keyboard-friendly sidebar, table rows, labelled controls, and a skip link
* English/Urdu UI language switcher in the user menu

---
<h2 align="center">Features</h2>

### 1. Workspaces

* Create and manage multiple workspaces
* Each workspace has its own members, tasks, and activity
* Role-based access (Owner / Admin / Member)

### 2. Members

* Invite existing users by email
* Invite new people with expiring email links
* Review and revoke pending invitations
* Assign roles
* Remove members
* Role-based permissions enforced server-side

### 3. Tasks

* Create, assign, and track tasks
* Status workflow:

  * `Todo`
  * `In Review`
  * `Done`
* Members submit work for review
* Admins/Owners approve or request revisions
* Search by title, sort by updated/due date/priority/title, and page results
* Admins/Owners can bulk update status or delete selected tasks
* Colored workspace labels on tasks, managed from the detail modal
* File attachments on tasks (5 MB per file, 20 per task) with authenticated downloads
* Subtask checklists with progress tracking
* Recurring daily/weekly/monthly tasks that schedule the next occurrence on completion

### 4. My Tasks

* Personal task view
* Quick actions for completing work
* Streamlined contributor-focused workflow

### 5. Notifications

* Persistent in-app notifications with an unread badge
* Assignments, review submissions, approvals, and change requests
* Workspace additions and role changes
* Mark individual or all notifications as read
* Optional email alerts for assignments and change requests

### 6. Activity Log

* Every major action is tracked
* Task comments with author, timestamp, and notifications for the assignee and creator
* Per-task timeline of status changes, edits, and comments in the detail modal
* Dedicated workspace activity page with load-more paging
* Workspace audit trail for renames, member changes, ownership transfers, and invitations
* Status changes
* Assignments
* Task creation
* Visible in Dashboard & Activity views

### 7. Workspace Settings

* Rename workspace
* Delete workspace
* Manage team structure

### 8. Profile

* Upload or remove a profile picture (PNG, JPEG, WebP, or GIF up to 2 MB)
* Edit display name and email notification preference

### 9. Authentication

* Email verification required for new accounts, with a resendable link
* Password reset and Google sign-in

---
<h2 align="center">Architecture Highlights</h2>


* Multi-tenant workspace structure
* Role stored per workspace (not globally)
* Clear separation between:

  * Global user data
  * Workspace-scoped data
* Server-side permission enforcement

---
<h2 align="center">Roles & Permissions</h2>

| Role   | Can Manage Members | Can Review Tasks | Can Delete Workspace |
| ------ | ------------------ | ---------------- | -------------------- |
| Owner  | ✅                  | ✅                | ✅                    |
| Admin  | ✅                  | ✅                | ❌                    |
| Member | ❌                  | ❌                | ❌                    |

Members can:

* Work on assigned tasks
* Submit for review
* Receive revision feedback

---
<h2 align="center">Task Review Flow</h2>

```
Member completes task
        ↓
     In Review
        ↓
Admin approves → Done
Admin requests changes → Todo (with revision note)
```
---
<h2 align="center">Environment</h2>

Copy `.env.example` to `.env.local` and fill in the values you need:

| Variable | Purpose |
| -------- | ------- |
| `DATABASE_URL` | Neon Postgres connection string |
| `DATABASE_URL_TEST` | Separate Neon branch used by the tests |
| `BETTER_AUTH_URL` | Public app URL, e.g. `http://localhost:3000` |
| `BETTER_AUTH_SECRET` | Secret used to sign sessions |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth credentials |
| `RESEND_API_KEY` | Resend API key for password-reset and invitation emails |
| `EMAIL_FROM` | Verified Resend sender address (defaults to `onboarding@resend.dev`) |

---
<h2 align="center">Show Your Support</h2>
<p align="center">
  Give a ⭐️ if you liked this project!
</p>

---