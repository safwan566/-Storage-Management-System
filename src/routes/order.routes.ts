import { Router } from 'express';
import {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrder,
  cancelOrder,
  getMyOrders,
} from '../controllers/order.controller';
import { authenticate, isAdminOrManager } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createOrderSchema,
  updateOrderSchema,
  getOrderSchema,
  cancelOrderSchema,
} from '../validators/order.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// User routes
router.post('/', validate(createOrderSchema), createOrder);
router.get('/my-orders', getMyOrders);
router.get('/:id', validate(getOrderSchema), getOrderById);
router.post('/:id/cancel', validate(cancelOrderSchema), cancelOrder);

// Admin and Manager routes
router.get('/', isAdminOrManager, getAllOrders);
router.put('/:id', isAdminOrManager, validate(updateOrderSchema), updateOrder);

export default router;

