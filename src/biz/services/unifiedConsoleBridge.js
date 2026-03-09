import { getAppStateSnapshot } from '../../store/appStore';
import { consoleEvents } from '../mock/consoleData';

function parseTimeToMinutesAgo(timeValue, fallbackMinutes) {
  const timestamp = Date.parse(String(timeValue || '').replace(' ', 'T'));
  if (Number.isNaN(timestamp)) return fallbackMinutes;
  const diffMinutes = Math.round((Date.now() - timestamp) / 60000);
  return Math.max(1, diffMinutes);
}

function parseAmountValue(content, fallbackAmount) {
  const match = String(content || '').match(/(\d[\d,]*)/);
  if (!match) return fallbackAmount;
  const parsed = Number(match[1].replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : fallbackAmount;
}

function resolveStatus(level, hasContacts) {
  if (!hasContacts) return '待绑定家属';
  if (level === '高危') return '二次外呼中';
  if (level === '中危') return '已送达待回执';
  return '已归档观察';
}

function resolveTrend(level, index) {
  if (level === '高危') return index % 2 === 0 ? '升温' : '新近激活';
  if (level === '中危') return '持平';
  return '降温';
}

function resolveOutreachStatusLabel(status) {
  if (status === 'pending') return '待联系';
  if (status === 'no-answer') return '已联系未接通';
  if (status === 'safe') return '已确认安全';
  if (status === 'high-risk') return '已确认高风险';
  if (status === 'stopped') return '已协助停止操作';
  return '待补充确认';
}

function resolveFamilyStatus(level, hasContacts, outreachLog) {
  if (!hasContacts) return '待绑定';
  if (outreachLog) return resolveOutreachStatusLabel(outreachLog.status);
  if (level === '高危') return '待回执';
  if (level === '中危') return '二次外呼';
  return '已确认';
}

function resolveFamilyChannel(hasContacts, outreachLog) {
  if (!hasContacts) return '未绑定渠道';
  if (outreachLog) return `电话确认 · ${outreachLog.contactName || '家属'}`;
  return '短信 + 电话';
}

function pickOutreachLog(alert, outreachLogs, contacts, index) {
  if (!Array.isArray(outreachLogs) || outreachLogs.length === 0) {
    return null;
  }

  const matchedByContent = outreachLogs.find((item) => item.alertContent === alert.content);
  if (matchedByContent) {
    return matchedByContent;
  }

  const contactName = contacts[index % Math.max(contacts.length, 1)]?.name;
  if (contactName) {
    return outreachLogs.find((item) => item.contactName === contactName) || null;
  }

  return outreachLogs[0] || null;
}

function mapAlertLevel(level) {
  if (level === 'high') return '高危';
  if (level === 'medium') return '中危';
  return '低危';
}

function pickFallbackEvent(alert, index) {
  const sourceText = `${alert.source || ''} ${alert.content || ''}`;
  if (/理财|基金|收益/i.test(sourceText)) return consoleEvents[1];
  if (/短信|链接|下载/i.test(sourceText)) return consoleEvents[index % 2 === 0 ? 2 : 3];
  return consoleEvents[index % consoleEvents.length];
}

function buildTimeline(alert, advice, minutesAgo, outreachLog) {
  const timeline = [
    { label: '风险上报', detail: `${alert.source || '系统检测'}已进入统一事件流`, minutesAgo },
    { label: '内容摘要', detail: alert.content || '暂无内容摘要', minutesAgo: Math.max(1, minutesAgo - 4) },
    { label: '处置建议', detail: advice || '等待补充建议', minutesAgo: Math.max(1, minutesAgo - 10) }
  ];

  if (outreachLog) {
    timeline.push({
      label: '家属确认',
      detail: `${resolveOutreachStatusLabel(outreachLog.status)}：${outreachLog.note || '已记录外呼结果，等待后续补充。'}`,
      minutesAgo: parseTimeToMinutesAgo(outreachLog.time, Math.max(1, minutesAgo - 2))
    });
  }

  return timeline;
}

function mapAlertToConsoleEvent(alert, index, contacts, outreachLogs) {
  const fallback = pickFallbackEvent(alert, index);
  const familyContact = contacts[index % Math.max(contacts.length, 1)] || null;
  const level = mapAlertLevel(alert.level);
  const amountValue = parseAmountValue(alert.content, fallback.amountValue);
  const minutesAgo = parseTimeToMinutesAgo(alert.time, fallback.minutesAgo);
  const hasContacts = contacts.length > 0;
  const outreachLog = pickOutreachLog(alert, outreachLogs, contacts, index);
  const familyName = familyContact?.name || fallback.familyCase.replace('家庭协作', '');
  const relation = familyContact?.relation || '家属';
  const familyStatus = resolveFamilyStatus(level, hasContacts, outreachLog);
  const familyChannel = resolveFamilyChannel(hasContacts, outreachLog);
  const summary = `${alert.source || fallback.source}：${alert.content || fallback.summary}。${alert.advice || '建议进一步核验'}`;

  return {
    ...fallback,
    id: `EF-L-${String(index + 1).padStart(3, '0')}`,
    minutesAgo,
    area: fallback.area,
    amountValue,
    amount: `¥${amountValue.toLocaleString()}`,
    level,
    source: alert.source || fallback.source,
    status: resolveStatus(level, hasContacts),
    trend: resolveTrend(level, index),
    familyCase: `${familyName}${relation === '家属' ? '' : ` · ${relation}`}家庭协作`,
    familyStatus,
    familyChannel,
    outreachStatus: outreachLog ? resolveOutreachStatusLabel(outreachLog.status) : '未记录确认结果',
    outreachNote: outreachLog?.note || '',
    outreachUpdatedAt: outreachLog?.time || '',
    outreachContact: outreachLog?.contactName || familyName,
    summary,
    timeline: buildTimeline(alert, alert.advice, minutesAgo, outreachLog)
  };
}

export function buildLocalConsoleSnapshot() {
  const { alerts, contacts, outreachLogs } = getAppStateSnapshot();

  if (!alerts.length) {
    return {
      mode: 'mock',
      transport: 'mock',
      timestamp: new Date().toISOString(),
      events: consoleEvents
    };
  }

  return {
    mode: 'local',
    transport: 'local-storage',
    timestamp: new Date().toISOString(),
    events: alerts.map((alert, index) => mapAlertToConsoleEvent(alert, index, contacts, outreachLogs || []))
  };
}