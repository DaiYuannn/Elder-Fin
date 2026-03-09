import chinaUrl from '../data/geo/country-chn.geo.json?url';
import uaeUrl from '../data/geo/country-are.geo.json?url';
import ukUrl from '../data/geo/country-gbr.geo.json?url';
import usaUrl from '../data/geo/country-usa.geo.json?url';
import beijingUrl from '../data/geo/province-beijing.geo.json?url';
import fujianUrl from '../data/geo/province-fujian.geo.json?url';
import guangdongUrl from '../data/geo/province-guangdong.geo.json?url';
import hubeiUrl from '../data/geo/province-hubei.geo.json?url';
import jiangsuUrl from '../data/geo/province-jiangsu.geo.json?url';
import shaanxiUrl from '../data/geo/province-shaanxi.geo.json?url';
import shanghaiUrl from '../data/geo/province-shanghai.geo.json?url';
import yunnanUrl from '../data/geo/province-yunnan.geo.json?url';
import zhejiangUrl from '../data/geo/province-zhejiang.geo.json?url';

function parseFeatureCollection(data) {
  if (data.type === 'FeatureCollection') {
    return data.features;
  }

  if (data.type === 'Feature') {
    return [data];
  }

  return [];
}

async function fetchGeoJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`GeoJSON load failed: ${response.status}`);
  }

  return response.json();
}

function withProperties(features, properties) {
  return features.map((feature, index) => ({
    ...feature,
    id: feature.id || `${properties.name}-${index}`,
    properties: {
      ...feature.properties,
      ...properties
    }
  }));
}

const singaporeFeature = {
  type: 'Feature',
  id: '新加坡-0',
  properties: {
    name: '新加坡',
    risk: 0.86
  },
  geometry: {
    type: 'Polygon',
    coordinates: [[
      [103.603, 1.216],
      [103.741, 1.194],
      [103.91, 1.255],
      [103.96, 1.349],
      [103.877, 1.429],
      [103.723, 1.442],
      [103.596, 1.368],
      [103.603, 1.216]
    ]]
  }
};

const worldSources = [
  { url: chinaUrl, properties: { name: '中国', risk: 0.72 } },
  { url: ukUrl, properties: { name: '英国', risk: 0.51 } },
  { url: uaeUrl, properties: { name: '阿联酋', risk: 0.42 } },
  { url: usaUrl, properties: { name: '美国', risk: 0.48 } }
];

const provinceSources = [
  { url: beijingUrl, properties: { name: '北京', risk: 0.48 } },
  { url: shaanxiUrl, properties: { name: '陕西', risk: 0.39 } },
  { url: hubeiUrl, properties: { name: '湖北', risk: 0.63 } },
  { url: jiangsuUrl, properties: { name: '江苏', risk: 0.74 } },
  { url: shanghaiUrl, properties: { name: '上海', risk: 0.81 } },
  { url: zhejiangUrl, properties: { name: '浙江', risk: 0.59 } },
  { url: fujianUrl, properties: { name: '福建', risk: 0.92 } },
  { url: guangdongUrl, properties: { name: '广东', risk: 0.83 } },
  { url: yunnanUrl, properties: { name: '云南', risk: 0.36 } }
];

let geoCollectionsPromise;

async function loadFeatures(sources) {
  const collections = await Promise.all(
    sources.map(async ({ url, properties }) => {
      const data = await fetchGeoJson(url);
      return withProperties(parseFeatureCollection(data), properties);
    })
  );

  return collections.flat();
}

export async function loadGeoCollections() {
  if (!geoCollectionsPromise) {
    geoCollectionsPromise = Promise.all([loadFeatures(worldSources), loadFeatures(provinceSources)]).then(
      ([worldFeatures, provinceFeatures]) => ({
        worldGeoJson: {
          type: 'FeatureCollection',
          features: [...worldFeatures, singaporeFeature]
        },
        provinceGeoJson: {
          type: 'FeatureCollection',
          features: provinceFeatures
        }
      })
    );
  }

  return geoCollectionsPromise;
}