import { Router } from 'express';
import { getHome, getHealth } from '../controllers/homeController';

const router = Router();

router.get('/', getHome);
router.get('/health', getHealth);

export default router;
