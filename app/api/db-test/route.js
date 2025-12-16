import { NextResponse } from 'next/server';
import { Client } from 'pg';

// 안전한 디버그 엔드포인트: 배포된 서버가 DB에 연결되는지 확인합니다.
// 반환값은 최소한으로 유지합니다. (테이블 존재 여부와 현재 DB 유저)
export async function GET(req) {
  const connString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connString) {
    return NextResponse.json({ ok: false, error: 'Database connection string not configured' }, { status: 500 });
  }

  let client;
  try {
    client = new Client({ connectionString: connString });
    await client.connect();

    // current_user와 테이블 레코드 수를 간단히 확인
    const userRes = await client.query('SELECT current_user');
    const countRes = await client.query("SELECT COUNT(*)::int AS cnt FROM public.cards_minimal");
    await client.end();

    return NextResponse.json({
      ok: true,
      user: userRes.rows?.[0]?.current_user ?? null,
      cards_minimal_count: countRes.rows?.[0]?.cnt ?? null,
    });
  } catch (err) {
    if (client) {
      try { await client.end(); } catch (e) {}
    }
    // 에러 메시지는 진단 용도로만 반환합니다 (운영 후 삭제 권장)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function OPTIONS(req) {
  const origin = req.headers.get('origin') || '*';
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    }
  });
}
