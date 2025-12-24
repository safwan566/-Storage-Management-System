import { Router } from 'express';
import { 
  getAllImages, 
  getImageById, 
  updateImage, 
  deleteImage, 
  duplicateImage,
  toggleImageFavorite
} from '../controllers/image.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { updateImageSchema } from '../validators/image.validator';

const router = Router();

router.use(authenticate);

router.get('/', getAllImages);

router.get('/:id', getImageById);

router.patch('/:id/favorite', toggleImageFavorite);

router.patch('/:id', validate(updateImageSchema), updateImage);

router.post('/:id/duplicate', duplicateImage);

router.delete('/:id', deleteImage);

export default router;

