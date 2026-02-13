
-- 1. Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'employee');

-- 2. Create attendance status enum
CREATE TYPE public.attendance_status AS ENUM ('Present', 'Absent', 'Half Day');

-- 3. Create leave type enum
CREATE TYPE public.leave_type AS ENUM ('Full', 'Half', 'Permission');

-- 4. Create leave status enum
CREATE TYPE public.leave_status AS ENUM ('Pending', 'Approved', 'Rejected');

-- 5. Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  date_of_joining DATE NOT NULL DEFAULT CURRENT_DATE,
  department TEXT,
  designation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Create user_roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- 7. Create attendance table
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  punch_in TIMESTAMPTZ,
  punch_out TIMESTAMPTZ,
  total_hours NUMERIC(5,2),
  status attendance_status NOT NULL DEFAULT 'Present',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employee_id, date)
);

-- 8. Create leaves table
CREATE TABLE public.leaves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type leave_type NOT NULL,
  reason TEXT NOT NULL,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  status leave_status NOT NULL DEFAULT 'Pending',
  admin_remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;

-- 10. Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 11. Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 12. Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON public.attendance FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leaves_updated_at BEFORE UPDATE ON public.leaves FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 13. RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update profiles" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- 14. RLS Policies for user_roles
CREATE POLICY "Users can view their own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- 15. RLS Policies for attendance
CREATE POLICY "Employees can view their own attendance" ON public.attendance FOR SELECT USING (auth.uid() = employee_id);
CREATE POLICY "Employees can insert their own attendance" ON public.attendance FOR INSERT WITH CHECK (auth.uid() = employee_id);
CREATE POLICY "Employees can update their own attendance" ON public.attendance FOR UPDATE USING (auth.uid() = employee_id);
CREATE POLICY "Admins can view all attendance" ON public.attendance FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert attendance" ON public.attendance FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update attendance" ON public.attendance FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- 16. RLS Policies for leaves
CREATE POLICY "Employees can view their own leaves" ON public.leaves FOR SELECT USING (auth.uid() = employee_id);
CREATE POLICY "Employees can insert their own leaves" ON public.leaves FOR INSERT WITH CHECK (auth.uid() = employee_id);
CREATE POLICY "Admins can view all leaves" ON public.leaves FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update leaves" ON public.leaves FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
