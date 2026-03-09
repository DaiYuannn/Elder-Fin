import { getAppStateSnapshot, useAppStore } from '../store/appStore';

export function getStoredAlerts() {
  return getAppStateSnapshot().alerts;
}

export function saveAlerts(alerts) {
  useAppStore.setState((state) => ({
    ...state,
    alerts,
    lastUpdatedAt: Date.now()
  }));
}

export function getContacts() {
  return getAppStateSnapshot().contacts;
}

export function saveContacts(contacts) {
  useAppStore.setState((state) => ({
    ...state,
    contacts,
    lastUpdatedAt: Date.now()
  }));
}

export function addContact(contact) {
  getAppStateSnapshot().addContact(contact);
}

export function deleteContact(index) {
  getAppStateSnapshot().deleteContact(index);
}

export function addAlertRecord(record) {
  getAppStateSnapshot().addAlert(record);
}

export function ensureSeedAlerts() {
  getAppStateSnapshot().seedAlerts();
}

export function setCurrentRole(role) {
  getAppStateSnapshot().setRole(role);
}

export function getCurrentRole() {
  return getAppStateSnapshot().role;
}

export function clearCurrentRole() {
  getAppStateSnapshot().clearRole();
}

export function getRoleLabel(role) {
  if (role === 'elder') return '老年用户';
  if (role === 'family') return '家属用户';
  if (role === 'biz') return 'B 端用户';
  return '未登录';
}

export function scoreRisk(text) {
  const value = String(text || '');

  if (/(高收益|保本高息|安全账户|公检法|验证码)/i.test(value)) {
    return {
      level: 'high',
      label: '高风险极危',
      advice: '立即停止操作，不要转账，不要提供验证码，并尽快联系家属。'
    };
  }

  if (/(限时|点击链接|下载|补贴)/i.test(value)) {
    return {
      level: 'medium',
      label: '中风险预警',
      advice: '存在诱导特征，建议先核实身份来源，再决定是否继续。'
    };
  }

  return {
    level: 'low',
    label: '暂未发现明显风险',
    advice: '当前未命中明显高危词，但仍建议通过官方渠道再次确认。'
  };
}

export function recommendFinance({ goal, horizon, risk, note }) {
  const suspicious = /(高收益|保本|稳赚|年化8|年化10|返息)/i.test(String(note || ''));

  if (suspicious) {
    return {
      tone: 'high',
      label: '先停一停',
      summary: '你当前关注的产品话术带有高收益或保本承诺，建议先核验资质，不要急着投入。',
      warning: '凡是强调稳赚、保本高息的产品，都应优先当作高风险对象处理。'
    };
  }

  if (goal === 'daily' || goal === 'medical' || risk === 'low' || horizon === 'short') {
    return {
      tone: 'low',
      label: '稳健保守',
      summary: '优先考虑银行存款、国债、低波动现金管理类产品，确保资金随取随用。',
      warning: '养老和医疗资金不适合追求高收益，应优先保证本金安全和流动性。'
    };
  }

  if (goal === 'growth' && horizon === 'long' && risk === 'high') {
    return {
      tone: 'medium',
      label: '审慎增值',
      summary: '可以在充分理解风险前提下少量配置波动更高的长期产品，但仍要避免复杂结构和陌生平台。',
      warning: '即使风险承受能力较高，也不建议接触来源不明、承诺过度的金融产品。'
    };
  }

  return {
    tone: 'low',
    label: '平衡配置',
    summary: '建议以稳健产品为主，少量配置中低波动长期品种，先把资金用途和流动性安排清楚。',
    warning: '不清楚的产品先不买，说明听不懂、收益看不透时应优先放弃。'
  };
}