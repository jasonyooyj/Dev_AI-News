# Commit, Version Bump, and Push

Git 변경사항을 커밋하고, 버전을 업데이트하고, 원격 저장소에 푸시합니다.

## 작업 순서

1. **변경사항 분석**
   - `git status`로 변경된 파일 확인
   - `git diff`로 상세 변경 내용 확인
   - `git log -5 --oneline`으로 최근 커밋 스타일 확인

2. **버전 관리** (Semantic Versioning)
   - 현재 버전 확인: `my-app/package.json`의 `version` 필드
   - 버전 업데이트 규칙:
     - `patch` (0.9.2 → 0.9.3): 버그 수정, 작은 개선
     - `minor` (0.9.3 → 0.10.0): 새 기능 추가, 기존 기능 개선
     - `major` (0.10.0 → 1.0.0): 큰 변경, 호환성 깨짐
   - 업데이트 대상 파일:
     - `my-app/package.json` - version 필드
     - `CLAUDE.md` - Version 항목

3. **커밋 메시지 작성**
   - 언어: 변경 내용에 따라 자동 선택 (기본 한국어, 필요시 영어)
   - 형식:
     ```
     <type>: <제목> (50자 이내)

     <본문>
     - 변경 사항 상세 설명
     - 왜 변경했는지 이유
     - 영향 범위

     🤖 Generated with [Claude Code](https://claude.com/claude-code)

     Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
     ```

4. **커밋 타입** (버전 영향)
   - `feat`: 새로운 기능 → minor 또는 patch
   - `fix`: 버그 수정 → patch
   - `refactor`: 리팩토링 → patch
   - `style`: 포맷팅 → patch
   - `docs`: 문서 수정 → 버전 변경 없음 (선택적)
   - `test`: 테스트 → 버전 변경 없음 (선택적)
   - `chore`: 빌드, 설정 → patch

5. **실행**
   - 버전 업데이트 (package.json, CLAUDE.md)
   - 변경된 파일 스테이징 (`git add`)
   - 커밋 생성 (`git commit`)
   - 원격 저장소 푸시 (`git push`)

## 주의사항

- `.env`, `credentials.json` 등 민감한 파일은 커밋하지 않음
- 푸시 전 현재 브랜치와 원격 브랜치 상태 확인
- force push는 사용하지 않음
- package.json과 CLAUDE.md의 버전은 항상 동기화

## 버전 확인 명령

```bash
# 현재 버전 확인
grep '"version"' my-app/package.json
grep 'Version' CLAUDE.md
```
