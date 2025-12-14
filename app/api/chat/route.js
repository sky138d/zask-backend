import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// 🔥 gameData 불러오기
import { DATA_MAP, ROUTING_GUIDE } from './gameData/index'; 

// 1. CORS 설정
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// 2. 실제 채팅 로직
export async function POST(request) {
  try {
    const body = await request.json();
    const { messages } = body;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'API Key missing' }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    // -------------------------------------------------------
    // ✨ [핵심 수정] 글로벌 프롬프트 강제 주입
    // -------------------------------------------------------
    // 유저의 마지막 메시지를 찾아서 앞에 [V25 게임 질문] 태그를 붙입니다.
    // 이렇게 하면 AI가 "삼성 18덱"을 절대 반도체로 착각하지 않습니다.
    const lastIndex = messages.length - 1;
    const originalContent = messages[lastIndex].content;
    
    // "이 질문은 컴투스프로야구V25 게임에 관한 것입니다"라고 명시
    const enhancedContent = `[컴투스프로야구V25 모바일 게임 관련 질문입니다]\n${originalContent}`;

    // 수정된 메시지 리스트 생성 (기존 대화 내역 + 수정된 마지막 질문)
    const modifiedMessages = [...messages];
    modifiedMessages[lastIndex] = { 
      ...modifiedMessages[lastIndex], 
      content: enhancedContent 
    };

    // -------------------------------------------------------
    // 🚀 1단계: AI 분류 (수정된 메시지로 판단)
    // -------------------------------------------------------
    const routerResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: ROUTING_GUIDE }, 
        ...modifiedMessages // 🔥 [수정된 질문]이 들어갑니다.
      ],
      temperature: 0,
      max_tokens: 20,
    });

    let tag = routerResponse.choices[0].message.content.trim().toUpperCase();
    
    if (!DATA_MAP[tag]) {
      console.log(`⚠️ 분류 실패(${tag}) -> GENERAL로 전환`);
      tag = 'GENERAL';
    }

    const selectedContext = DATA_MAP[tag];

    // -------------------------------------------------------
    // 🚀 2단계: 답변 생성 (수정된 메시지로 답변)
    // -------------------------------------------------------
    const systemMessage = {
      role: 'system',
      content: `당신은 'ZASK' 서비스의 **[${selectedContext.name}]** AI입니다.
      
      사용자의 질문은 **'컴투스프로야구V25'** 모바일 야구 게임에 관한 것입니다.
      절대 반도체, 노래 가사 등 다른 분야로 착각하지 마세요.
      
      반드시 아래 **[핵심 데이터]**를 최우선으로 참고하여 답변하세요.
      데이터에 있는 내용은 정확하게 전달하고, 없는 내용은 지어내지 말고 모른다고 하세요.
      
      ---
      [핵심 데이터]
      ${selectedContext.data}
      ---
      
      말투: 친절하고 전문적인 야구 코치처럼.`
    };

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [systemMessage, ...modifiedMessages], // 🔥 여기도 [수정된 질문] 사용
      temperature: 0.3,
      max_tokens: 1500,
    });

    const reply = completion.choices[0].message.content;

    return NextResponse.json({ reply }, { 
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });

  } catch (error) {
    console.error('서버 에러:', error);
    return NextResponse.json({ error: error.message }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  }
}