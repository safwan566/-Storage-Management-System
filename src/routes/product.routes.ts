import { Router } from 'express';
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
} from '../controllers/product.controller';
import { authenticate, isAdminOrManager } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createProductSchema,
  updateProductSchema,
  getProductSchema,
  deleteProductSchema,
} from '../validators/product.validator';

const router = Router();

// Public routes
router.get('/', getAllProducts);
router.get('/:id', validate(getProductSchema), getProductById);

// Protected routes
router.use(authenticate);

// Admin and Manager routes
router.post('/', isAdminOrManager, validate(createProductSchema), createProduct);
router.put('/:id', isAdminOrManager, validate(updateProductSchema), updateProduct);
router.delete('/:id', isAdminOrManager, validate(deleteProductSchema), deleteProduct);
router.get('/reports/low-stock', isAdminOrManager, getLowStockProducts);

export default router;

