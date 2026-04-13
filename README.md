# 📈 StockStream (스톡스트림)
> **실시간 지수 및 주가 모니터링을 위한 프리미엄 데스크탑 앱**

[![Release](https://img.shields.io/github/v/release/knggjjang/stock-stream?color=blue&style=flat-square)](https://github.com/knggjjang/stock-stream/releases)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows-lightgrey?style=flat-square)](#)
[![Tech Stack](https://img.shields.io/badge/Next.js%2015-Tauri%20v2-orange?style=flat-square)](#)

StockStream은 투자자들을 위한 실시간 주식 모니터링 데스크탑 애플리케이션입니다. 번거로운 웹브라우저 확인 없이 맥의 메뉴바나 윈도우의 트레이에서 즉시 주가를 확인하고, 세련된 대시보드를 통해 시장의 흐름과 내 자산 현황을 한눈에 파악할 수 있습니다.

---

## ✨ 핵심 기능

### 1. 실시간 시장 지수 대시보드
- **국내외 주요 지수**: 코스피(KOSPI), 코스닥(KOSDAQ), 나스닥(NASDAQ) 지수를 실시간으로 상단 바에서 확인 가능합니다.
- **다이내믹 컬러**: 상승/하락에 따른 직관적인 색상 변화와 트렌드 아이콘을 제공합니다.

### 2. 스마트 관심종목 (Watchlist)
- **간편한 추가**: 티커 코드 입력만으로 원하는 종목을 바로 추가할 수 있습니다.
- **실시간 데이터**: 네이버 금융 API를 연동하여 최신 주가와 등락률을 즉각 반영합니다.
- **순서 변경 및 삭제**: 드래그는 아직 미지원이지만, 정밀한 관리 기능을 통해 리스트를 최적화할 수 있습니다.

### 3. 포트폴리오 및 자산 관리 (My Assets)
- **실시간 수익률**: 내 매수 평단가와 수량을 입력하여 실시간 수익금과 수익률을 계산합니다.
- **프라이버시 모드 (3단계)**:
    - 👁️ **모두 표시**: 모든 금액과 수익률 노출
    - 🌗 **부분 가림**: 수익률만 표시, 자산 금액은 숨김 처리
    - 🌑 **모두 가림**: 모든 민감한 자산 정보를 `******` 처리

### 4. 강력한 시스템 통합
- **메뉴바/트레이 티커**: 앱을 열지 않아도 맥 상단바나 윈도우 작업표시줄에서 주가를 볼 수 있습니다.
- **고정/순환 모드**: 특정 종목을 고정해서 보거나, 관심 종목을 일정 주기로 순환하며 표시할 수 있습니다.

---

## 🚀 시작하기

### 설치 방법 (Windows & macOS)

1.  본 저장소의 **[Releases](https://github.com/knggjjang/stock-stream/releases)** 페이지로 이동합니다.
2.  사용 중인 운영체제에 맞는 파일을 다운로드합니다.
    -   **Windows**: `.exe` 또는 `.msi` 설치 파일
    -   **macOS (Apple Silicon)**: `.dmg` 파일
3.  다운로드한 파일을 실행하여 설치를 완료합니다.

### 실행 방법
-   앱을 실행하면 왼쪽 사이드바의 **Settings** 메뉴에서 메뉴바에 표시할 종목과 갱신 주기를 설정할 수 있습니다.

---

## 🛠 기술 스택

-   **Frontend**: Next.js 15 (App Router), React, Tailwind CSS, Lucide React
-   **Backend**: Tauri v2, Rust (High Performance & Security)
-   **State Management**: Zustand (with Persistence)
-   **UI Components**: Radix UI, Shadcn UI (Customized)

---

## 🔒 보안 및 데이터
보안을 위해 사용자의 모든 포트폴리오 데이터와 설정은 외부 서버가 아닌 **사용자의 로컬 기기에만 안전하게 저장**됩니다.

---

## ✍️ 작성 및 관리
이 프로젝트는 **Antigravity (AI Coding Assistant)**와 함께 제작되었으며, GitHub Actions를 통해 지속적으로 업데이트되고 빌드됩니다.

---
© 2026 knggjjang. All rights reserved.
