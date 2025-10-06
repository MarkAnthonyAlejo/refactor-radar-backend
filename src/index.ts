import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import analyzeRoute from './routes/analyzeRoute'



dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000; //process.env.PORT will be added later 

app.use(cors());
app.use(express.json());

// Register routes
app.use('/api', analyzeRoute)

console.log('IM HERE');
app.get('/', (req, res) => {
  res.send('Refactor Radar Backend is running 🚀');
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
