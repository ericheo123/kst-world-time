# KST World Time

한국 시간을 기준으로 호주, 싱가포르, 카자흐스탄, 헝가리, 체코, 스웨덴, 폴란드, 독일의 현재 시간을 한 페이지에서 실시간으로 보여주는 사이트입니다.

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
