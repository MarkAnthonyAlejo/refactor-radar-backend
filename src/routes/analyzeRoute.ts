import express from 'express';
import { analyzeCodeController } from '../controllers/analyzeController';

const router = express.Router();

// Main entry route: receives code and returns analysis
router.post('/analyze', analyzeCodeController);



export default router;
