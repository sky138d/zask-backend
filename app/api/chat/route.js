import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// 🔥 [핵심 수정] 알려주신 경로에 딱 맞춘 Import 경로
// route.js가 있는 폴더 안의 gameData 폴더를 찾습니다.
import { DATA_MAP, ROUTING_GUIDE } from './gameData/index'; 

// 1. CORS 설정 (모든 요청 허용)
export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// 2. 실제 채팅 로직
export async function POST(request) {
  try {
    const body = await request.json();
    const { messages } = body;

    // API 키 확인
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'API Key missing' }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const userQuestion = messages[messages.length - 1].content;

    // -------------------------------------------------------
    // 🚀 1단계: AI 분류 (어떤 데이터를 참고할지 결정)
    // -------------------------------------------------------
    const routerResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: ROUTING_GUIDE }, // gameData/index.js에서 가져온 가이드
        { role: 'user', content: userQuestion }
      ],
      temperature: 0,
      max_tokens: 10,
    });

    let tag = routerResponse.choices[0].message.content.trim().toUpperCase();
    
    // 분류 실패 시 안전장치
    if (!DATA_MAP[tag]) {
      console.log(`⚠️ 분류 태그(${tag})가 데이터에 없음 -> GENERAL로 전환`);
      tag = 'GENERAL';
    }

    const selectedContext = DATA_MAP[tag];

    // -------------------------------------------------------
    // 🚀 2단계: 최종 답변 생성 (선택된 데이터 기반)
    // -------------------------------------------------------
    const systemMessage = {
      role: 'system',
      content: `당신은 'ZASK' 서비스의 **[${selectedContext.name}]** AI입니다.
      
      아래 **[핵심 데이터]**를 반드시 참고하여 답변하세요.
      
      ---
      [핵심 데이터]
      ${selectedContext.data}
      ---
      
      말투: 친절하고 전문적인 야구 코치처럼.`
    };

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [systemMessage, ...messages],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const reply = completion.choices[0].message.content;

    return NextResponse.json({ reply }, { 
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*' } 
    });

  } catch (error) {
    console.error('서버 에러 발생:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}