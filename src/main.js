const countries = [
  {
    country: "베트남",
    englishName: "Vietnam",
    accent: "한국보다 2시간 느림",
    cities: [{ label: "호치민", timeZone: "Asia/Ho_Chi_Minh" }]
  },
  {
    country: "호주",
    englishName: "Australia",
    accent: "시드니 기준",
    cities: [{ label: "시드니", timeZone: "Australia/Sydney" }]
  },
  {
    country: "스웨덴",
    englishName: "Sweden",
    accent: "서머타임 자동 반영",
    cities: [{ label: "스톡홀름", timeZone: "Europe/Stockholm" }]
  },
  {
    country: "사우디아라비아",
    englishName: "Saudi Arabia",
    accent: "사우디 표준시",
    cities: [{ label: "리야드", timeZone: "Asia/Riyadh" }]
  },
  {
    country: "콜롬비아",
    englishName: "Colombia",
    accent: "한국보다 많이 느림",
    cities: [{ label: "보고타", timeZone: "America/Bogota" }]
  },
  {
    country: "이집트",
    englishName: "Egypt",
    accent: "일광절약시간 자동 반영",
    cities: [{ label: "카이로", timeZone: "Africa/Cairo" }]
  }
];

const kstTimeElement = document.querySelector("#kst-time");
const kstDateElement = document.querySelector("#kst-date");
const gridElement = document.querySelector("#clock-grid");

function createCards() {
  gridElement.innerHTML = countries
    .map(
      (country) => `
        <article class="clock-card">
          <div class="country-header">
            <div>
              <p class="country-label">${country.englishName}</p>
              <h2 class="country-name">${country.country}</h2>
            </div>
            <div class="offset-badge">${country.accent}</div>
          </div>
          <div class="city-list">
            ${country.cities
              .map(
                (city) => `
                  <div class="city-row" data-timezone="${city.timeZone}">
                    <div class="city-tag">${city.label}</div>
                    <div class="city-meta">
                      <div class="city-time">--:--:--</div>
                      <div class="city-date">날짜 계산 중</div>
                      <div class="city-difference">시차 계산 중</div>
                    </div>
                  </div>
                `
              )
              .join("")}
          </div>
        </article>
      `
    )
    .join("");
}

function getTimeParts(date, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });

  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second)
  };
}

function getOffsetMinutes(date, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset"
  });
  const zoneName = formatter
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName")?.value;

  const match = zoneName?.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!match) {
    return 0;
  }

  const sign = match[1] === "+" ? 1 : -1;
  const hours = Number(match[2]);
  const minutes = Number(match[3] ?? "0");
  return sign * (hours * 60 + minutes);
}

function formatDateText(date, timeZone) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone,
    month: "long",
    day: "numeric",
    weekday: "long"
  }).format(date);
}

function formatTimeText(date, timeZone) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(date);
}

function formatDifference(targetOffsetMinutes) {
  const kstOffsetMinutes = 9 * 60;
  const diffMinutes = targetOffsetMinutes - kstOffsetMinutes;

  if (diffMinutes === 0) {
    return "한국과 같은 시간";
  }

  const ahead = diffMinutes > 0;
  const absoluteMinutes = Math.abs(diffMinutes);
  const hours = Math.floor(absoluteMinutes / 60);
  const minutes = absoluteMinutes % 60;
  const chunks = [];

  if (hours) {
    chunks.push(`${hours}시간`);
  }

  if (minutes) {
    chunks.push(`${minutes}분`);
  }

  return `한국보다 ${chunks.join(" ")} ${ahead ? "빠름" : "느림"}`;
}

function updateClock() {
  const now = new Date();
  kstTimeElement.textContent = formatTimeText(now, "Asia/Seoul");
  kstDateElement.textContent = formatDateText(now, "Asia/Seoul");

  document.querySelectorAll(".city-row").forEach((row) => {
    const timeZone = row.dataset.timezone;
    const timeElement = row.querySelector(".city-time");
    const dateElement = row.querySelector(".city-date");
    const differenceElement = row.querySelector(".city-difference");
    const parts = getTimeParts(now, timeZone);
    const dayDiff = getDayDifference(now, timeZone, parts);

    timeElement.textContent = formatTimeText(now, timeZone);
    dateElement.textContent = `${formatDateText(now, timeZone)}${dayDiff}`;
    differenceElement.textContent = formatDifference(getOffsetMinutes(now, timeZone));
  });
}

function getDayDifference(now, timeZone, targetParts) {
  const kstParts = getTimeParts(now, "Asia/Seoul");
  const kstUtcEquivalent = Date.UTC(kstParts.year, kstParts.month - 1, kstParts.day);
  const targetUtcEquivalent = Date.UTC(targetParts.year, targetParts.month - 1, targetParts.day);
  const diffDays = Math.round((targetUtcEquivalent - kstUtcEquivalent) / 86400000);

  if (diffDays === 1) {
    return " · 한국보다 하루 앞";
  }

  if (diffDays === -1) {
    return " · 한국보다 하루 전";
  }

  return "";
}

createCards();
updateClock();
setInterval(updateClock, 1000);
