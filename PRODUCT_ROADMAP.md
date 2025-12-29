# AI News Dashboard - Product Roadmap

> CEO 관점의 제품 분석을 바탕으로 작성된 우선순위별 개선 로드맵
>
> 최종 업데이트: 2024-12-29

---

## 📊 현재 상태 요약

| 항목 | 상태 |
|------|------|
| 버전 | 0.4.0 |
| 단계 | MVP 완료 |
| 수익화 | ❌ 없음 |
| 타겟 유저 | 불명확 |
| 경쟁력 | 기술적 기반만 존재 |

---

## 🎯 P0: 핵심 비즈니스 (Must Have)

### 1. 소셜미디어 API 직접 연동

**목표**: 생성된 콘텐츠를 원클릭으로 실제 플랫폼에 게시

#### TODO:

- [ ] **Twitter/X API 연동**
  - [ ] Twitter Developer Portal 앱 등록
  - [ ] OAuth 2.0 PKCE 인증 플로우 구현
  - [ ] `lib/social/twitter.ts` 생성 - API 클라이언트
  - [ ] 트윗 게시 API 구현 (`POST /api/social/twitter/post`)
  - [ ] 사용자별 Twitter 계정 연결 UI (`/settings/connections`)
  - [ ] 연결된 계정 토큰 안전하게 저장 (Firestore + 암호화)
  - [ ] 트윗 게시 결과 저장 (tweet ID, URL)
  - [ ] Rate limit 핸들링 및 에러 처리

- [ ] **LinkedIn API 연동**
  - [ ] LinkedIn Developer 앱 등록
  - [ ] OAuth 2.0 인증 플로우 구현
  - [ ] `lib/social/linkedin.ts` 생성
  - [ ] 포스트 게시 API 구현 (`POST /api/social/linkedin/post`)
  - [ ] 회사 페이지 vs 개인 프로필 선택 옵션
  - [ ] 이미지 첨부 기능 (OpenGraph 이미지 자동 추출)

- [ ] **Threads API 연동** (Meta)
  - [ ] Threads API 베타 액세스 신청
  - [ ] Instagram Business 계정 연동 플로우
  - [ ] 게시 API 구현

- [ ] **Instagram API 연동**
  - [ ] Facebook Developer 앱 설정
  - [ ] Instagram Graph API 연동
  - [ ] 비즈니스/크리에이터 계정 전용 (개인 계정 제한)
  - [ ] 이미지 필수 → AI 이미지 생성 또는 템플릿 제공

- [ ] **통합 게시 UI**
  - [ ] `components/social/PublishButton.tsx` - 플랫폼별 게시 버튼
  - [ ] `components/social/PublishModal.tsx` - 게시 확인 모달
  - [ ] 게시 상태 표시 (pending, published, failed)
  - [ ] 게시 이력 저장 (`users/{userId}/publishHistory`)

---

### 2. 수익화 모델 (Freemium)

**목표**: 지속 가능한 비즈니스 모델 구축

#### TODO:

- [ ] **플랜 설계**
  - [ ] Free 플랜: 월 50개 AI 생성, 소스 5개, 소셜 연동 1개
  - [ ] Pro 플랜 ($9.99/월): 무제한 AI 생성, 소스 20개, 소셜 연동 전체, 스케줄링
  - [ ] Team 플랜 ($29.99/월): Pro + 팀 5명, 워크스페이스, 승인 워크플로우
  - [ ] Enterprise: 커스텀 가격, SSO, API 액세스

- [ ] **결제 시스템 (Stripe)**
  - [ ] Stripe 계정 설정 및 Product/Price 생성
  - [ ] `lib/stripe/` 디렉토리 생성
  - [ ] Stripe Checkout 세션 생성 API (`POST /api/stripe/checkout`)
  - [ ] Webhook 핸들러 (`POST /api/stripe/webhook`)
    - [ ] `checkout.session.completed` → 플랜 활성화
    - [ ] `invoice.payment_failed` → 플랜 일시정지
    - [ ] `customer.subscription.deleted` → 플랜 취소
  - [ ] Customer Portal 연동 (구독 관리)

- [ ] **사용량 추적**
  - [ ] `users/{userId}/usage` 컬렉션 생성
  - [ ] AI 생성 횟수 카운팅 미들웨어
  - [ ] 소스 개수 제한 체크
  - [ ] 월별 사용량 리셋 (cron job 또는 Cloud Functions)

- [ ] **플랜 UI**
  - [ ] `/pricing` 페이지 생성
  - [ ] `components/billing/PlanCard.tsx`
  - [ ] `components/billing/UsageBar.tsx` - 사용량 표시
  - [ ] `/settings/billing` 페이지 - 구독 관리
  - [ ] 업그레이드 유도 모달 (제한 도달 시)

- [ ] **Firestore 스키마 확장**
  ```typescript
  interface UserProfile {
    plan: 'free' | 'pro' | 'team' | 'enterprise';
    stripeCustomerId?: string;
    subscriptionId?: string;
    subscriptionStatus: 'active' | 'past_due' | 'canceled';
    currentPeriodEnd: string;
    usage: {
      aiGenerations: number;
      lastResetAt: string;
    };
  }
  ```

---

## 🎯 P1: 핵심 기능 강화

### 3. 콘텐츠 스케줄링

**목표**: 최적 시간에 자동 게시

#### TODO:

- [ ] **스케줄링 인프라**
  - [ ] `users/{userId}/scheduledPosts` 컬렉션
  - [ ] Cloud Functions 또는 Vercel Cron 설정
  - [ ] 스케줄 확인 및 게시 실행 (1분 간격)
  - [ ] 타임존 처리 (사용자별 타임존 설정)

- [ ] **스케줄링 UI**
  - [ ] `components/schedule/DateTimePicker.tsx`
  - [ ] `components/schedule/ScheduleModal.tsx`
  - [ ] 생성된 콘텐츠에 "Schedule" 버튼 추가
  - [ ] 드래그앤드롭 날짜 변경

- [ ] **콘텐츠 캘린더**
  - [ ] `/calendar` 페이지 생성
  - [ ] 월간/주간 뷰 (react-big-calendar 또는 커스텀)
  - [ ] 플랫폼별 색상 코딩
  - [ ] 예약된 포스트 미리보기
  - [ ] 빈 슬롯에 빠른 추가

- [ ] **최적 시간 추천** (Pro 이상)
  - [ ] 플랫폼별 일반적인 최적 시간 데이터
  - [ ] 사용자 게시 성과 기반 학습 (Phase 2)

---

### 4. 성과 분석 대시보드

**목표**: 데이터 기반 콘텐츠 전략 수립

#### TODO:

- [ ] **게시 성과 추적**
  - [ ] Twitter Analytics API 연동 (좋아요, RT, 조회수)
  - [ ] LinkedIn Analytics 연동 (조회수, 반응, 댓글)
  - [ ] `users/{userId}/analytics` 컬렉션
  - [ ] 일별/주별/월별 집계

- [ ] **대시보드 UI**
  - [ ] `/analytics` 페이지 생성
  - [ ] `components/analytics/EngagementChart.tsx` (Recharts)
  - [ ] `components/analytics/TopPostsTable.tsx`
  - [ ] `components/analytics/PlatformComparison.tsx`
  - [ ] 기간 선택기 (7일, 30일, 90일)

- [ ] **인사이트 카드**
  - [ ] 최고 성과 포스트
  - [ ] 최적 게시 시간 분석
  - [ ] 플랫폼별 성과 비교
  - [ ] 성장 트렌드 (전주 대비)

- [ ] **리포트 내보내기** (Pro 이상)
  - [ ] PDF 리포트 생성
  - [ ] CSV 데이터 다운로드
  - [ ] 이메일 리포트 스케줄링

---

## 🎯 P2: 확장성

### 5. 팀/워크스페이스

**목표**: B2B 시장 진입

#### TODO:

- [ ] **워크스페이스 구조**
  - [ ] `workspaces/{workspaceId}` 컬렉션
  - [ ] 워크스페이스 멤버 관리
  - [ ] 역할: Owner, Admin, Editor, Viewer
  - [ ] 초대 시스템 (이메일 초대)

- [ ] **권한 시스템**
  - [ ] Firestore Security Rules 확장
  - [ ] 역할별 기능 접근 제어
  - [ ] 콘텐츠 소유권 (개인 vs 워크스페이스)

- [ ] **승인 워크플로우** (Team 이상)
  - [ ] 콘텐츠 상태: draft → pending_review → approved → published
  - [ ] 승인자 지정
  - [ ] 코멘트/피드백 스레드
  - [ ] 알림 (이메일, 인앱)

- [ ] **워크스페이스 UI**
  - [ ] `/workspace/settings` 페이지
  - [ ] 멤버 관리 UI
  - [ ] 워크스페이스 전환 드롭다운

---

### 6. 뉴스 소스 확장

**목표**: 실시간성 및 커버리지 향상

#### TODO:

- [ ] **Twitter/X 통합**
  - [ ] 특정 계정 트윗 수집 (예: @sama, @ylecun)
  - [ ] AI 관련 해시태그 모니터링
  - [ ] 트렌딩 토픽 감지

- [ ] **Reddit 통합**
  - [ ] r/MachineLearning, r/artificial 등 구독
  - [ ] 인기 포스트 필터링 (upvote 기준)
  - [ ] Reddit API OAuth 연동

- [ ] **Hacker News 통합**
  - [ ] Algolia HN API 연동
  - [ ] AI 관련 포스트 필터링
  - [ ] 포인트/댓글 수 기반 중요도 판단

- [ ] **YouTube 통합**
  - [ ] AI 채널 구독 (Two Minute Papers, Yannic Kilcher 등)
  - [ ] 새 영상 알림
  - [ ] 영상 요약 (transcript 기반)

- [ ] **주류 테크 미디어**
  - [ ] TechCrunch AI 카테고리 RSS
  - [ ] The Verge AI RSS
  - [ ] Wired AI RSS
  - [ ] MIT Technology Review

- [ ] **학술 소스**
  - [ ] arXiv cs.AI, cs.LG 새 논문
  - [ ] Papers With Code 트렌딩
  - [ ] Semantic Scholar API

---

## 🎯 P3: 사용자 경험

### 7. 모바일 앱/PWA

**목표**: 이동 중 접근성

#### TODO:

- [ ] **PWA 설정**
  - [ ] `manifest.json` 생성
  - [ ] Service Worker 설정
  - [ ] 오프라인 캐싱 전략
  - [ ] Add to Home Screen 프롬프트

- [ ] **푸시 알림**
  - [ ] Firebase Cloud Messaging 설정
  - [ ] 알림 권한 요청 UI
  - [ ] 알림 설정 페이지
  - [ ] 알림 유형:
    - [ ] 중요 뉴스 속보
    - [ ] 예약 게시 완료
    - [ ] 팀 멘션/승인 요청

- [ ] **모바일 UI 최적화**
  - [ ] 터치 제스처 (스와이프 액션)
  - [ ] 하단 네비게이션 바
  - [ ] 풀투리프레시
  - [ ] 모바일 전용 레이아웃

- [ ] **네이티브 앱** (장기)
  - [ ] React Native 또는 Expo
  - [ ] iOS/Android 스토어 배포

---

### 8. AI 기능 강화

**목표**: 차별화된 AI 경험

#### TODO:

- [ ] **멀티 모델 지원**
  - [ ] OpenAI GPT-4 옵션
  - [ ] Claude 옵션
  - [ ] 모델 비교 기능
  - [ ] 사용자별 선호 모델 설정

- [ ] **고급 스타일 학습**
  - [ ] 사용자 기존 포스트 분석
  - [ ] 플랫폼별 성과 기반 스타일 추천
  - [ ] A/B 테스트 콘텐츠 생성

- [ ] **이미지 생성**
  - [ ] DALL-E 또는 Stable Diffusion 연동
  - [ ] 뉴스 기반 자동 이미지 생성
  - [ ] 플랫폼별 이미지 크기 최적화

- [ ] **스레드/연재 생성**
  - [ ] 긴 콘텐츠 → 트위터 스레드 자동 분할
  - [ ] 연재물 계획 (Part 1, 2, 3...)
  - [ ] 연결 문구 자동 생성

---

### 9. 검색 및 필터 강화

**목표**: 대량 데이터에서 빠른 탐색

#### TODO:

- [ ] **고급 필터**
  - [ ] 날짜 범위 선택기
  - [ ] 카테고리 다중 선택
  - [ ] 소스 다중 선택
  - [ ] 키워드 제외 필터

- [ ] **저장된 검색**
  - [ ] 필터 조합 저장
  - [ ] 빠른 액세스 사이드바
  - [ ] 저장된 검색 알림 설정

- [ ] **전문 검색** (Algolia 또는 Elasticsearch)
  - [ ] 본문 전체 검색
  - [ ] 오타 허용 (fuzzy search)
  - [ ] 검색어 하이라이팅

---

## 📅 마일스톤 제안

| Phase | 기간 | 목표 | 주요 기능 |
|-------|------|------|----------|
| **Phase 1** | - | PMF 검증 | Twitter 연동, Freemium, 스케줄링 |
| **Phase 2** | - | 성장 | 전체 소셜 연동, 분석, 소스 확장 |
| **Phase 3** | - | 확장 | 팀 기능, 모바일, 고급 AI |
| **Phase 4** | - | 최적화 | 성능, UX 개선, 엔터프라이즈 |

---

## 📝 기술 부채 (병행 처리)

- [ ] E2E 테스트 커버리지 확대
- [ ] 에러 모니터링 (Sentry) 설정
- [ ] 성능 모니터링 (Vercel Analytics)
- [ ] API Rate Limiting
- [ ] 보안 감사 (OWASP 체크리스트)
- [ ] 접근성 (a11y) 개선
- [ ] 국제화 (i18n) 준비
- [ ] 문서화 (API docs, 사용자 가이드)

---

## 🏁 성공 지표 (KPIs)

| 지표 | 현재 | Phase 1 목표 | Phase 2 목표 |
|------|------|-------------|-------------|
| MAU | 0 | 1,000 | 10,000 |
| 유료 전환율 | 0% | 5% | 10% |
| MRR | $0 | $500 | $10,000 |
| 일평균 콘텐츠 생성 | 0 | 500 | 5,000 |
| NPS | - | 30+ | 50+ |

---

*이 로드맵은 시장 상황과 사용자 피드백에 따라 지속적으로 업데이트됩니다.*
