import express from 'express';
import axios from 'axios';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();
const PORT = 8000;

app.use(cors());
app.use(bodyParser.json());

app.post('/api/invoices', async (req, res) => {
  const { price, currency } = req.body;
  console.log('price', price);
  console.log('currency', currency);

  try {
    const bitpayResponse = await axios.post(
      'https://tshumaker.bp:8088/invoices',
      {
        price,
        currency,
        token: '5DtFoQKZqdJTsS8ccsSgvFrQkugyHuBJFibHxk3jog1L',
        redirectURL: 'https://taven.io',
        autoRedirect: true,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-accept-version': '2.0.0',
        }
      }
    );

    res.json(bitpayResponse.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      console.log('Request failed:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
