import express, { Request, Response } from 'express';
import { supabase } from '../config/db';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

// PROTECTED ROUTE EXAMPLE: Get User Profile
// The frontend calls this with the Supabase JWT in the Authorization header.
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  const user = (req as any).user;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// SEED ADMIN (Using Supabase Admin API)
// This is necessary because we can't insert into auth.users via SQL easily.
router.post('/seed-admin', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    
    // We need a client with SERVICE_ROLE key to manage users
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.SUPABASE_URL;

    if (!serviceRoleKey || !supabaseUrl) {
        return res.status(500).json({message: "Server misconfigured: Missing Service Role Key"});
    }

    const { createClient } = require('@supabase/supabase-js');
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    try {
        // 1. Create User in Supabase Auth
        const { data: user, error: createError } = await adminClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { role: 'admin' } // This triggers our SQL function to set role in profiles
        });

        if (createError) {
             return res.status(400).json({ message: createError.message });
        }

        res.json({ message: "Admin user created successfully", user });

    } catch (err: any) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
});

export default router;
