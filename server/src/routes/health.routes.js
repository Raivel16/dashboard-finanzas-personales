import { Router } from 'express';
import * as controlador from '../controllers/health.controller.js';

const router = Router();
router.get('/', controlador.obtener);

export default router;
