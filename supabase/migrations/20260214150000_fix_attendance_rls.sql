-- Fix Attendance RLS Policies

-- Allow employees to INSERT their own attendance records
CREATE POLICY "Employees can punch in" ON public.attendance
    FOR INSERT WITH CHECK (employee_id = auth.uid());

-- Allow employees to UPDATE their own attendance records (for punch out)
CREATE POLICY "Employees can punch out" ON public.attendance
    FOR UPDATE USING (employee_id = auth.uid());
