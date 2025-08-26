import express from 'express';
import type { Request, Response } from 'express';
import { analyzeCodeController } from '../controllers/analyzeController';

const router = express.Router();

//Select file on the front end and click Run Refactor and you will receie this post
// Main entry route: receives code and returns analysis
router.post('/analyze', analyzeCodeController);

//Route to the backend testing 
interface FilePayload {
    filename: string;
    code: string;
}

export default router;
