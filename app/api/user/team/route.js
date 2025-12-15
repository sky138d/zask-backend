import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '../../../../lib/prisma';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json();
    const { totalSetDeckScore, totalOvr, players } = body;

    // 1. MyTeam upsert
    const existing = await prisma.myTeam.findUnique({ 
      where: { userId: session.user.id },
      include: { players: true }
    });

    let myTeam;
    if (existing) {
      myTeam = await prisma.myTeam.update({
        where: { userId: session.user.id },
        data: {
          totalSetDeckScore: totalSetDeckScore ?? existing.totalSetDeckScore,
          totalOvr: totalOvr ?? existing.totalOvr,
        },
      });
    } else {
      myTeam = await prisma.myTeam.create({
        data: {
          userId: session.user.id,
          totalSetDeckScore: totalSetDeckScore ?? 0,
          totalOvr: totalOvr ?? null,
        },
      });
    }

    // 2. 선수 데이터 저장 (기존 선수 삭제 후 새로 추가)
    if (players && Array.isArray(players)) {
      // 기존 선수 삭제
      await prisma.player.deleteMany({
        where: { myTeamId: myTeam.id }
      });

      // 새 선수 추가 (빈 데이터는 제외)
      const validPlayers = players.filter(p => p.position && p.name);
      if (validPlayers.length > 0) {
        await prisma.player.createMany({
          data: validPlayers.map(p => ({
            myTeamId: myTeam.id,
            position: p.position,
            name: p.name || '',
            cardType: p.cardType || '',
            year: p.year || '',
            upgradeLevel: p.upgradeLevel || 0,
            trainingLevel: p.trainingLevel || 0,
            awakeningLevel: p.awakeningLevel || 0,
            skill1: p.skill1 || null,
            skill2: p.skill2 || null,
            skill3: p.skill3 || null,
            potential1: p.potential1 || null,
            potential2: p.potential2 || null,
            potential3: p.potential3 || null,
            playerSetDeckScore: p.playerSetDeckScore || null,
          }))
        });
      }
    }

    // 3. 저장된 팀 데이터 반환 (선수 포함)
    const updatedTeam = await prisma.myTeam.findUnique({
      where: { userId: session.user.id },
      include: { players: true }
    });

    return NextResponse.json({ team: updatedTeam });
  } catch (err) {
    console.error('team save error', err);
    return NextResponse.json({ error: 'Server error', details: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const team = await prisma.myTeam.findUnique({ 
      where: { userId: session.user.id },
      include: { players: true }
    });
    return NextResponse.json({ team });
  } catch (err) {
    console.error('team fetch error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
