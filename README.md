# LUMAARE NFC Calendar

LUMAARE NFC Calendar 是一个适合部署到 GitHub Pages 的纯前端 NFC 日历互动页。实体日历中的 NFC 标签可以指向同一个网页 URL，页面会根据用户本地日期、定位和 Open-Meteo 天气数据展示对应天气插画，并从本地文案库随机抽取一句话。

项目不使用后端、数据库、大模型接口或 API Key。

## 本地预览

推荐使用本地静态服务器预览完整功能：

```bash
python3 -m http.server 8000
```

然后打开：

```text
http://localhost:8000
```

直接双击 `index.html` 也能看到页面兜底体验，但部分浏览器会限制 `file://` 页面读取本地 JSON，因此完整数据流建议使用本地服务器。Geolocation API 在 `localhost` 和 HTTPS 环境中可用。

## GitHub Pages 部署

1. 将本仓库推送到 GitHub。
2. 进入仓库 `Settings`。
3. 打开 `Pages`。
4. Source 选择当前分支，目录选择仓库根目录。
5. 保存后等待 GitHub Pages 生成公开 URL。

页面入口是根目录的 `index.html`，可以直接作为 GitHub Pages 静态站点运行。

## 新增天气图片

图片目录结构：

```text
assets/images/<category>/<category>_xx.png
```

例如新增一张小雨图：

```text
assets/images/rain_light/rain_light_05.png
```

然后在 `data/image-manifest.json` 对应分类的 `files` 数组中加入这条路径。页面会按分类随机选择图片，并在当前分类缺图时回退到 `cloudy` 或 `sunny`。

## 新增文案

编辑 `data/quotes.json`，在对应天气分类数组中追加文案：

```json
{
  "rain_light": [
    "小雨在窗外慢慢写字，今天可以走得慢一点。"
  ]
}
```

如果某个分类没有文案，页面会使用 `default` 分类。文案库可以继续扩展到更大的 JSON 文件。

## Mock 参数

调试时可以通过 URL query 参数强制展示分类或天气逻辑：

```text
http://localhost:8000?mockCategory=rain_light
http://localhost:8000?mockCategory=sunny_hot
http://localhost:8000?mockWeatherCode=65&mockTemp=2
```

`mockCategory` 存在时会直接展示该分类，不请求定位和天气接口。`mockWeatherCode` 与 `mockTemp` 会构造一组调试天气数据，用来测试分类映射。

## 天气分类

当前支持分类：

```text
sunny, sunny_hot, sunny_cold, partly_cloudy, cloudy, overcast,
cloudy_cold, fog_mist, haze, humid_hot_cloudy, rain_light,
rain_moderate, rain_heavy, rainstorm, thunderstorm, rain_cold,
freezing_rain, sleet_mixed, snow_light, snow_heavy, windy
```

核心逻辑位于 `app.js` 的 `mapWeatherToCategory(weather)`。它先按 WMO `weather_code` 做基础映射，再根据体感温度、湿度、能见度、风速、降水和降雪进行修正。

## 文件结构

```text
/
├── index.html
├── styles.css
├── app.js
├── data/
│   ├── image-manifest.json
│   └── quotes.json
├── assets/
│   ├── logo/
│   │   └── lumaare-logo.png
│   └── images/
│       └── <category>/
└── README.md
```
