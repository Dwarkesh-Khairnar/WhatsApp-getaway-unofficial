import express from 'express';
import cors from 'cors';
import router from './routes.js';
import { config } from './config.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Mount the API routes
app.use('/api', router);

app.listen(PORT, () => {
  console.log(`🚀 WhatsApp Gateway Backend running on http://localhost:${PORT}`);
});