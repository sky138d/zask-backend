import { NextResponse } from 'next/server';

// [진단 1] helper 함수 제거하고 직관적으로 작성
export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version',
    },
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { messages } = body;

    // [진단 2] 서버 로그 강제 출력 (Vercel Logs에서 확인용)
    console.log("✅ API 요청 도착함!");
    console.log("🔑 API KEY 상태:", process.env.OPENAI_API_KEY ? "존재함 (앞자리: " + process.env.OPENAI_API_KEY.substring(0, 3) + ")" : "❌ 없음");

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API Key missing' }, { status: 500 });
    }

    // [진단 3] 백틱(`) 대신 문자열 합치기(+) 사용 -> 오타 가능성 0%
    const authHeader = 'Bearer ' + process.env.OPENAI_API_KEY;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader, // 수정된 헤더 사용
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages || [{ role: 'user', content: 'Hello' }],
        max_tokens: 1000,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("🔥 OpenAI 에러:", data); // 에러 로그 출력
      return NextResponse.json(
        { error: data.error?.message || 'OpenAI Error' },
        { 
          status: response.status,
          headers: { 'Access-Control-Allow-Origin': '*' } // 에러 날 때도 CORS 허용
        }
      );
    }

    const reply = data.choices[0].message.content;

    return NextResponse.json(
      { reply }, 
      { 
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' } // 성공 시 CORS 허용
      }
    );

  } catch (error) {
    console.error('💥 서버 내부 오류:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { 
        status: 500, 
        headers: { 'Access-Control-Allow-Origin': '*' } // 서버 터져도 CORS 허용
      }
    );
  }
}