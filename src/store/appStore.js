import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const LEGACY_ALERTS_KEY = 'mvpAlertRecords';
const LEGACY_CONTACTS_KEY = 'mvpFamilyContacts';
const LEGACY_ROLE_KEY = 'elderFinCurrentRole';
const APP_STORE_KEY = 'elderFinAppStore';

const seededAlerts = [
  { time: '2026-03-08 09:12', source: '风险检测', content: '高发诈骗：公检法安全账户转账提示', level: 'high', advice: '极危，建议立即停止操作并通知家属。' },
  { time: '2026-03-08 10:05', source: '大额转账', content: '向陌生账户连续汇款 50,000 元', level: 'high', advice: '已建议人工干预和家属确认。' },
  { time: '2026-03-08 10:21', source: '理财陪伴', content: '年化 15% 保本高息理财咨询', level: 'high', advice: '高度可疑，建议不要继续沟通。' },
  { time: '2026-03-08 10:40', source: '理财陪伴', content: '稳健型定存咨询', level: 'low', advice: '可继续了解，但仍需核实产品来源。' },
  { time: '2026-03-08 11:18', source: '短信预警', content: '收到积分清零链接，诱导下载陌生 App', level: 'medium', advice: '不要点击链接，优先联系家属或官方客服核实。' },
  { time: '2026-03-08 14:06', source: '账户守护', content: '异地登录后尝试提升转账额度 80,000 元', level: 'high', advice: '建议立即冻结高风险操作并启动人工复核。' },
  { time: '2026-03-08 16:22', source: '理财陪伴', content: '养老备用金改投短债基金咨询', level: 'low', advice: '风险较低，可继续了解期限、赎回规则和管理费。' }
];

const seededContacts = [
  { name: '李明', relation: '儿子', phone: '13800000001' },
  { name: '王芳', relation: '女儿', phone: '13900000002' },
  { name: '社区联络员', relation: '社区', phone: '13700000003' }
];

const seededOutreachLogs = [
  {
    id: 'seed-outreach-1',
    time: '2026-03-08 10:32',
    alertContent: '向陌生账户连续汇款 50,000 元',
    contactName: '李明',
    status: 'stopped',
    note: '已电话确认，老人已停止继续汇款，准备到网点核查。'
  },
  {
    id: 'seed-outreach-2',
    time: '2026-03-08 14:18',
    alertContent: '异地登录后尝试提升转账额度 80,000 元',
    contactName: '王芳',
    status: 'high-risk',
    note: '家属已联系老人，确认并非本人操作，建议立即冻结高风险功能。'
  }
];

function parseJsonSafely(value, fallback) {
  try {
    return JSON.parse(value ?? JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function readLegacyState() {
  if (typeof window === 'undefined') {
    return {
      role: '',
      alerts: seededAlerts,
        contacts: seededContacts,
        outreachLogs: seededOutreachLogs
    };
  }

  const alerts = parseJsonSafely(window.localStorage.getItem(LEGACY_ALERTS_KEY), []);
  const contacts = parseJsonSafely(window.localStorage.getItem(LEGACY_CONTACTS_KEY), []);
  const role = window.localStorage.getItem(LEGACY_ROLE_KEY) || '';

  return {
    role,
    alerts: alerts.length ? alerts : seededAlerts,
    contacts: contacts.length ? contacts : seededContacts,
    outreachLogs: seededOutreachLogs
  };
}

function buildRecordPatch() {
  return { lastUpdatedAt: Date.now() };
}

function sanitizeContact(contact) {
  return {
    name: String(contact.name || '').trim(),
    relation: String(contact.relation || '').trim(),
    phone: String(contact.phone || '').trim()
  };
}

function sanitizeOutreachLog(log) {
  return {
    id: String(log.id || `outreach-${Date.now()}`),
    time: String(log.time || '').trim(),
    alertContent: String(log.alertContent || '').trim(),
    contactName: String(log.contactName || '').trim(),
    status: String(log.status || 'pending').trim(),
    note: String(log.note || '').trim()
  };
}

const legacyState = readLegacyState();

export const useAppStore = create(
  persist(
    (set) => ({
      role: legacyState.role,
      alerts: legacyState.alerts,
      contacts: legacyState.contacts,
      outreachLogs: legacyState.outreachLogs,
      lastUpdatedAt: Date.now(),
      setRole: (role) => set(() => ({ role, ...buildRecordPatch() })),
      clearRole: () => set(() => ({ role: '', ...buildRecordPatch() })),
      addAlert: (record) =>
        set((state) => ({
          alerts: [record, ...state.alerts].slice(0, 200),
          ...buildRecordPatch()
        })),
      seedAlerts: () =>
        set((state) => {
          const nextState = {};

          if (!state.alerts.length) {
            nextState.alerts = seededAlerts;
          }

          if (!state.contacts.length) {
            nextState.contacts = seededContacts;
          }

          if (!state.outreachLogs.length) {
            nextState.outreachLogs = seededOutreachLogs;
          }

          if (!Object.keys(nextState).length) {
            return state;
          }

          return {
            ...nextState,
            ...buildRecordPatch()
          };
        }),
      addContact: (contact) =>
        set((state) => ({
          contacts: [
            ...state.contacts,
            sanitizeContact(contact)
          ],
          ...buildRecordPatch()
        })),
      deleteContact: (index) =>
        set((state) => ({
          contacts: state.contacts.filter((_, contactIndex) => contactIndex !== index),
          ...buildRecordPatch()
        })),
      addOutreachLog: (log) =>
        set((state) => ({
          outreachLogs: [
            sanitizeOutreachLog(log),
            ...state.outreachLogs
          ].slice(0, 100),
          ...buildRecordPatch()
        }))
    }),
    {
      name: APP_STORE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        role: state.role,
        alerts: state.alerts,
        contacts: state.contacts,
        outreachLogs: state.outreachLogs,
        lastUpdatedAt: state.lastUpdatedAt
      }),
      onRehydrateStorage: () => (state) => {
        if (!state || typeof window === 'undefined') {
          return;
        }

        window.localStorage.setItem(LEGACY_ROLE_KEY, state.role || '');
        window.localStorage.setItem(LEGACY_ALERTS_KEY, JSON.stringify(state.alerts || []));
        window.localStorage.setItem(LEGACY_CONTACTS_KEY, JSON.stringify(state.contacts || []));
      }
    }
  )
);

useAppStore.subscribe((state) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(LEGACY_ROLE_KEY, state.role || '');
  window.localStorage.setItem(LEGACY_ALERTS_KEY, JSON.stringify(state.alerts || []));
  window.localStorage.setItem(LEGACY_CONTACTS_KEY, JSON.stringify(state.contacts || []));
});

export function getAppStateSnapshot() {
  return useAppStore.getState();
}
