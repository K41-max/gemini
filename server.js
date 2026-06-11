const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
app.use(cors());
// 画像のBase64データを受け取るため、上限を50mbに拡張します
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/chat', async (req, res) => {
  // フロントから「これまでの履歴」「新しいメッセージ」「画像リスト」を受け取る
  const { history, message, images } = req.body;

  if (!message && (!images || images.length === 0)) {
    return res.status(400).json({ error: '入力が空です。' });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

    // 1. 過去のテキスト会話履歴をGeminiのフォーマットに変換
    const contents = history.map(item => ({
      role: item.role,
      parts: [{ text: item.text }]
    }));

    // 2. 今回の最新の入力を組み立てる
    const newParts = [];

    // 画像があれば、すべてparts配列に追加（マルチモーダル対応）
    if (images && images.length > 0) {
      images.forEach(img => {
        newParts.push({
          inlineData: {
            mimeType: img.mimeType,
            data: img.data // Base64の纯粋なデータ部分
          }
        });
      });
    }

    // テキストメッセージをparts配列に追加（空でなければ）
    if (message) {
      newParts.push({ text: message });
    }

    // 今回の最新メッセージを全体の送信データに追加
    contents.push({
      role: 'user',
      parts: newParts
    });

    // Gemini APIを呼び出し
    const response = await model.generateContent({
      contents: contents,
      generationConfig: {
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
