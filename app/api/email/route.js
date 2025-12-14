import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// 1. CORS 설정 (프론트엔드에서 요청 허용)
export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// 2. 이메일 발송 로직
export async function POST(request) {
  try {
    const { type, message } = await request.json(); // 프론트에서 보낸 '좋아요/싫어요', '대화내용'

    // 유저님의 이메일 설정 (지메일 예시)
    // 실제 사용 시엔 환경변수(process.env)로 빼는 게 좋습니다.
    const transporter = nodemailer.createTransport({
      service: 'gmail', // 혹은 사용하는 메일 서비스 (naver 등)
      auth: {
        user: process.env.EMAIL_USER, // 보내는 사람 이메일 (본인 지메일 등)
        pass: process.env.EMAIL_PASS, // 이메일 앱 비밀번호 (구글 계정 설정에서 발급)
      },
    });

    // 이메일 내용 구성
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'sky138@zask.kr', // 🚀 받는 사람: 유저님 이메일
      subject: `[ZASK 피드백] 유저가 '${type}'를 눌렀습니다.`,
      text: `
      [피드백 타입]: ${type} (좋아요/싫어요)
      
      [대화 내용]:
      ${message}
      `,
    };

    // 전송!
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true }, { 
      status: 200, 
      headers: { 'Access-Control-Allow-Origin': '*' } 
    });

  } catch (error) {
    console.error('이메일 전송 실패:', error);
    return NextResponse.json({ error: 'Email failed' }, { status: 500 });
  }
}