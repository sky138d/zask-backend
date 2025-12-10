// pages/api/gameData/index.js

import { REDISTRIBUTE_DATA } from './redistribute';
import { SKILL_DATA } from './skill';
import { CARD_RECOMMEND_DATA } from './cardRecommend';
import { TEAM_LINEUP_DATA } from './teamLineup';
import { GOLDEN_GLOVE_DATA } from './goldenGlove';
import { STAT_CALC_DATA } from './statCalc';
import { STAR_FARM_DATA } from './starFarm';
import { EVENT_DATA } from './event';
import { WORKSHOP_DATA } from './workshop';

// 1. 카테고리별 데이터 매핑 (AI가 선택할 태그: 데이터)
export const DATA_MAP = {
  'REDISTRIBUTE': { name: '훈련 재분배 코치', data: REDISTRIBUTE_DATA },
  'SKILL': { name: '스킬 분석가', data: SKILL_DATA },
  'CARD_RECOMMEND': { name: '카드 추천 가이드', data: CARD_RECOMMEND_DATA },
  'TEAM_LINEUP': { name: '팀 빌딩 전문가', data: TEAM_LINEUP_DATA },
  'GOLDEN_GLOVE': { name: '골든글러브 전략가', data: `${GOLDEN_GLOVE_DATA}\n\n[참고: 팀별 종결 라인업]\n${TEAM_LINEUP_DATA}` }, // 골글은 팀 라인업도 같이 필요
  'STAT_CALC': { name: '스탯 연구원', data: STAT_CALC_DATA },
  'STAR_FARM': { name: '재화 관리 매니저', data: STAR_FARM_DATA },
  'EVENT': { name: '이벤트 가이드', data: EVENT_DATA },
  'WORKSHOP': { name: '공방 장인', data: WORKSHOP_DATA },
  'GENERAL': { 
    name: 'V25 게임 도우미', 
    data: '특별한 데이터 파일이 필요 없는 일반적인 질문입니다. V25 게임 상식으로 답변하세요.' 
  }
};

// 2. AI에게 보여줄 "분류 가이드"
export const ROUTING_GUIDE = `
너는 질문 분류기(Router)야. 사용자의 질문을 보고 아래 카테고리 중 하나를 골라서 영어 태그만 딱 출력해. (설명 금지)

[카테고리 목록]
- REDISTRIBUTE: 훈련 재분배, 스탑/이륙, 파정합, 변구합, 임팩트/시그/국대 수치 질문
- SKILL: 스킬 변경, 3메이저, 스킬 랭크, 잠재력, 고유 능력
- CARD_RECOMMEND: 선택팩 추천, 400/500 뽑기, 위시 카드
- TEAM_LINEUP: 특정 구단(기아, 삼성 등) 종결 라인업, 베스트 포지션
- GOLDEN_GLOVE: 골든글러브(골글) 영입, 조합, 누구 뽑을지
- STAT_CALC: 오버롤 계산, 스탯 공식, 구속/변화 영향
- STAR_FARM: 스타(재화) 수급, 모으는 법
- EVENT: 이벤트 공략, 미니게임 팁
- WORKSHOP: 제작소, 크리티컬, 만들기
- GENERAL: 위 내용에 없거나 단순 인사, 잡담
`;
