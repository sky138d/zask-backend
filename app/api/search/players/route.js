import { NextResponse } from 'next/server';
import { Client } from 'pg';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    const limit = parseInt(searchParams.get('limit') || '30', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const offsetParam = searchParams.get('offset');
    const offset = offsetParam ? parseInt(offsetParam, 10) : Math.max(0, (page - 1) * limit);

    if (!process.env.POSTGRES_URL_NON_POOLING && !process.env.POSTGRES_URL) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    if (!q) return NextResponse.json({ results: [] });

    const connString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
    const client = new Client({ connectionString: connString });
    await client.connect();

    // Use similarity ordering from pg_trgm
    const sql = `
      SELECT name, type, subtype, team, year, position, ovr
      FROM cards_minimal
      WHERE name ILIKE $1
      ORDER BY similarity(name, $2) DESC
      LIMIT $3 OFFSET $4
    `;
    const qParam = `%${q}%`;
    const res = await client.query(sql, [qParam, q, limit, offset]);
    await client.end();
    return NextResponse.json({ results: res.rows }, { 
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true'
      } 
    });
  } catch (err) {
    console.error('search players error', err);
    return NextResponse.json({ error: 'Server error', details: err.message }, { 
      status: 500, 
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true'
      } 
    });
  }
}

export async function OPTIONS() {
  // respond to preflight
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
      'Access-Control-Allow-Credentials': 'true'
    }
  });
}
