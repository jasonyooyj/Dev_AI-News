# AI News Dashboard - Product Roadmap

> CEO 관점의 제품 분석을 바탕으로 작성된 우선순위별 개선 로드맵
>
> 최종 업데이트: 2025-12-30

---

## 📊 현재 상태 요약

| 항목 | 상태 |
|------|------|
| 버전 | 0.5.0 |
| 단계 | MVP 완료 + 소셜 연동 완료 |
| 수익화 | ❌ 없음 |
| 소셜 연동 | ✅ Bluesky, ✅ Threads, ✅ LinkedIn, ✅ Instagram |
| 타겟 유저 | AI 뉴스 큐레이터/인플루언서 |
| 경쟁력 | 뉴스 → SNS 자동화 파이프라인 |

---

## 🎯 P0: 핵심 비즈니스 (Must Have)

### 1. 소셜미디어 API 직접 연동

**목표**: 생성된 콘텐츠를 원클릭으로 실제 플랫폼에 게시

#### 💰 API 비용 분석 (2025년 12월 기준)

| 플랫폼 | 비용 | Rate Limit | 권장 |
|--------|------|------------|------|
| **Twitter/X** | $100+/월 (15K tweets) | 제한적 | ❌ 제외 |
| **Bluesky** | **무료** | 제한 없음 | ✅ 1순위 |
| **Threads** | **무료** | 250 posts/day | ✅ 2순위 |
| **LinkedIn** | **무료** (기본) | ~100 req/day | ✅ 3순위 |
| **Instagram** | **무료** (Business) | 25 posts/day | ✅ 4순위 |

> **전략**: Twitter/X는 API 비용이 너무 높아 제외하고, 무료 대안인 Bluesky를 1순위로 추가.
> Bluesky는 28M+ 사용자, 완전 무료 API, 등록 불필요로 최적의 선택.

#### TODO:

- [x] **Bluesky API 연동** ⭐ 1순위 (완전 무료) ✅ 완료
  - [x] AT Protocol 이해 및 SDK 설치 (`@atproto/api`)
  - [x] App Password 기반 인증 구현 (OAuth 불필요)
  - [x] `lib/social/bluesky.ts` 생성 - API 클라이언트
  - [x] 포스트 게시 API 구현 (`POST /api/social/bluesky/post`)
  - [x] 사용자별 Bluesky 계정 연결 UI (`/settings/connections`)
  - [x] App Password 안전하게 저장 (Firestore + 암호화)
  - [x] 게시 결과 저장 (post URI, URL)
  - [x] 리치 텍스트 (멘션, 링크, 해시태그) 지원
  - [x] 참고: https://docs.bsky.app/

- [x] **Threads API 연동** ⭐ 2순위 (완전 무료) ✅ 완료
  - [x] Meta Developer 앱 등록
  - [x] Threads API 액세스 활성화 (2024년 6월 전체 공개됨)
  - [x] OAuth 2.0 인증 플로우 구현
  - [x] `lib/social/threads.ts` 생성
  - [x] 포스트 게시 API 구현 (`POST /api/social/threads/post`)
  - [x] 미디어 컨테이너 생성 및 게시 2단계 프로세스
  - [x] 텍스트 게시 지원 (이미지/비디오는 추후 확장 가능)
  - [x] 참고: 275M+ 사용자, 2025년 7월 대규모 API 업데이트

- [x] **LinkedIn API 연동** ⭐ 3순위 (무료 기본 기능) ✅ 완료
  - [x] LinkedIn Developer 앱 등록
  - [x] OAuth 2.0 인증 플로우 구현
  - [x] `lib/social/linkedin.ts` 생성
  - [x] 포스트 게시 API 구현 (`POST /api/social/linkedin/post`)
  - [x] 개인 프로필 게시 (회사 페이지는 Community Management API 필요)
  - [x] 링크 첨부 기능 (Article content)
  - [x] 참고: 토큰 60일 유효, 3,000자 제한

- [x] **Instagram Graph API 연동** ⭐ 4순위 (무료, Business 계정) ✅ 완료
  - [x] Instagram Business Login 연동 (Graph API)
  - [x] OAuth 2.0 인증 플로우 구현
  - [x] `lib/social/instagram.ts` 생성
  - [x] 포스트 게시 API 구현 (`POST /api/social/instagram/post`)
  - [x] 2단계 컨테이너 프로세스 (create container → publish)
  - [x] 비즈니스/크리에이터 계정 전용 (개인 계정 미지원)
  - [x] 이미지 필수 → 게시 시 이미지 URL 입력 필요
  - [x] Rate limit: 25 posts/day, 200 req/hour
  - [x] 참고: 60일 토큰 유효, 2,200자 캡션 제한

- [x] ~~**Twitter/X API 연동**~~ ❌ 비용 문제로 제외
  - 기본 API: $100/월 (15,000 tweets)
  - Pro API: $5,000/월 (1M tweets)
  - Enterprise: $42,000+/월
  - 대안: Bluesky로 대체 (유사 기능, 무료)

- [x] **통합 게시 UI** ✅ 완료 (Bluesky, Threads, LinkedIn, Instagram)
  - [x] `components/social/BlueskyPublishButton.tsx` - Bluesky 게시 버튼
  - [x] `components/social/BlueskyConnectModal.tsx` - Bluesky 연결 모달
  - [x] `components/social/ThreadsPublishButton.tsx` - Threads 게시 버튼
  - [x] `components/social/ThreadsConnectModal.tsx` - Threads 연결 모달
  - [x] `components/social/LinkedInPublishButton.tsx` - LinkedIn 게시 버튼
  - [x] `components/social/LinkedInConnectModal.tsx` - LinkedIn 연결 모달
  - [x] `components/social/InstagramPublishButton.tsx` - Instagram 게시 버튼
  - [x] `components/social/InstagramConnectModal.tsx` - Instagram 연결 모달
  - [x] `components/social/SocialConnectionCard.tsx` - 연결 상태 표시
  - [x] 게시 상태 표시 (pending, published, failed)
  - [x] 게시 이력 저장 (`users/{userId}/publishHistory`)
  - [ ] 멀티 플랫폼 동시 게시 옵션

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
  - [ ] Bluesky 성과 추적 (좋아요, 리포스트, 조회수) - 무료 API
  - [ ] Threads Insights API 연동 (조회수, 좋아요, 답글) - 무료
  - [ ] LinkedIn Analytics 연동 (조회수, 반응, 댓글) - 무료
  - [ ] Instagram Insights 연동 (Business 계정) - 무료
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

- [ ] **Bluesky 통합** (무료 API)
  - [ ] 특정 계정 포스트 수집 (예: AI 연구자, 기업 계정)
  - [ ] AI 관련 해시태그 모니터링
  - [ ] 트렌딩 토픽 감지
  - [ ] AT Protocol 기반 피드 구독

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
  - [ ] 긴 콘텐츠 → Bluesky/Threads 스레드 자동 분할
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
| **Phase 1** | - | PMF 검증 | ✅ Bluesky+Threads+LinkedIn+Instagram 연동, Freemium, 스케줄링 |
| **Phase 2** | - | 성장 | 분석 대시보드, 콘텐츠 스케줄링, 소스 확장 |
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
