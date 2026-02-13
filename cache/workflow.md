# System Refinement & Production Workflow

This document outlines the strategy for building the "Employee Attendance Management System" with the updated stack (MUI + Supabase).

## Phase A: UI Standardization (Material UI)
- **Theme Config:** Set up a centralized MUI `createTheme` (Primary: Corporate Blue, Secondary: Orange).
- **Component Replacement:**
    - Replace HTML tables with **MUI DataGrid**.
    - Replace standard inputs with **MUI TextField/Select**.
    - Replace modals with **MUI Dialog**.
- **Responsive Layout:** Implement a persistent Sidebar (Drawer) for Desktop and temporary Drawer for Mobile.

## Phase B: Database & API Protocol
- **Supabase Integration:**
    - Ensure all Node.js queries target the Supabase PostgreSQL instance.
    - [cite_start]Verify Foreign Key constraints between `employees`, `attendance`, and `leaves`[cite: 124].
- **Error Handling:** Centralized error response format `{ success: false, message: string }`.

## Phase C: Business Logic Rigor
- **Attendance Logic:**
    - **Punch In:** Check if `punch_in` exists for `CURRENT_DATE`.
    - **Punch Out:** Update `punch_out` timestamp and calculate `(punch_out - punch_in)` hours.
- **Leave Logic:** Ensure `from_date` cannot be greater than `to_date`.

## Phase D: Clean Code & Verification
- **Strict Typing:** Ensure all TypeScript interfaces (User, Attendance, Leave) match Supabase schema.
- **Linting:** Remove unused imports and console logs.