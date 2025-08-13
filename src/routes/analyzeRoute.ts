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

// router.post('/refactor', async (req: Request, res: Response) => {
//     //Need to move code to the controller
//     const files: FilePayload[] = req.body;

//     console.log('Received files:', files.map(file => file.filename));
//     // Example: process/analyze each file here
//     for (const file of files) {
//         console.log(`Analyzing: ${file.filename}`);
//         console.log(file.code.substring(0, 80) + '...'); // show preview
//     }

//     // Simulate processing and to see the data files
//     return res.json({ message: `Received ${files.length} files` });
//     //Need to move code to the controller
// });
//Select file on the front end and click Run Refactor and you will receie this post


export default router;
