import { Request, Response } from 'express';
import { analyzeCodeService } from '../services/analyzerService';

export const analyzeCodeController = async (req: Request, res: Response) => {
    console.log('headers', Headers)
    console.log('body - > ', req.body)
    try {
    
    const { filename, code } = req.body;

    if (!filename || !code) {
      return res.status(400).json({ error: 'Filename and code are required' });
    }

    //This will get the services needed for the code to be returned
    const result = await analyzeCodeService(code, filename);

    res.status(200).json(result);
  } catch (error) {
    console.error('Error in analyzeCodeController:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
