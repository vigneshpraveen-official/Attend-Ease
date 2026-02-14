-- Phase 3 Updates: Employee Code & Leave Times

-- 1. Add employee_code to employees table
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS employee_code TEXT UNIQUE;

-- 2. Add start_time and end_time to leaves table
ALTER TABLE public.leaves ADD COLUMN IF NOT EXISTS start_time TIME;
ALTER TABLE public.leaves ADD COLUMN IF NOT EXISTS end_time TIME;

-- 3. Add admin_remarks to leaves table (if not exists, as per MyLeaves.tsx usage)
ALTER TABLE public.leaves ADD COLUMN IF NOT EXISTS admin_remarks TEXT;

-- 4. Ensure leave_type matches the new requirements (Full, Half, Permission)
-- Note: Existing constraints might be 'Full', 'Half', 'Permission'.
-- We'll verify constraints. If needed, we can drop and re-add constraint,
-- but for now assuming TEXT or compatible constraint.
