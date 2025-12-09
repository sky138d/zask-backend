// pages/api/chat.js
import OpenAI from 'openai';

// 1. OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 2. 허용할 오리진 (프론트엔드 주소)
const ALLOWED_ORIGINS = [
  'https://zask.kr',
  'https://www.zask.kr',
  'http://localhost:5173', // 로컬 테스트용
];

export default async function handler(req, res) {
  // --- CORS 설정 (Preflight 처리) ---
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  // OPTIONS 요청(Preflight)이면 200 OK 반환 후 종료
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;

    // 3. 메시지 유효성 검사
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages are required' });
    }

    // 4. 시스템 프롬프트 설정 (ZASK의 페르소나)
    const systemMessage = {
      role: 'system',
      content: `당신은 'ZASK(Just ASK)'라는 이름의 AI 게임 도우미입니다. 
      주로 '컴투스 프로야구 V25'와 관련된 질문에 답변하지만, 일상적인 대화도 가능합니다.
      말투는 친절하고 전문적이며, 간결하게 핵심을 답변하세요.
      항상 한국어로 답변하세요.`
    };

    // 5. OpenAI API 호출 (gpt-5-mini 사용)
    const completion = await openai.chat.completions.create({
      model: 'gpt-5-mini', // 요청하신 모델 ID (실제 사용시 gpt-4o-mini 등을 추천)
      messages: [systemMessage, ...messages],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const reply = completion.choices[0].message.content;

    // 6. 결과 반환
    return res.status(200).json({ reply });

  } catch (error) {
    console.error('OpenAI Error:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      details: error.message 
    });
  }
}