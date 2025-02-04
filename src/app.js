import dotenv from 'dotenv';
import express from 'express';
import syncRouter from './src/routes/sync.js'; // Use .js extension

dotenv.config();

const app = express();
app.use(express.json());
app.use('/api', syncRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});