# 🏢 AttendEase - Employee Management System (EMS)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/frontend-React%20%2B%20Vite-61DAFB)
![Node](https://img.shields.io/badge/backend-Node.js%20%2B%20Express-339933)
![Supabase](https://img.shields.io/badge/database-Supabase-3ECF8E)
![TypeScript](https://img.shields.io/badge/language-TypeScript-3178C6)

**AttendEase** is a comprehensive, modern Employee Management System designed to streamline attendance tracking, leave management, and employee administration. Built with a robust **React** frontend and a secure **Node.js/Express** backend, it leverages **Supabase** for real-time database capabilities and authentication.

---

## 🚀 Key Features

### 🛡️ Admin Panel
*   **Dashboard Insights:** Real-time overview of total employees, daily attendance, active leaves, and pending requests.
*   **Data Visualization:** Interactive weekly attendance charts using Recharts.
*   **Employee Management:** 
    *   Add, view, and manage employee profiles.
    *   Search and filter employees by department or name.
*   **Attendance Monitoring:** Track daily check-ins/outs for all staff.
*   **Leave Management:** Approve or reject leave requests with remarks.

### 👤 Employee Panel
*   **Self-Service Dashboard:** View today's status and punch-in/out times.
*   **Smart Attendance:** 
    *   One-click **Punch In / Punch Out**.
    *   Automatic calculation of total work hours.
    *   Status tracking (Present, Half-Day, Late).
*   **Leave Application:** Apply for Full Day, Half Day, or Permission leaves with date ranges and reasons.
*   **History:** View personal attendance history and leave request status.

---

## 🛠️ Tech Stack

### Frontend (Client)
*   **Framework:** [React](https://react.dev/) + [Vite](https://vitejs.dev/)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **UI Components:** [Shadcn UI](https://ui.shadcn.com/) / [Material UI](https://mui.com/)
*   **Icons:** [Lucide React](https://lucide.dev/)
*   **Charts:** [Recharts](https://recharts.org/)
*   **State/Data Fetching:** React Query & Context API

### Backend (Server)
*   **Runtime:** [Node.js](https://nodejs.org/)
*   **Framework:** [Express.js](https://expressjs.com/)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Security:** JWT Verification (Supabase Auth Middleware)

### Database & Auth
*   **Platform:** [Supabase](https://supabase.com/)
*   **Database:** PostgreSQL
*   **Auth:** Supabase Auth (JWT based)
*   **Security:** Row Level Security (RLS) Policies

---

## 📂 Project Structure

```bash
EMS-Portal/
├── src/                  # Frontend Source Code
│   ├── components/       # Reusable UI components
│   ├── hooks/            # Custom hooks (useAuth, etc.)
│   ├── pages/            # Application Pages
│   │   ├── admin/        # Admin-specific pages
│   │   └── employee/     # Employee-specific pages
│   ├── integrations/     # Supabase client setup
│   └── lib/              # Utility functions
├── server/               # Backend Source Code
│   ├── src/
│   │   ├── config/       # Database configuration
│   │   ├── middleware/   # Auth middleware
│   │   └── routes/       # API Routes (Auth, Employees)
│   └── scripts/          # Helper scripts (seeding, checks)
├── supabase/             # Database Migrations & Config
└── public/               # Static assets
```

---

## 💾 Database Schema

The system uses a relational PostgreSQL schema:

1.  **`profiles`**: Extends Supabase Auth users. Stores `email`, `role` (admin/employee).
2.  **`employees`**: Detailed info linked to profiles. Stores `first_name`, `last_name`, `department`, `designation`, `joining_date`.
3.  **`attendance`**: Tracks `check_in`, `check_out`, `status`, `date`.
4.  **`leaves`**: Tracks `leave_type`, `start_date`, `end_date`, `reason`, `status`.

---

## 🏁 Getting Started

### Prerequisites
*   Node.js (v16+)
*   npm or yarn
*   A Supabase project

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/ems-portal.git
cd ems-portal
```

### 2. Setup Environment Variables

**Frontend (`.env`):**
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:5000
```

**Backend (`server/.env`):**
```env
PORT=5000
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Database Setup
Run the SQL migrations located in `supabase/migrations/` in your Supabase SQL Editor to create tables and set up RLS policies.

### 4. Installation & Running

**Install Dependencies:**
```bash
# Frontend
npm install

# Backend
cd server
npm install
```

**Run Development Servers:**
```bash
# Terminal 1: Backend
cd server
npm run dev

# Terminal 2: Frontend
npm run dev
```

Visit `http://localhost:5173` to view the app.

---

## 🔐 Security

*   **Authentication:** All API requests are authenticated via JWT tokens issued by Supabase.
*   **Authorization:** Role-based checks ensure Employees cannot access Admin routes.
*   **Row Level Security (RLS):** Database policies prevent users from accessing data they don't own (e.g., an employee can only see their own attendance).

---

## 🤝 Contributing

Contributions are welcome! Please fork the repository and create a pull request with your features or fixes.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
