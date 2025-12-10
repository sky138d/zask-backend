// pages/api/chat.js
import OpenAI from 'openai';
import { DATA_MAP, ROUTING_GUIDE } from './gameData/index'; // ✨ 수정된 index.js 불러오기

// CORS 설정 (기존과 동일)
const ALLOWED_ORIGINS = [
  'https://zask.kr',
  'https://www.zask.kr',
  'http://localhost:5173',
  'https://*.github.dev',
  'https://*.app.github.dev'
];

export default async function handler(req, res) {
  // --- 1. CORS 처리 (기존과 동일) ---
  const origin = req.headers.origin;
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    if (!process.env.OPENAI_API_KEY) throw new Error('OpenAI API Key is missing.');

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const { messages } = req.body;
    const userQuestion = messages[messages.length - 1].content; // 유저의 마지막 질문

    // -------------------------------------------------------
    // 🚀 1단계: AI 라우터 (질문 분류)
    // -------------------------------------------------------
    const routerResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // 빠르고 저렴한 모델 사용
      messages: [
        { role: 'system', content: ROUTING_GUIDE }, // 분류 가이드 주입
        { role: 'user', content: userQuestion }
      ],
      temperature: 0, // 항상 일관된 분류를 위해 0으로 설정
      max_tokens: 10, // 딱 태그 단어 하나만 받을 거라 짧게
    });

    // AI가 뱉은 태그 (예: "SKILL" or "REDISTRIBUTE")
    let tag = routerResponse.choices[0].message.content.trim().toUpperCase();
    
    // 만약 이상한 답을 하면 GENERAL로 처리
    if (!DATA_MAP[tag]) {
      console.log(`⚠️ 분류 실패(${tag}) -> GENERAL로 전환`);
      tag = 'GENERAL';
    } else {
      console.log(`🎯 AI 분류 결과: [${tag}]`);
    }

    const selectedContext = DATA_MAP[tag];

    // -------------------------------------------------------
    // 🚀 2단계: 실제 답변 생성 (선택된 데이터 사용)
    // -------------------------------------------------------
    const systemMessage = {
      role: 'system',
      content: `당신은 'ZASK' 서비스의 **[${selectedContext.name}]** AI입니다.
      
      아래 **[참고 데이터]**를 최우선으로 하여 유저 질문에 답변하세요.
      
      ---
      [참고 데이터]
      ${selectedContext.data}
      ---
      
      말투: 친절하고 전문적인 코치처럼. 한국어로.`
    };

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', 
      messages: [systemMessage, ...messages],
      temperature: 0.5,
      max_tokens: 1000,
    });

    const reply = completion.choices[0].message.content;
    return res.status(200).json({ reply });

  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}

