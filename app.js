"use strict";

const WEATHER_API_URL = "https://api.open-meteo.com/v1/forecast";
const GEOLOCATION_TIMEOUT = 8000;
const GEOLOCATION_MAX_AGE = 10 * 60 * 1000;
const DEFAULT_CATEGORY = "cloudy";

const CATEGORY_LABELS = {
  sunny: "晴天",
  sunny_hot: "暖晴天",
  sunny_cold: "寒冷晴天",
  partly_cloudy: "局部多云",
  cloudy: "多云",
  overcast: "阴天",
  cloudy_cold: "冷云阴天",
  fog_mist: "雾",
  haze: "霾",
  humid_hot_cloudy: "暖湿多云",
  rain_light: "小雨",
  rain_moderate: "中雨",
  rain_heavy: "大雨",
  rainstorm: "暴雨",
  thunderstorm: "雷阵雨",
  rain_cold: "冷雨",
  freezing_rain: "冻雨",
  sleet_mixed: "雨夹雪",
  snow_light: "小雪",
  snow_heavy: "大雪",
  windy: "大风"
};

const BASE_IMAGE_MANIFEST = {
  cloudy: ["assets/images/cloudy/cloudy_01.png"],
  cloudy_cold: [
    "assets/images/cloudy_cold/cloudy_cold_01.png",
    "assets/images/cloudy_cold/cloudy_cold_02.png",
    "assets/images/cloudy_cold/cloudy_cold_03.png"
  ],
  fog_mist: [
    "assets/images/fog_mist/fog_mist_01.png",
    "assets/images/fog_mist/fog_mist_02.png",
    "assets/images/fog_mist/fog_mist_03.png"
  ],
  freezing_rain: [
    "assets/images/freezing_rain/freezing_rain_01.png",
    "assets/images/freezing_rain/freezing_rain_02.png"
  ],
  haze: ["assets/images/haze/haze_01.png", "assets/images/haze/haze_02.png"],
  humid_hot_cloudy: [
    "assets/images/humid_hot_cloudy/humid_hot_cloudy_01.png",
    "assets/images/humid_hot_cloudy/humid_hot_cloudy_02.png"
  ],
  overcast: ["assets/images/overcast/overcast_01.png"],
  partly_cloudy: [
    "assets/images/partly_cloudy/partly_cloudy_01.png",
    "assets/images/partly_cloudy/partly_cloudy_02.png"
  ],
  rain_cold: [
    "assets/images/rain_cold/rain_cold_01.png",
    "assets/images/rain_cold/rain_cold_02.png"
  ],
  rain_heavy: [
    "assets/images/rain_heavy/rain_heavy_01.png",
    "assets/images/rain_heavy/rain_heavy_02.png"
  ],
  rain_light: [
    "assets/images/rain_light/rain_light_01.png",
    "assets/images/rain_light/rain_light_02.png",
    "assets/images/rain_light/rain_light_03.png",
    "assets/images/rain_light/rain_light_04.png"
  ],
  rain_moderate: [
    "assets/images/rain_moderate/rain_moderate_01.png",
    "assets/images/rain_moderate/rain_moderate_02.png",
    "assets/images/rain_moderate/rain_moderate_03.png"
  ],
  rainstorm: [
    "assets/images/rainstorm/rainstorm_01.png",
    "assets/images/rainstorm/rainstorm_02.png"
  ],
  sleet_mixed: [
    "assets/images/sleet_mixed/sleet_mixed_01.png",
    "assets/images/sleet_mixed/sleet_mixed_02.png"
  ],
  snow_heavy: [
    "assets/images/snow_heavy/snow_heavy_01.png",
    "assets/images/snow_heavy/snow_heavy_02.png"
  ],
  snow_light: [
    "assets/images/snow_light/snow_light_01.png",
    "assets/images/snow_light/snow_light_02.png"
  ],
  sunny: ["assets/images/sunny/sunny_01.png"],
  sunny_cold: [
    "assets/images/sunny_cold/sunny_cold_01.png",
    "assets/images/sunny_cold/sunny_cold_02.png",
    "assets/images/sunny_cold/sunny_cold_03.png"
  ],
  sunny_hot: [
    "assets/images/sunny_hot/sunny_hot_01.png",
    "assets/images/sunny_hot/sunny_hot_02.png",
    "assets/images/sunny_hot/sunny_hot_03.png"
  ],
  thunderstorm: [
    "assets/images/thunderstorm/thunderstorm_01.png",
    "assets/images/thunderstorm/thunderstorm_02.png"
  ],
  windy: ["assets/images/windy/windy_01.png"]
};

const BASE_QUOTES = {
  default: [
    "今天也有今天的节奏。",
    "翻到这一页，就好好过这一日。",
    "不管天气如何，今天都值得被认真收藏。"
  ]
};

const RAIN_CODES = new Set([
  51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99
]);
const FREEZING_RAIN_CODES = new Set([56, 57, 66, 67]);
const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86]);
const THUNDER_CODES = new Set([95, 96, 99]);

let imageManifest = BASE_IMAGE_MANIFEST;
let quoteLibrary = BASE_QUOTES;

const dom = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheDom();
  bindEvents();
  startExperience();
});

function cacheDom() {
  dom.loadingScreen = document.getElementById("loadingScreen");
  dom.resultScreen = document.getElementById("resultScreen");
  dom.dateLine = document.getElementById("dateLine");
  dom.weekdayLine = document.getElementById("weekdayLine");
  dom.weatherTitle = document.getElementById("weatherTitle");
  dom.weatherMeta = document.getElementById("weatherMeta");
  dom.locationStatus = document.getElementById("locationStatus");
  dom.statusDot = document.getElementById("statusDot");
  dom.artFrame = document.querySelector(".art-frame");
  dom.weatherArt = document.getElementById("weatherArt");
  dom.quoteText = document.getElementById("quoteText");
  dom.refreshButton = document.getElementById("refreshButton");
  dom.defaultButton = document.getElementById("defaultButton");
  dom.fallbackPanel = document.getElementById("fallbackPanel");
  dom.fallbackMessage = document.getElementById("fallbackMessage");
}

function bindEvents() {
  dom.refreshButton.addEventListener("click", () => startExperience());
  dom.defaultButton.addEventListener("click", () => renderFallback(new Error("手动使用默认天气体验")));
}

async function startExperience() {
  showLoading();
  await loadLocalData();

  const mock = parseMockParams();

  try {
    if (mock.category) {
      const category = normalizeCategory(mock.category);
      await renderCurrent(category, createMockWeather(mock), {
        status: `调试模式：${CATEGORY_LABELS[category] || category}`,
        isFallback: false
      });
      return;
    }

    if (mock.hasWeather) {
      const weather = createMockWeather(mock);
      await renderCurrent(mapWeatherToCategory(weather), weather, {
        status: "调试天气数据",
        isFallback: false
      });
      return;
    }

    const position = await getCurrentPosition();
    const weather = await fetchWeather(position.coords.latitude, position.coords.longitude);
    const category = mapWeatherToCategory(weather);
    await renderCurrent(category, weather, {
      status: "已读取你附近的天气",
      isFallback: false
    });
  } catch (error) {
    await renderFallback(error);
  }
}

function getLocalDateInfo() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const weekdayNames = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  const pad = (value) => String(value).padStart(2, "0");

  return {
    isoDate: `${year}-${pad(month)}-${pad(day)}`,
    zhDate: `${year}年${month}月${day}日`,
    weekday: weekdayNames[now.getDay()]
  };
}

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("当前浏览器不支持定位"));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: GEOLOCATION_TIMEOUT,
      maximumAge: GEOLOCATION_MAX_AGE
    });
  });
}

async function fetchWeather(lat, lon) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "precipitation",
      "rain",
      "showers",
      "snowfall",
      "weather_code",
      "cloud_cover",
      "wind_speed_10m",
      "wind_gusts_10m",
      "visibility",
      "is_day"
    ].join(","),
    timezone: "auto"
  });

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 9000);

  try {
    const response = await fetch(`${WEATHER_API_URL}?${params.toString()}`, {
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`天气接口返回 ${response.status}`);
    }

    const data = await response.json();
    if (!data || !data.current) {
      throw new Error("天气接口缺少 current 数据");
    }

    return data.current;
  } catch (error) {
    throw new Error(`天气读取失败：${error.message}`);
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function mapWeatherToCategory(weather) {
  const code = toNumber(weather.weather_code);
  const apparentTemp = toNumber(weather.apparent_temperature, weather.temperature_2m);
  const humidity = toNumber(weather.relative_humidity_2m);
  const cloudCover = toNumber(weather.cloud_cover);
  const precipitation = toNumber(weather.precipitation);
  const rain = toNumber(weather.rain) + toNumber(weather.showers);
  const snowfall = toNumber(weather.snowfall);
  const windSpeed = toNumber(weather.wind_speed_10m);
  const windGusts = toNumber(weather.wind_gusts_10m);
  const visibility = toNumber(weather.visibility, null);
  const isRainCode = RAIN_CODES.has(code);
  const isSnowCode = SNOW_CODES.has(code);
  const hasRain = isRainCode || rain > 0 || (precipitation > 0 && snowfall <= 0);
  const hasSnow = isSnowCode || snowfall > 0;
  const hasPrecipitation = hasRain || hasSnow || precipitation > 0;

  if (hasRain && hasSnow) {
    return "sleet_mixed";
  }

  if (visibility !== null && visibility < 3000 && !hasPrecipitation) {
    return humidity >= 80 ? "fog_mist" : "haze";
  }

  if ((windSpeed >= 35 || windGusts >= 50) && !hasPrecipitation) {
    return "windy";
  }

  let category = mapWmoCodeToBaseCategory(code, cloudCover);

  if (THUNDER_CODES.has(code)) {
    return "thunderstorm";
  }

  if (FREEZING_RAIN_CODES.has(code)) {
    return "freezing_rain";
  }

  if (hasRain && apparentTemp <= 1) {
    return "freezing_rain";
  }

  if (hasRain && apparentTemp <= 5) {
    return "rain_cold";
  }

  if (humidity >= 80 && apparentTemp >= 28 && !hasPrecipitation) {
    return "humid_hot_cloudy";
  }

  if (category === "sunny" && apparentTemp >= 30) {
    return "sunny_hot";
  }

  if (category === "sunny" && apparentTemp <= 5) {
    return "sunny_cold";
  }

  if ((category === "cloudy" || category === "overcast") && apparentTemp <= 5) {
    return "cloudy_cold";
  }

  return category;
}

async function getRandomImage(category) {
  const fallbackCategories = [normalizeCategory(category), DEFAULT_CATEGORY, "sunny"];
  const tried = new Set();

  for (const candidateCategory of fallbackCategories) {
    const files = imageManifest[candidateCategory] || [];
    const randomized = shuffle(files);

    for (const file of randomized) {
      if (tried.has(file)) {
        continue;
      }

      tried.add(file);

      try {
        await preloadImage(file);
        return file;
      } catch (error) {
        console.warn("图片加载失败，尝试下一张", file, error);
      }
    }
  }

  return "assets/images/cloudy/cloudy_01.png";
}

async function getRandomQuote(category) {
  const normalizedCategory = normalizeCategory(category);
  const quotes = quoteLibrary[normalizedCategory] || quoteLibrary.default || BASE_QUOTES.default;
  return pickOne(quotes);
}

function renderPage(state) {
  const dateInfo = state.dateInfo || getLocalDateInfo();
  const categoryLabel = CATEGORY_LABELS[state.category] || "今日天气";
  const temperature = formatTemperature(state.weather.temperature_2m);
  const apparentTemperature = formatTemperature(state.weather.apparent_temperature);

  dom.dateLine.textContent = dateInfo.zhDate;
  dom.weekdayLine.textContent = `${dateInfo.weekday} · ${dateInfo.isoDate}`;
  dom.weatherTitle.textContent = categoryLabel;
  dom.weatherMeta.textContent = `${temperature} · 体感 ${apparentTemperature}`;
  dom.locationStatus.textContent = state.status;
  dom.statusDot.classList.toggle("is-muted", Boolean(state.isFallback));
  dom.quoteText.textContent = state.quote;
  dom.weatherArt.classList.remove("is-visible");
  dom.weatherArt.src = state.imagePath;
  dom.weatherArt.alt = `${CATEGORY_LABELS[state.category] || "天气"}插画`;
  dom.artFrame.style.setProperty("--weather-art-url", `url("${state.imagePath}")`);

  dom.fallbackPanel.classList.toggle("is-hidden", !state.isFallback);
  if (state.isFallback) {
    dom.fallbackMessage.textContent = state.fallbackMessage;
  }

  dom.loadingScreen.classList.add("is-hidden");
  dom.resultScreen.classList.remove("is-hidden");

  window.requestAnimationFrame(() => {
    dom.weatherArt.classList.add("is-visible");
  });
}

async function renderFallback(error) {
  console.warn("进入默认天气体验", error);
  await renderCurrent(DEFAULT_CATEGORY, createFallbackWeather(), {
    status: "未能读取当前位置，已使用默认天气体验",
    isFallback: true,
    fallbackMessage: getFallbackMessage(error)
  });
}

function parseMockParams() {
  const params = new URLSearchParams(window.location.search);
  const category = params.get("mockCategory");
  const weatherCode = params.get("mockWeatherCode");
  const temp = params.get("mockTemp");

  return {
    category,
    weatherCode: weatherCode === null ? null : Number(weatherCode),
    temp: temp === null ? null : Number(temp),
    hasWeather: weatherCode !== null || temp !== null
  };
}

async function renderCurrent(category, weather, meta) {
  const normalizedCategory = normalizeCategory(category);
  const [imagePath, quote] = await Promise.all([
    getRandomImage(normalizedCategory),
    getRandomQuote(normalizedCategory)
  ]);

  renderPage({
    category: normalizedCategory,
    weather,
    imagePath,
    quote,
    dateInfo: getLocalDateInfo(),
    status: meta.status,
    isFallback: meta.isFallback,
    fallbackMessage: meta.fallbackMessage || ""
  });
}

async function loadLocalData() {
  const [manifest, quotes] = await Promise.all([loadImageManifest(), loadQuoteLibrary()]);
  imageManifest = manifest;
  quoteLibrary = quotes;
}

async function loadImageManifest() {
  try {
    const data = await fetchJson("data/image-manifest.json");
    return normalizeImageManifest(data);
  } catch (error) {
    console.warn("图片 manifest 读取失败，使用内置 manifest", error);
    return BASE_IMAGE_MANIFEST;
  }
}

async function loadQuoteLibrary() {
  try {
    const data = await fetchJson("data/quotes.json");
    return { ...BASE_QUOTES, ...data };
  } catch (error) {
    console.warn("文案读取失败，使用内置默认文案", error);
    return BASE_QUOTES;
  }
}

async function fetchJson(path) {
  const response = await fetch(path, { cache: "no-cache" });

  if (!response.ok) {
    throw new Error(`${path} 返回 ${response.status}`);
  }

  return response.json();
}

function normalizeImageManifest(data) {
  if (!data || typeof data !== "object") {
    return BASE_IMAGE_MANIFEST;
  }

  if (data.categories && typeof data.categories === "object") {
    return Object.fromEntries(
      Object.entries(data.categories).map(([category, value]) => [
        category,
        Array.isArray(value.files) ? value.files : []
      ])
    );
  }

  return Object.fromEntries(
    Object.entries(data).map(([category, value]) => [
      category,
      Array.isArray(value) ? value : []
    ])
  );
}

function showLoading() {
  dom.loadingScreen.classList.remove("is-hidden");
  dom.resultScreen.classList.add("is-hidden");
  dom.fallbackPanel.classList.add("is-hidden");
}

function mapWmoCodeToBaseCategory(code, cloudCover) {
  if (code === 0) {
    return "sunny";
  }

  if (code === 1) {
    if (cloudCover >= 58) {
      return "cloudy";
    }

    return cloudCover >= 28 ? "partly_cloudy" : "sunny";
  }

  if (code === 2) {
    return "partly_cloudy";
  }

  if (code === 3) {
    return "overcast";
  }

  if (code === 45 || code === 48) {
    return "fog_mist";
  }

  if (code === 51 || code === 61 || code === 80) {
    return "rain_light";
  }

  if (code === 53 || code === 63 || code === 81) {
    return "rain_moderate";
  }

  if (code === 55 || code === 65) {
    return "rain_heavy";
  }

  if (code === 82) {
    return "rainstorm";
  }

  if (code === 56 || code === 57 || code === 66 || code === 67) {
    return "freezing_rain";
  }

  if (code === 71 || code === 73 || code === 77 || code === 85) {
    return "snow_light";
  }

  if (code === 75 || code === 86) {
    return "snow_heavy";
  }

  if (code === 95 || code === 96 || code === 99) {
    return "thunderstorm";
  }

  if (cloudCover >= 86) {
    return "overcast";
  }

  if (cloudCover >= 58) {
    return "cloudy";
  }

  if (cloudCover >= 28) {
    return "partly_cloudy";
  }

  return DEFAULT_CATEGORY;
}

function createMockWeather(mock) {
  const temp = Number.isFinite(mock.temp) ? mock.temp : 24;
  const weatherCode = Number.isFinite(mock.weatherCode) ? mock.weatherCode : 0;

  return {
    temperature_2m: temp,
    apparent_temperature: temp,
    relative_humidity_2m: 58,
    precipitation: 0,
    rain: 0,
    showers: 0,
    snowfall: 0,
    weather_code: weatherCode,
    cloud_cover: weatherCode === 0 ? 12 : 80,
    wind_speed_10m: 8,
    wind_gusts_10m: 18,
    visibility: 10000,
    is_day: 1
  };
}

function createFallbackWeather() {
  return {
    temperature_2m: null,
    apparent_temperature: null,
    relative_humidity_2m: null,
    precipitation: 0,
    rain: 0,
    showers: 0,
    snowfall: 0,
    weather_code: null,
    cloud_cover: 70,
    wind_speed_10m: null,
    wind_gusts_10m: null,
    visibility: null,
    is_day: 1
  };
}

function normalizeCategory(category) {
  if (category && Object.prototype.hasOwnProperty.call(CATEGORY_LABELS, category)) {
    return category;
  }

  return DEFAULT_CATEGORY;
}

function getFallbackMessage(error) {
  if (!error) {
    return "今天先使用默认天气体验，稍后可以重新获取。";
  }

  if (error.code === 1) {
    return "你暂时关闭了定位权限，已为你打开默认天气体验。";
  }

  if (error.code === 2 || error.code === 3) {
    return "暂时没有读到当前位置，已为你打开默认天气体验。";
  }

  return "天气读取暂时不顺利，已为你打开默认天气体验。";
}

function formatTemperature(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return "--°";
  }

  return `${Math.round(number)}°`;
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function pickOne(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return BASE_QUOTES.default[0];
  }

  return items[Math.floor(Math.random() * items.length)];
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function preloadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(src);
    image.onerror = reject;
    image.src = src;
  });
}

window.LumaareNfcCalendar = {
  getLocalDateInfo,
  parseMockParams,
  mapWeatherToCategory
};
