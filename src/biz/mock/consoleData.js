export function getSceneLevel(zoomLevel) {
  if (zoomLevel < 4) return 'global';
  if (zoomLevel < 7) return 'province';
  if (zoomLevel < 9) return 'city';
  return 'outlet';
}

export const timeWindowMeta = {
  '30m': { label: '30 分钟', maxMinutes: 30 },
  '6h': { label: '6 小时', maxMinutes: 360 },
  '24h': { label: '24 小时', maxMinutes: 1440 },
  all: { label: '全部', maxMinutes: Number.POSITIVE_INFINITY }
};

export const sceneMeta = {
  global: { label: '国际金融层', description: '国家中心点 + 国际资金飞线', zoomHint: 'z < 4' },
  province: { label: '中国省级层', description: '省级区块 + 省际资金流向', zoomHint: '4 <= z < 7' },
  city: { label: '城市地市层', description: '城市节点 + 城市间风险链路', zoomHint: '7 <= z < 9' },
  outlet: { label: '网点交易层', description: '精确交易坐标 + 网点级节点', zoomHint: 'z >= 9' }
};

export const consoleEvents = [
  {
    id: 'EF-001',
    minutesAgo: 18,
    area: '福建',
    amount: '¥94,000',
    amountValue: 94000,
    level: '高危',
    source: '异常转账',
    status: '二次外呼中',
    trend: '升温',
    familyCase: '福州家庭协作',
    familyStatus: '待回执',
    familyChannel: '短信 + 电话',
    summary: '跨省异常转账尝试命中高危黑名单特征，目标账户疑似境外洗钱链入口。',
    timeline: [
      { label: '规则触发', detail: '跨省收款 + 高危黑名单命中', minutesAgo: 18 },
      { label: '账户冻结建议', detail: '命中一级预警策略，提交人工复核', minutesAgo: 14 },
      { label: '家庭触达', detail: '短信送达，电话二次外呼中', minutesAgo: 6 }
    ],
    globalSource: { name: '中国', coordinates: [104.0, 35.0] },
    globalTarget: { name: '新加坡', coordinates: [103.8198, 1.3521] },
    provinceSource: { name: '广东', coordinates: [113.3, 23.1] },
    provinceTarget: { name: '福建', coordinates: [119.3, 26.1] },
    citySource: { name: '广州', coordinates: [113.2644, 23.1291] },
    cityTarget: { name: '福州', coordinates: [119.2965, 26.0745] },
    outletSource: { name: '广州天河支行', coordinates: [113.3615, 23.1247] },
    outletTarget: { name: '福州鼓楼网点', coordinates: [119.3035, 26.0821] }
  },
  {
    id: 'EF-002',
    minutesAgo: 122,
    area: '江苏',
    amount: '¥41,000',
    amountValue: 41000,
    level: '高危',
    source: '高收益理财',
    status: '待核验',
    trend: '新近激活',
    familyCase: '南京家庭协作',
    familyStatus: '已确认',
    familyChannel: 'App 通知',
    summary: '养老基金高收益承诺对应跨境收款链路，疑似由境外壳公司包装产品。',
    timeline: [
      { label: '理财词包命中', detail: '高收益、保本返息等话术高频出现', minutesAgo: 122 },
      { label: '人工复核', detail: '疑似境外壳公司包装产品', minutesAgo: 95 },
      { label: '家属确认', detail: 'App 已确认收到协查提醒', minutesAgo: 51 }
    ],
    globalSource: { name: '中国', coordinates: [104.0, 35.0] },
    globalTarget: { name: '英国', coordinates: [-1.5, 52.4] },
    provinceSource: { name: '北京', coordinates: [116.4, 39.9] },
    provinceTarget: { name: '江苏', coordinates: [118.8, 32.0] },
    citySource: { name: '哈尔滨', coordinates: [126.6424, 45.7567] },
    cityTarget: { name: '南京', coordinates: [118.7969, 32.0603] },
    outletSource: { name: '哈尔滨道里网点', coordinates: [126.6221, 45.7588] },
    outletTarget: { name: '南京玄武支行', coordinates: [118.8024, 32.0658] }
  },
  {
    id: 'EF-003',
    minutesAgo: 370,
    area: '湖北',
    amount: '¥18,000',
    amountValue: 18000,
    level: '中危',
    source: '短信话术',
    status: '已送达待回执',
    trend: '持平',
    familyCase: '武汉家庭协作',
    familyStatus: '二次外呼',
    familyChannel: '电话',
    summary: '短信话术与合同诱导同步出现，当前未形成大额外流，但需连续监视。',
    timeline: [
      { label: '短信诱导命中', detail: '检测到短链下载与合同话术组合', minutesAgo: 370 },
      { label: '持续监视', detail: '账户尚未形成大额外流', minutesAgo: 312 },
      { label: '外呼升级', detail: '进入人工二次外呼链路', minutesAgo: 44 }
    ],
    globalSource: { name: '中国', coordinates: [104.0, 35.0] },
    globalTarget: { name: '阿联酋', coordinates: [54.3773, 24.4539] },
    provinceSource: { name: '陕西', coordinates: [108.9, 34.3] },
    provinceTarget: { name: '湖北', coordinates: [112.3, 30.9] },
    citySource: { name: '西安', coordinates: [108.9398, 34.3416] },
    cityTarget: { name: '武汉', coordinates: [114.3054, 30.5931] },
    outletSource: { name: '西安雁塔网点', coordinates: [108.9486, 34.2305] },
    outletTarget: { name: '武汉武昌支行', coordinates: [114.3162, 30.5548] }
  },
  {
    id: 'EF-004',
    minutesAgo: 980,
    area: '广东',
    amount: '¥22,000',
    amountValue: 22000,
    level: '中危',
    source: '短信话术',
    status: '待二次短信确认',
    trend: '降温',
    familyCase: '深圳家庭协作',
    familyStatus: '已确认',
    familyChannel: 'App 通知',
    summary: '短链下载与投资诱导结合，近期活跃度回落，但仍需网点级观察。',
    timeline: [
      { label: '投资话术识别', detail: '短信短链与投资诱导组合触发', minutesAgo: 980 },
      { label: '活跃回落', detail: '近 24 小时交易活跃度下降', minutesAgo: 640 },
      { label: '网点观察', detail: '进入网点级连续观察名单', minutesAgo: 120 }
    ],
    globalSource: { name: '中国', coordinates: [104.0, 35.0] },
    globalTarget: { name: '美国', coordinates: [-98.5795, 39.8283] },
    provinceSource: { name: '云南', coordinates: [102.7, 25.0] },
    provinceTarget: { name: '广东', coordinates: [113.3, 23.1] },
    citySource: { name: '昆明', coordinates: [102.8329, 24.8801] },
    cityTarget: { name: '深圳', coordinates: [114.0579, 22.5431] },
    outletSource: { name: '昆明盘龙网点', coordinates: [102.7336, 25.0484] },
    outletTarget: { name: '深圳南山支行', coordinates: [113.9304, 22.5333] }
  }
];

export const cityNodes = [
  { name: '广州', coordinates: [113.2644, 23.1291], kind: 'source' },
  { name: '厦门', coordinates: [118.0894, 24.4798], kind: 'target' },
  { name: '福州', coordinates: [119.2965, 26.0745], kind: 'target' },
  { name: '哈尔滨', coordinates: [126.6424, 45.7567], kind: 'source' },
  { name: '南京', coordinates: [118.7969, 32.0603], kind: 'target' },
  { name: '杭州', coordinates: [120.1551, 30.2741], kind: 'target' },
  { name: '西安', coordinates: [108.9398, 34.3416], kind: 'source' },
  { name: '武汉', coordinates: [114.3054, 30.5931], kind: 'target' },
  { name: '昆明', coordinates: [102.8329, 24.8801], kind: 'source' },
  { name: '深圳', coordinates: [114.0579, 22.5431], kind: 'target' },
  { name: '上海', coordinates: [121.4737, 31.2304], kind: 'target' }
];

export const outletNodes = [
  { name: '广州天河支行', coordinates: [113.3615, 23.1247], kind: 'source' },
  { name: '福州鼓楼网点', coordinates: [119.3035, 26.0821], kind: 'target' },
  { name: '厦门思明网点', coordinates: [118.1102, 24.4728], kind: 'target' },
  { name: '哈尔滨道里网点', coordinates: [126.6221, 45.7588], kind: 'source' },
  { name: '南京玄武支行', coordinates: [118.8024, 32.0658], kind: 'target' },
  { name: '杭州西湖网点', coordinates: [120.1408, 30.2596], kind: 'target' },
  { name: '西安雁塔网点', coordinates: [108.9486, 34.2305], kind: 'source' },
  { name: '武汉武昌支行', coordinates: [114.3162, 30.5548], kind: 'target' },
  { name: '昆明盘龙网点', coordinates: [102.7336, 25.0484], kind: 'source' },
  { name: '深圳南山支行', coordinates: [113.9304, 22.5333], kind: 'target' },
  { name: '上海浦东网点', coordinates: [121.5441, 31.2215], kind: 'target' }
];

export const globalNodes = [
  { name: '中国', coordinates: [104.0, 35.0], kind: 'source' },
  { name: '新加坡', coordinates: [103.8198, 1.3521], kind: 'target' },
  { name: '英国', coordinates: [-1.5, 52.4], kind: 'target' },
  { name: '阿联酋', coordinates: [54.3773, 24.4539], kind: 'target' },
  { name: '美国', coordinates: [-98.5795, 39.8283], kind: 'target' }
];

export const provinceNodes = [
  { name: '北京', coordinates: [116.4, 39.9], kind: 'source' },
  { name: '陕西', coordinates: [108.9, 34.3], kind: 'source' },
  { name: '云南', coordinates: [102.7, 25.0], kind: 'source' },
  { name: '福建', coordinates: [119.3, 26.1], kind: 'target' },
  { name: '江苏', coordinates: [118.8, 32.0], kind: 'target' },
  { name: '湖北', coordinates: [112.3, 30.9], kind: 'target' },
  { name: '广东', coordinates: [113.3, 23.1], kind: 'target' },
  { name: '上海', coordinates: [121.47, 31.23], kind: 'target' }
];

export const darkMapStyle = {
  version: 8,
  name: 'elder-fin-dark',
  sources: {
    'carto-dark': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
      ],
      tileSize: 256,
      attribution: 'OpenStreetMap contributors, CARTO'
    }
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#06111f'
      }
    },
    {
      id: 'carto-dark-layer',
      type: 'raster',
      source: 'carto-dark',
      paint: {
        'raster-opacity': 0.42,
        'raster-saturation': -0.75,
        'raster-contrast': 0.08,
        'raster-brightness-max': 0.52
      }
    }
  ]
};

export function getEventEndpoints(event, sceneLevel) {
  if (sceneLevel === 'global') return { source: event.globalSource, target: event.globalTarget };
  if (sceneLevel === 'province') return { source: event.provinceSource, target: event.provinceTarget };
  if (sceneLevel === 'city') return { source: event.citySource, target: event.cityTarget };
  return { source: event.outletSource, target: event.outletTarget };
}

export function getSceneNodes(sceneLevel) {
  if (sceneLevel === 'global') return globalNodes;
  if (sceneLevel === 'province') return provinceNodes;
  if (sceneLevel === 'city') return cityNodes;
  return outletNodes;
}

export function getSceneGeoJson(sceneLevel, geoCollections) {
  if (sceneLevel === 'global') return geoCollections?.worldGeoJson || null;
  if (sceneLevel === 'province') return geoCollections?.provinceGeoJson || null;
  return null;
}

export function getSceneViewState(sceneLevel) {
  if (sceneLevel === 'global') return { longitude: 68, latitude: 26, zoom: 1.85, pitch: 12, bearing: 0 };
  if (sceneLevel === 'province') return { longitude: 108, latitude: 31, zoom: 4.6, pitch: 25, bearing: 0 };
  if (sceneLevel === 'city') return { longitude: 113.8, latitude: 29.8, zoom: 6.8, pitch: 30, bearing: 0 };
  return { longitude: 114.0, latitude: 28.8, zoom: 9.2, pitch: 40, bearing: 0 };
}

export function getFilteredEvents(events, timeWindow) {
  const meta = timeWindowMeta[timeWindow] || timeWindowMeta.all;
  return events.filter((event) => event.minutesAgo <= meta.maxMinutes);
}

export function getEventTimeline(event) {
  return event?.timeline || [];
}

export function getSceneRegionNames(event, sceneLevel) {
  if (!event) return [];
  const endpoints = getEventEndpoints(event, sceneLevel);
  return [endpoints.source?.name, endpoints.target?.name].filter(Boolean);
}