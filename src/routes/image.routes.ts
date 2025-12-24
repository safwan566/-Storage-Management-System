import { Router } from 'express';
import { 
  getAllImages, 
  getImageById, 
  updateImage, 
  deleteImage, 
  duplicateImage 
} from '../controllers/image.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { updateImageSchema } from '../validators/image.validator';

const router = Router();

router.use(authenticate);

router.get('/', getAllImages);

router.get('/:id', getImageById);

router.patch('/:id', validate(updateImageSchema), updateImage);

router.delete('/:id', deleteImage);

router.post('/:id/duplicate', duplicateImage);

export default router;

