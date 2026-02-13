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
    const { email, password, first_name, last_name, department, designation } = req.body;
    
    // 1. Create Auth User
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: 'employee', first_name, last_name } // Triggers auto-creation
    });

    if (createError) {
        return res.status(400).json({ error: createError.message });
    }
    
    const userId = userData.user.id;

    // 2. Update the auto-created employee record with extra details
    // The trigger only sets first_name/last_name. We need to set dept/designation.
    const { error: updateError } = await supabaseAdmin
        .from('employees')
        .update({ department, designation })
        .eq('id', userId);

    if (updateError) {
        console.error("Error updating employee details:", updateError);
        // Note: User is created, but details might be missing.
        return res.status(201).json({ 
            message: "User created but details update failed", 
            userId 
        });
    }

    res.status(201).json({ message: "Employee created successfully", userId });
});

export default router;
