import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// 🔥 [핵심 1] 데이터 파일 불러오기 (경로 중요!)
// route.js와 같은 폴더 안에 gameData 폴더가 있어야 합니다.
import { DATA_MAP, ROUTING_GUIDE } from './gameData/index.js'; 

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

export async function POST(request) {
  try {
    const body = await request.json();
    const { messages } = body;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'API Key missing' }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const userQuestion = messages[messages.length - 1].content;

    // -------------------------------------------------------
    // 🚀 2단계: AI 라우터 (질문 분류하기)
    // -------------------------------------------------------
    // 유저의 질문이 "팀 가이드"인지 "스킬"인지 분류합니다.
    const routerResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: ROUTING_GUIDE }, // gameData에서 가져온 분류 기준
        { role: 'user', content: userQuestion }
      ],
      temperature: 0,
      max_tokens: 10,
    });

    let tag = routerResponse.choices[0].message.content.trim().toUpperCase();
    
    // 혹시 분류 못하면 기본값(GENERAL)으로 설정
    if (!DATA_MAP[tag]) {
      console.log(`⚠️ 분류 실패(${tag}) -> GENERAL로 전환`);
      tag = 'GENERAL';
    }

    const selectedContext = DATA_MAP[tag];

    // -------------------------------------------------------
    // 🚀 3단계: 데이터 주입하여 답변 생성 (제일 중요!)
    // -------------------------------------------------------
    const systemMessage = {
      role: 'system',
      content: `당신은 'ZASK' 서비스의 **[${selectedContext.name}]** AI입니다.
      
      반드시 아래 **[핵심 데이터]**를 최우선으로 참고하여 답변하세요.
      데이터에 있는 내용은 정확하게 전달하고, 없는 내용은 지어내지 마세요.
      
      ---
      [핵심 데이터]
      ${selectedContext.data}
      ---
      
      말투: 친절하고 전문적인 야구 코치처럼.`
    };

    // AI에게 "시스템 메시지(데이터) + 유저 대화 내역"을 같이 보냅니다.
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [systemMessage, ...messages], // 🔥 여기에 데이터가 들어갑니다!
      temperature: 0.3,
      max_tokens: 1500,
    });

    const reply = completion.choices[0].message.content;

    return NextResponse.json({ reply }, { 
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*' } 
    });

  } catch (error) {
    console.error('서버 오류:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}