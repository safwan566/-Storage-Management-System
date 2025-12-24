import { Router } from 'express';
import { updateProfile, changePassword, deleteProfile } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { updateProfileSchema, changePasswordSchema } from '../validators/user.validator';
import { uploadSingleImage } from '../middlewares/fileUpload.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Update profile (name and/or avatar)
router.patch(
  '/profile',
  uploadSingleImage,
  validate(updateProfileSchema),
  updateProfile
);

// Change password
router.patch(
  '/change-password',
  validate(changePasswordSchema),
  changePassword
);

// Delete profile
router.delete('/profile', deleteProfile);

export default router;

