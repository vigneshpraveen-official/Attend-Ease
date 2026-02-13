-- Fix RLS Infinite Recursion

-- 1. Create a secure function to check admin status
-- SECURITY DEFINER means this function runs with the privileges of the creator (superuser),
-- bypassing RLS checks on the 'profiles' table within the function itself.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 2. Drop the problematic recursive policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins full access to employees" ON public.employees;
DROP POLICY IF EXISTS "Admins full access to attendance" ON public.attendance;
DROP POLICY IF EXISTS "Admins full access to leaves" ON public.leaves;

-- 3. Re-create policies using the safe is_admin() function

-- Profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING ( is_admin() );

-- Employees
CREATE POLICY "Admins full access to employees" ON public.employees
    FOR ALL USING ( is_admin() );

-- Attendance
CREATE POLICY "Admins full access to attendance" ON public.attendance
    FOR ALL USING ( is_admin() );

-- Leaves
CREATE POLICY "Admins full access to leaves" ON public.leaves
    FOR ALL USING ( is_admin() );
