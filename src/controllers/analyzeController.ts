// controller/analyzeCodeController.ts
import { Request, Response } from 'express';
import fs from 'fs';
import { analyzeAndRefactorService } from '../services/analyzerService';
import { detectLanguageFromFilename } from '../utils/languageDetector';

export const analyzeCodeController = async (req: Request, res: Response) => {
  try {
    const results = [];

    for (let i = 0; i < req.body.length; i++) {
      const filePath = req.body[i].filename;

      if (!filePath) {
        return res.status(400).json({ error: 'Filename is required' });
      }

      const code = fs.readFileSync(filePath, 'utf-8');

      if (!code) {
        return res.status(400).json({ error: 'Code could not be read from file' });
      }

      const language = detectLanguageFromFilename(filePath);

      if (!language) {
        return res.status(422).json({ error: `Unsupported file type: ${filePath}` });
      }

      // Call new AI-powered analysis service
      const result = await analyzeAndRefactorService(filePath, code, language);

      results.push(result);

    }

    res.json({ results });
  } catch (error) {
    console.error('Error in analyzeCodeController:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
