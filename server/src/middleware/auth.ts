import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/db';

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'Missing Authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify the JWT using Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error("Token verification failed:", error?.message);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // Attach user to request object (you might need to extend Request type)
    (req as any).user = user;

    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err);
    res.status(500).json({ message: 'Internal server error during authentication' });
  }
};
