import { Request, Response, NextFunction } from 'express';
import { loginService } from '../services/auth.service';
import { sendSuccess, sendError } from '../utils/response';

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const result = await loginService(email, password);
    return sendSuccess(res, 200, result);
  } catch (error: any) {
    if (error.status && error.message) {
      return sendError(res, error.status, error.message);
    }
    next(error);
  }
};
