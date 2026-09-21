# KST World Time

한국 시간을 기준으로 25개 국가·27개 표기를 관할 법인별로 묶고, 같은 관할 안에서는 동일 시간대를 합쳐 보여주는 사이트입니다.

## Features

- 서울 시간을 기준 시계로 상단에 고정
- 각 국가 현지 시간과 날짜를 1초마다 자동 갱신
- 한국 대비 시차를 자연어로 표시
- 호주는 여러 시간대를 함께 표시
- GitHub Pages 배포용 GitHub Actions 포함

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy

`main` 브랜치에 푸시하면 `.github/workflows/deploy.yml`을 통해 GitHub Pages로 배포됩니다.
