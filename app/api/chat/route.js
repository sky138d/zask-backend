import { NextResponse } from 'next/server';

// 1. CORS 설정을 위한 헤더 준비
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*', 
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version',
  };
}

// 2. OPTIONS 요청 처리 (Preflight - 브라우저 접속 허가)
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

// 3. POST 요청 처리 (실제 AI 답변)
export async function POST(request) {
  try {
    // 예전 req.body 대신 request.json()을 씁니다.
    const body = await request.json();
    const { messages } = body;

    // API Key 확인
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API Key is missing.' },
        { status: 500, headers: corsHeaders() }
      );
    }

    // OpenAI API 호출
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

    const data = await response.json();

    // OpenAI 에러 처리
    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || 'OpenAI Error' },
        { status: response.status, headers: corsHeaders() }
      );
    }

    const reply = data.choices[0].message.content;

    // 성공 응답
    return NextResponse.json({ reply }, { status: 200, headers: corsHeaders() });

  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500, headers: corsHeaders() }
    );
  }
}