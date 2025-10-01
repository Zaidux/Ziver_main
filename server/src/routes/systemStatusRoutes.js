import express from 'express';
import { 
  getSystemStatus, 
  toggleLockdown, 
  updateComponentStatus 
} from '../controllers/systemStatusController.js';
import adminMiddleware from '../middleware/adminMiddleware.js';

const router = express.Router();

router.get('/status', getSystemStatus);
router.post('/lockdown/toggle', adminMiddleware, toggleLockdown);
router.post('/component/status', adminMiddleware, updateComponentStatus);

export default router;