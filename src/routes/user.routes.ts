import { Router } from 'express';
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from '../controllers/user.controller';
import { authenticate, isAdmin } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createUserSchema,
  updateUserSchema,
  getUserSchema,
  deleteUserSchema,
} from '../validators/user.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Admin only routes
router.post('/', isAdmin, validate(createUserSchema), createUser);
router.get('/', isAdmin, getAllUsers);
router.get('/:id', isAdmin, validate(getUserSchema), getUserById);
router.put('/:id', isAdmin, validate(updateUserSchema), updateUser);
router.delete('/:id', isAdmin, validate(deleteUserSchema), deleteUser);

export default router;

