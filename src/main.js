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
    accent: "서머타임 자동 반영",
    cities: [{ label: "카이로", timeZone: "Africa/Cairo" }]
  }
];

const kstTimeElement = document.querySelector("#kst-time");
const kstDateElement = document.querySelector("#kst-date");
const gridElement = document.querySelector("#clock-grid");
const dstInfoCache = new Map();
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const MINUTE_IN_MS = 60 * 1000;

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
                      <div class="city-dst">서머타임 확인 중</div>
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

function formatLongDateText(date, timeZone) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone,
    year: "numeric",
    month: "long",
    day: "numeric"
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

function getOffsetTransitions(startDate, endDate, timeZone) {
  const transitions = [];
  let cursor = startDate;
  let previousOffset = getOffsetMinutes(cursor, timeZone);

  while (cursor.getTime() < endDate.getTime()) {
    const next = new Date(Math.min(cursor.getTime() + DAY_IN_MS, endDate.getTime()));
    const nextOffset = getOffsetMinutes(next, timeZone);

    if (nextOffset !== previousOffset) {
      const transitionAt = findTransitionTime(cursor, next, timeZone, previousOffset);
      transitions.push({
        at: transitionAt,
        before: previousOffset,
        after: getOffsetMinutes(transitionAt, timeZone)
      });
      previousOffset = transitions[transitions.length - 1].after;
    }

    cursor = next;
  }

  return transitions;
}

function findTransitionTime(startDate, endDate, timeZone, beforeOffset) {
  let low = startDate.getTime();
  let high = endDate.getTime();

  while (high - low > MINUTE_IN_MS) {
    const mid = low + Math.floor((high - low) / 2);
    const midOffset = getOffsetMinutes(new Date(mid), timeZone);

    if (midOffset === beforeOffset) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return new Date(high);
}

function getDstRange(date, timeZone) {
  const cacheKey = `${timeZone}:${date.getUTCFullYear()}`;
  if (dstInfoCache.has(cacheKey)) {
    return dstInfoCache.get(cacheKey);
  }

  const startDate = new Date(Date.UTC(date.getUTCFullYear() - 1, 0, 1, 12));
  const endDate = new Date(Date.UTC(date.getUTCFullYear() + 1, 11, 31, 12));
  const transitions = getOffsetTransitions(startDate, endDate, timeZone);
  const uniqueOffsets = [...new Set([getOffsetMinutes(startDate, timeZone), ...transitions.map((transition) => transition.after)])];

  if (uniqueOffsets.length < 2) {
    const result = { observesDst: false };
    dstInfoCache.set(cacheKey, result);
    return result;
  }

  const dstOffset = Math.max(...uniqueOffsets);
  const intervals = [];
  let intervalStart = startDate.getTime();
  let currentOffset = getOffsetMinutes(startDate, timeZone);

  transitions.forEach((transition) => {
    const intervalEnd = transition.at.getTime();
    if (currentOffset === dstOffset) {
      intervals.push({ start: intervalStart, end: intervalEnd });
    }

    intervalStart = intervalEnd;
    currentOffset = transition.after;
  });

  if (currentOffset === dstOffset) {
    intervals.push({ start: intervalStart, end: endDate.getTime() });
  }

  const now = date.getTime();
  const activeInterval = intervals.find((interval) => interval.start <= now && now < interval.end);
  const nextInterval = intervals.find((interval) => interval.start > now) ?? intervals[0];
  const targetInterval = activeInterval ?? nextInterval;

  const result = {
    observesDst: true,
    isActive: Boolean(activeInterval),
    start: new Date(targetInterval.start),
    end: new Date(targetInterval.end)
  };

  dstInfoCache.set(cacheKey, result);
  return result;
}

function formatDstText(date, timeZone) {
  const dstRange = getDstRange(date, timeZone);

  if (!dstRange.observesDst) {
    return "서머타임 없음";
  }

  const rangeText = `${formatLongDateText(dstRange.start, timeZone)} ~ ${formatLongDateText(dstRange.end, timeZone)}`;
  return `${dstRange.isActive ? "서머타임 진행 중" : "다음 서머타임"} · ${rangeText}`;
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
    const dstElement = row.querySelector(".city-dst");
    const parts = getTimeParts(now, timeZone);
    const dayDiff = getDayDifference(now, timeZone, parts);

    timeElement.textContent = formatTimeText(now, timeZone);
    dateElement.textContent = `${formatDateText(now, timeZone)}${dayDiff}`;
    differenceElement.textContent = formatDifference(getOffsetMinutes(now, timeZone));
    dstElement.textContent = formatDstText(now, timeZone);
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
