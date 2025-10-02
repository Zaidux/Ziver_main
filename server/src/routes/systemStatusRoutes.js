import express from 'express';
import { 
  getSystemStatus, 
  toggleLockdown, 
  updateComponentStatus 
} from '../controllers/systemStatusController.js';
import { admin } from '../middleware/adminMiddleware.js';

const router = express.Router();

router.get('/status', getSystemStatus);
router.post('/lockdown/toggle', admin, toggleLockdown);
router.post('/component/status', admin, updateComponentStatus);

export default router;