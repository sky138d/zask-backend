import { NextResponse } from 'next/server';

// CORS 헤더 단순화
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// 1. OPTIONS (Preflight)
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// 2. POST (그냥 인사만 함)
export async function POST() {
  return NextResponse.json(
    { reply: "서버 살아있음! 연결 성공!" },
    { status: 200, headers: corsHeaders }
  );
}