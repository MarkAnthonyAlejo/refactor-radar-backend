// controllers/analyzeController.ts
import { Request, Response } from 'express';
import { analyzeAndRefactorService } from '../services/analyzerService';
import { detectLanguageFromFilename } from '../utils/languageDetector';

export const analyzeCodeController = async (req: Request, res: Response) => {
  try {
    const results = [];
    console.log('In the Controller')

    for (let i = 0; i < req.body.length; i++) {
      const { filename, code } = req.body[i];

      if (!filename || !code) {
        return res.status(400).json({ error: 'Filename and code are required' });
      }

      const language = detectLanguageFromFilename(filename);
      if (!language) {
        return res.status(422).json({ error: `Unsupported file type: ${filename}` });
      }

      // Call AI + AST analyzer
      const result = await analyzeAndRefactorService(filename, code, language);

      results.push(result);
    }

    res.json({ results });
  } catch (error) {
    console.error('Error in analyzeCodeController:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
