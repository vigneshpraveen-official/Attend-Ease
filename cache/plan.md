# Project Plan: Employee Attendance & Leave Management System

## Overview
A web-based system to manage employees, attendance, leaves, and analytics.
**Roles:** Admin, Employee.

## Tech Stack
- **Frontend:** React.js, TypeScript, **Material UI (MUI)**, Recharts
- **Backend:** Node.js, Express, TypeScript
- **Database:** **PostgreSQL (via Supabase)**
- **Auth:** JWT-based, Role-based Authorization
- **Hosting:** Netlify (Frontend/Functions)

---

## Phase 1: Project Initialization & Architecture Setup
- [ ] **Repo Setup:** Initialize Git, monorepo structure (client/server).
- [ ] **Backend Setup:**
    - Initialize Node.js + TypeScript project.
    - Setup Express server.
    - **Database:** Create Supabase project & configure connection string in `config/db.ts`.
    - Setup SQL Schema (Users, Employees, Attendance, Leaves) in Supabase.
- [ ] **Frontend Setup:**
    - Initialize React + Vite + TypeScript.
    - **UI Library:** Install `@mui/material`, `@emotion/react`, `@emotion/styled`.
    - Configure MUI `ThemeProvider` (Typography, Colors).
    - Setup routing (React Router).

## Phase 2: Authentication & User Management (Admin Core)
- [ ] **Backend:**
    - Implement Login API (Verify credentials against Supabase `users` table).
    - Issue JWT for session management.
    - Middleware: `verifyToken` and `authorizeRoles`.
    - CRUD APIs for Employees (Admin only).
- [ ] **Frontend:**
    - Login Page (MUI Card & TextFields).
    - Protected Routes.
    - **Admin Layout:** MUI `Drawer` (Sidebar) and `AppBar`.
    - Employee Management: MUI `DataGrid` for listing, Dialogs for Add/Edit.

## Phase 3: Attendance System (Core Feature)
- [ ] **Backend:**
    - Punch In / Punch Out APIs.
    - Logic: Calculate `total_hours` on punch-out.
    - Constraint: Prevent double punch-ins.
- [ ] **Frontend:**
    - Employee Dashboard: "Punch In/Out" Button (MUI Button with Loading state).
    - History: MUI Table showing daily records.
    - Status Chips: Present (Green), Absent (Red), Half Day (Yellow).

## Phase 4: Leave & Permission Management
- [ ] **Backend:**
    - Leave Request APIs (POST /leave).
    - Admin Action APIs (PUT /leave/status).
- [ ] **Frontend:**
    - Employee: Leave Application Form (MUI `DatePicker`, `Select`).
    - Admin: Leave Requests Table with "Approve/Reject" Action buttons.

## Phase 5: Dashboard & Analytics
- [ ] **Backend:**
    - Aggregation Endpoints: Counts for Users, Attendance stats.
    - Monthly summary query.
- [ ] **Frontend:**
    - Admin Dashboard: Stats Cards (MUI Paper), Attendance Bar Chart.
    - Employee Dashboard: Personal attendance summary.

## Phase 6: Polish, Deployment & Documentation
- [ ] **UI/UX:** Responsive Drawer (Mobile support), Error boundaries.
- [ ] **Deployment:**
    - Frontend: Deploy to Netlify.
    - Backend: Deploy Node server (or convert to Netlify Functions if applicable).
- [ ] **Documentation:** Update README with Supabase schema instructions.

---
**Current Status:** Re-Architecture Planned. Ready for Development.