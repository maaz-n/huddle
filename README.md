<h1 align="center">Huddle</h1>
<img src='https://img.shields.io/badge/build-passing-brightgreen?style=for-the-badge'/>
<p align="center">
  <strong>A multi-workspace task management app built with modern web technologies. Its focused, clean, and role-based.</strong>
</p>

![](./public/huddle-bg.png)

Huddle was built to explore:

* Multi-tenant workspace architecture
* Role-based permissions
* Task workflows with review systems
* Server actions & modern fullstack patterns

---
<h2 align="center">Features it has</h2>

### 1. Workspaces

* Create and manage multiple workspaces
* Each workspace has its own members, tasks, and activity
* Role-based access (Owner / Admin / Member)

### 2. Members

* Invite existing users by email
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

### 4. My Tasks

* Personal task view
* Quick actions for completing work
* Streamlined contributor-focused workflow

### 5. Activity Log

* Every major action is tracked
* Status changes
* Assignments
* Task creation
* Visible in Dashboard & Activity views

### 6. Workspace Settings

* Rename workspace
* Delete workspace
* Manage team structure

---
<h2 align="center">Architecture Highlights</h2>


* Multi-tenant workspace structure
* Role stored per workspace (not globally)
* Clear separation between:

  * Global user data
  * Workspace-scoped data
* Server-side permission enforcement
* Reusable components across pages (Dashboard, Tasks, My Tasks)

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
<h2 align="center">Show Your Support</h2>
<p align="center">
  Give a ⭐️ if you liked this project!
</p>

---