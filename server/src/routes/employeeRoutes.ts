import express, { Request, Response } from 'express';
import { supabase } from '../config/db';
import { requireAuth } from '../middleware/auth';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Initialize Admin Client for User Management
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// GET /api/employees - List all employees
router.get('/', requireAuth, async (req: Request, res: Response) => {
    // Check if requester is admin
    const user = (req as any).user;
    
    // RLS already handles visibility, so we can just query the table
    // But since we want to join profiles for email, let's do it here
    
    const { data, error } = await supabase
        .from('employees')
        .select(`
            *,
            profiles:id (email)
        `);

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// POST /api/employees - Create a new employee
router.post('/', requireAuth, async (req: Request, res: Response) => {
    const { email, password, first_name, last_name, department, designation, employee_code, role } = req.body;
    
    // 1. Create Auth User
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { 
            role: role || 'employee', // Allow admin to specify role
            first_name, 
            last_name 
        } 
    });

    if (createError) {
        return res.status(400).json({ error: createError.message });
    }
    
    const userId = userData.user.id;

    // 2. Update the auto-created employee record with extra details
    const { error: updateError } = await supabaseAdmin
        .from('employees')
        .update({ department, designation, employee_code })
        .eq('id', userId);

    if (updateError) {
        console.error("Error updating employee details:", updateError);
        return res.status(201).json({ 
            message: "User created but details update failed", 
            userId 
        });
    }

    res.status(201).json({ message: "Employee created successfully", userId });
});

// PUT /api/employees/:id - Update an existing employee
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
    const { id } = req.params;
    const { first_name, last_name, department, designation, employee_code, role } = req.body;

    // 1. Update Profile (Role)
    if (role) {
        const { error: roleError } = await supabaseAdmin
            .from('profiles')
            .update({ role })
            .eq('id', id);
        if (roleError) return res.status(500).json({ error: roleError.message });
    }

    // 2. Update Employee Details
    const { error: empError } = await supabaseAdmin
        .from('employees')
        .update({ 
            first_name, 
            last_name, 
            department, 
            designation, 
            employee_code 
        })
        .eq('id', id);

    if (empError) return res.status(500).json({ error: empError.message });

    res.json({ message: "Employee updated successfully" });
});

export default router;
