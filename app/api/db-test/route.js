import { NextResponse } from 'next/server';
import { Client } from 'pg';

// 안전한 디버그 엔드포인트: 배포된 서버가 DB에 연결되는지 확인합니다.
// 반환값은 최소한으로 유지합니다. (테이블 존재 여부와 현재 DB 유저)
export async function GET(req) {
  const connString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connString) {
    return NextResponse.json({ ok: false, error: 'Database connection string not configured' }, { status: 500 });
  }
  // Parse and sanitize connection info for debugging without revealing password
  let sanitized = {};
  try {
    const u = new URL(connString);
    sanitized = {
      protocol: u.protocol.replace(':',''),
      user: u.username || null,
      host: u.hostname || null,
      port: u.port || null,
      database: (u.pathname || '').replace(/\//g, '') || null,
    };
  } catch (e) {
    sanitized = { raw: connString.substring(0, 80) };
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
      connection: sanitized,
      user: userRes.rows?.[0]?.current_user ?? null,
      cards_minimal_count: countRes.rows?.[0]?.cnt ?? null,
    });
  } catch (err) {
    if (client) {
      try { await client.end(); } catch (e) {}
    }
    // Return sanitized connection info along with error for diagnosis
    return NextResponse.json({ ok: false, error: err.message, connection: sanitized }, { status: 500 });
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
