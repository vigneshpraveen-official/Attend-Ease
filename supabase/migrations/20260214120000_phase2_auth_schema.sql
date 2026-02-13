-- Migration: Phase 2 - Database & Auth (Supabase Native)
-- This schema adopts Supabase Auth (auth.users) as the identity provider.

-- 1. Clean up Phase 1 Custom Auth tables if they exist (to avoid confusion with auth.users)
DROP TABLE IF EXISTS public.employees CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 2. Create Profiles Table (Extends auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    role TEXT NOT NULL CHECK (role IN ('admin', 'employee')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Employees Table
CREATE TABLE public.employees (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    department TEXT NOT NULL,
    designation TEXT NOT NULL,
    joining_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Attendance Table
CREATE TABLE public.attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    check_in TIMESTAMP WITH TIME ZONE,
    check_out TIMESTAMP WITH TIME ZONE,
    status TEXT CHECK (status IN ('present', 'absent', 'late', 'half-day')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create Leaves Table
CREATE TABLE public.leaves (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    leave_type TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies

-- Profiles: Users can view their own; Admins can view all.
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Employees: Employees read-only (own); Admins full CRUD.
CREATE POLICY "Employees can view own details" ON public.employees
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins full access to employees" ON public.employees
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Attendance: Employees view own; Admins view all.
CREATE POLICY "Employees can view own attendance" ON public.attendance
    FOR SELECT USING (employee_id = auth.uid());

CREATE POLICY "Admins full access to attendance" ON public.attendance
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Leaves: Employees view own; Admins view all.
CREATE POLICY "Employees can view own leaves" ON public.leaves
    FOR SELECT USING (employee_id = auth.uid());

CREATE POLICY "Employees can insert own leaves" ON public.leaves
    FOR INSERT WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Admins full access to leaves" ON public.leaves
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 8. Triggers for Automatic Profile Creation

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    new.id, 
    new.email,
    COALESCE((new.raw_user_meta_data->>'role')::text, 'employee') -- Default to employee
  );
  
  -- If role is employee, also insert into employees table stub
  IF COALESCE((new.raw_user_meta_data->>'role')::text, 'employee') = 'employee' THEN
      INSERT INTO public.employees (id, first_name, last_name, department, designation)
      VALUES (
          new.id, 
          COALESCE((new.raw_user_meta_data->>'first_name')::text, 'New'), 
          COALESCE((new.raw_user_meta_data->>'last_name')::text, 'User'), 
          'Unassigned', 
          'TBD'
      );
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
