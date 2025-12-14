import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// 🔥 [핵심 수정] 유저님이 만든 데이터를 여기서 불러옵니다.
// route.js와 gameData 폴더가 같은 위치에 있으므로 './gameData/index'가 맞습니다.
import { DATA_MAP, ROUTING_GUIDE } from './gameData/index'; 

// 1. CORS 설정 (모든 요청 허용 - 빨간 에러 방지)
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
    
    // 유저의 마지막 질문 추출
    const userQuestion = messages[messages.length - 1].content;

    // -------------------------------------------------------
    // 🚀 1단계: AI 분류 (이 질문이 덱 상담인지, 스킬 질문인지 파악)
    // -------------------------------------------------------
    const routerResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: ROUTING_GUIDE }, // index.js에서 가져온 분류 가이드
        { role: 'user', content: userQuestion }
      ],
      temperature: 0,
      max_tokens: 20, // 태그만 딱 뱉게 짧게 설정
    });

    // AI가 판단한 태그 (예: "TEAM_LINEUP" or "SKILL")
    let tag = routerResponse.choices[0].message.content.trim().toUpperCase();
    
    // 만약 이상한 태그가 나오면 안전하게 기본값(GENERAL)으로 처리
    if (!DATA_MAP[tag]) {
      console.log(`⚠️ 분류 실패(${tag}) -> GENERAL로 전환`);
      tag = 'GENERAL';
    }

    // 선택된 데이터 가져오기 (예: 삼성 덱 정보 등)
    const selectedContext = DATA_MAP[tag];

    // -------------------------------------------------------
    // 🚀 2단계: 데이터 주입하여 진짜 답변 만들기 (제일 중요!)
    // -------------------------------------------------------
    const systemMessage = {
      role: 'system',
      content: `당신은 'ZASK' 서비스의 **[${selectedContext.name}]** AI입니다.
      
      반드시 아래 **[핵심 데이터]**를 최우선으로 참고하여 답변하세요.
      데이터에 있는 내용은 정확하게 전달하고, 없는 내용은 지어내지 말고 모른다고 하세요.
      
      ---
      [핵심 데이터]
      ${selectedContext.data}
      ---
      
      말투: 친절하고 전문적인 야구 코치처럼.`
    };

    // AI에게 "데이터(systemMessage) + 유저 질문"을 같이 보냅니다.
    // 이렇게 해야 AI가 "아, 18덱은 반도체가 아니라 야구덱이구나" 하고 알게 됩니다.
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [systemMessage, ...messages], 
      temperature: 0.3, // 데이터를 정확히 읽기 위해 창의성 낮춤
      max_tokens: 1500,
    });

    const reply = completion.choices[0].message.content;

    return NextResponse.json({ reply }, { 
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*' } 
    });

  } catch (error) {
    console.error('서버 에러:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}