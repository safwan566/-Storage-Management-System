import { Router } from 'express';
import { 
  getAllPDFs, 
  getPDFById, 
  updatePDF, 
  deletePDF, 
  duplicatePDF 
} from '../controllers/pdf.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { updatePDFSchema } from '../validators/pdf.validator';

const router = Router();

router.use(authenticate);

router.get('/', getAllPDFs);

router.get('/:id', getPDFById);

router.patch('/:id', validate(updatePDFSchema), updatePDF);

router.delete('/:id', deletePDF);

router.post('/:id/duplicate', duplicatePDF);

export default router;

