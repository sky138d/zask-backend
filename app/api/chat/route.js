import { NextResponse } from 'next/server';

// ✅ 1. CORS 설정을 위한 공통 헤더 함수
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*', // 모든 도메인 허용
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version',
  };
}

// ✅ 2. OPTIONS 요청 처리 (Preflight - 브라우저가 먼저 찔러보는 것)
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

// ✅ 3. POST 요청 처리 (실제 채팅)
export async function POST(request) {
  try {
    // 본문 데이터 가져오기 (req.body 대신 request.json() 사용)
    const body = await request.json();
    const { messages } = body;

    // API 키 확인
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API Key is missing.' },
        { status: 500, headers: corsHeaders() }
      );
    }

    // OpenAI API 호출 (fetch 사용)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages || [{ role: 'user', content: 'Hello' }],
        max_tokens: 1000,
      }),
    });

    // OpenAI 에러 처리
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error?.message || 'OpenAI Error' },
        { status: response.status, headers: corsHeaders() }
      );
    }

    // 성공 데이터 반환
    const data = await response.json();
    const reply = data.choices[0].message.content;

    return NextResponse.json({ reply }, { status: 200, headers: corsHeaders() });

  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500, headers: corsHeaders() }
    );
  }
}