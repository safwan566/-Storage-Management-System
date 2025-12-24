import { Router } from 'express';
import {
  signup,
  signin,
  forgotPassword,
  verifyCode,
  resetPassword,
} from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import {
  signupSchema,
  signinSchema,
  forgotPasswordSchema,
  verifyCodeSchema,
  resetPasswordSchema,
} from '../validators/auth.validator';

const router = Router();

router.post('/signup', validate(signupSchema), signup);
router.post('/signin', validate(signinSchema), signin);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/verify-code', validate(verifyCodeSchema), verifyCode);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

export default router;

