const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/chat', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'プロンプトが空です。' });

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        // 正しい思考モードの設定方法はこちら
        thinkingConfig: {
          thinkingBudget: 2048 
        }
      }
    });
    res.json({ reply: response.response.text() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gemini APIの呼び出しに失敗しました。' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
