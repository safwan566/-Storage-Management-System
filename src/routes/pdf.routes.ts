import { Router } from 'express';
import { 
  getAllPDFs, 
  getPDFById, 
  updatePDF, 
  deletePDF, 
  duplicatePDF,
  togglePDFFavorite
} from '../controllers/pdf.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { updatePDFSchema } from '../validators/pdf.validator';

const router = Router();

router.use(authenticate);

router.get('/', getAllPDFs);

router.get('/:id', getPDFById);

router.patch('/:id/favorite', togglePDFFavorite);

router.patch('/:id', validate(updatePDFSchema), updatePDF);

router.post('/:id/duplicate', duplicatePDF);

router.delete('/:id', deletePDF);

export default router;

