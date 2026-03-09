function setActiveNav() {
  const current = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.main-nav a, .site-nav a, .sidebar-menu a').forEach((a) => {
    const href = a.getAttribute('href');
    if (!href || href === '#') return;
    const target = href.split('/').pop();
    if (target === current) {
      a.classList.add('active');
      const li = a.closest('li');
      if(li) li.classList.add('active');
    }
  });
}

const ALERTS_KEY = 'mvpAlertRecords';
const CONTACTS_KEY = 'mvpFamilyContacts';
const ROLE_KEY = 'elderFinCurrentRole';

const ROUTE_ROLE_MAP = {
  'detect.html': 'elder',
  'finance.html': 'elder',
  'family.html': 'elder',
  'family-dashboard.html': 'family',
  'admin.html': 'biz',
  'biz-risk-monitor.html': 'biz',
  'biz-family-flow.html': 'biz'
};

function escapeHtml(text) {
  return String(text || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[m]));
}

function formatDateTime(date) {
  const pad = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function loadAlerts() { return JSON.parse(localStorage.getItem(ALERTS_KEY) || '[]'); }
function saveAlerts(alerts) { localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts)); }
function loadContacts() { return JSON.parse(localStorage.getItem(CONTACTS_KEY) || '[]'); }
function saveContacts(contacts) { localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts)); }

function ensureSeedAlerts() {
  const data = loadAlerts();
  if (data.length) return;
  saveAlerts([
    { time: '2026-03-08 09:12', source: '风险检测', content: '高发诈骗：公检法安全账户转账提示', level: 'high', advice: '极危！正在人工外呼干预' },
    { time: '2026-03-08 10:05', source: '大额转账', content: '向陌生账户连续汇款 50,000元', level: 'high', advice: '已强制阻断，等待家属确认' },
    { time: '2026-03-08 10:21', source: '理财陪伴', content: '年化15%保本高息理财咨询', level: 'high', advice: '已发送防骗科普视频至设备' },
    { time: '2026-03-08 10:40', source: '理财陪伴', content: '稳健型定存咨询 (四大行)', level: 'low', advice: '已登记正常需求' }
  ]);
}

function addAlertRecord(record) {
  const alerts = loadAlerts();
  alerts.unshift(record);
  saveAlerts(alerts.slice(0, 200));
}

function scoreRisk(text) {
  if (/(高收益|保本高息|安全账户|公检法|验证码)/i.test(text)) return { level: 'high', label: '高风险极危', advice: '立即停止操作！已同步家属并冻结相关功能！' };
  if (/(限时|点击链接|下载|补贴)/i.test(text)) return { level: 'medium', label: '中风险预警', advice: '存在诱导特征，请先核实对方真实身份。' };
  return { level: 'low', label: '安全', advice: '暂未发现明显风险，可继续操作。' };
}

function bindDetectForm() {
  const form = document.getElementById('detect-form');
  const output = document.getElementById('detect-output');
  if (!form || !output) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('risk-text').value.trim();
    if (!input) return;
    const result = scoreRisk(input);
    addAlertRecord({ time: formatDateTime(new Date()), source: '检测器', content: input, level: result.level, advice: result.advice });
    output.innerHTML = `
      <div class="result ${result.level}" style="animation: slideDown 0.3s ease-out">
        <p style="font-size: 1.4rem; font-weight: bold;">分析结论：<span class="tag ${result.level}" style="font-size:1.4rem;">${result.label}</span></p>
        <p style="font-size: 1.3rem; margin-top: 1rem;"><strong>处置建议：</strong>${result.advice}</p>
        <p style="margin-top: 1rem;"><a href="admin.html" class="btn btn-outline btn-sm">查看干预中心调度记录</a></p>
      </div>`;
  });
}

function bindFamilyForm() {
  const form = document.getElementById('family-form');
  const list = document.getElementById('family-list');
  if (!form || !list) return;
  function render() {
    const contacts = loadContacts();
    list.innerHTML = contacts.length ? contacts.map((c, i) => `
      <div class="card" style="margin:1rem 0; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size: 1.4rem; font-weight: bold;">${escapeHtml(c.name)} <span class="tag low" style="margin-left:0.5rem">${escapeHtml(c.relation)}</span></div>
          <div style="font-size: 1.2rem; color: var(--text-muted); margin-top:0.5rem;">接收预警电话：${escapeHtml(c.phone)}</div>
        </div>
        <button class="btn btn-outline" data-del="${i}">取消授权</button>
      </div>
    `).join('') : '<p class="text-muted" style="font-size:1.2rem;">尚未配置家属协同，建议立即添加。</p>';
    list.querySelectorAll('[data-del]').forEach(btn => {
      btn.addEventListener('click', () => {
        const contacts = loadContacts();
        contacts.splice(Number(btn.getAttribute('data-del')), 1);
        saveContacts(contacts);
        render();
      });
    });
  }
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('family-name').value.trim();
    const relation = document.getElementById('family-relation').value.trim();
    const phone = document.getElementById('family-phone').value.trim();
    if (!name || !relation || !phone) return;
    const contacts = loadContacts();
    contacts.push({ name, relation, phone });
    saveContacts(contacts);
    form.reset();
    render();
  });
  render();
}

function bindAdminPage() {
  const bodyEl = document.getElementById('admin-alert-body');
  if (!bodyEl) return;
  function render() {
    const alerts = loadAlerts();
    const highCount = alerts.filter(i => i.level === 'high').length;
    const protectedFunds = highCount * 58000 + 126000;
    const suspiciousFunds = alerts.length * 19200 + 38000;
    const familySynced = Math.max(8, highCount * 2);
    const highRate = alerts.length ? `${Math.round((highCount / alerts.length) * 100)}%` : '0%';

    // 更新数据大盘
    ['stat-total','stat-high'].forEach(id => {
      const el = document.getElementById(id);
      if(el) el.textContent = id==='stat-total' ? alerts.length + 158 : highCount + 12;
    });
    const statProtectedFunds = document.getElementById('stat-protected-funds');
    const statSuspiciousFunds = document.getElementById('stat-suspicious-funds');
    const statFamilySynced = document.getElementById('stat-family-synced');
    const summaryProtected = document.getElementById('summary-protected');
    const summarySuspicious = document.getElementById('summary-suspicious');
    const summaryHighRate = document.getElementById('summary-high-rate');
    if (statProtectedFunds) statProtectedFunds.textContent = `¥${protectedFunds.toLocaleString()}`;
    if (statSuspiciousFunds) statSuspiciousFunds.textContent = `¥${suspiciousFunds.toLocaleString()}`;
    if (statFamilySynced) statFamilySynced.textContent = `${familySynced}件`;
    if (summaryProtected) summaryProtected.textContent = `¥${protectedFunds.toLocaleString()}`;
    if (summarySuspicious) summarySuspicious.textContent = `¥${suspiciousFunds.toLocaleString()}`;
    if (summaryHighRate) summaryHighRate.textContent = highRate;
    
    const labelMap = { high: '极度高危', medium: '关注核验', low: '绿灯通行' };
    const classMap = { high: 'danger', medium: 'warning', low: 'success' };
    
    bodyEl.innerHTML = alerts.map(item => `
      <tr>
        <td style="font-weight:bold; color:var(--text-main);">${escapeHtml(item.time.split(' ')[1])} <span style="font-weight:normal; font-size:1rem; color:var(--text-muted)">(${item.time.split(' ')[0]})</span></td>
        <td>${escapeHtml(item.source)}</td>
        <td style="font-weight:600;">${escapeHtml(item.content)}</td>
        <td><span class="badge badge-${classMap[item.level]}">${labelMap[item.level] || '未知'}</span></td>
        <td>${item.level === 'high' ? '<button class="btn btn-sm btn-danger btn-resolve">立即指令干预</button>' : '<span class="text-muted">已自动记录</span>'}</td>
      </tr>
    `).join('');
    
    document.querySelectorAll('.btn-resolve').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if(confirm("确定向该用户家属及所在地反诈专员下发强制干预指令吗？")) {
           e.target.className = 'btn btn-sm btn-outline';
           e.target.textContent = '干预进行中...';
           e.target.disabled = true;
           e.target.closest('tr').style.backgroundColor = 'var(--success-bg)';
        }
      });
    });
  }
  const clearBtn = document.getElementById('clear-alerts-btn');
  if (clearBtn) { clearBtn.addEventListener('click', () => { saveAlerts([]); render(); }); }
  render();
}

function bindBizRiskMonitorPage() {
  const tableBody = document.getElementById('biz-risk-table-body');
  const priorityList = document.getElementById('biz-priority-list');
  const tooltip = document.getElementById('risk-map-tooltip');
  const stream = document.getElementById('map-event-stream');
  const mapCanvas = document.getElementById('risk-map-canvas');
  if (!tableBody || !priorityList) return;

  const alerts = loadAlerts();
  const highAlerts = alerts.filter((item) => item.level === 'high');
  const mediumAlerts = alerts.filter((item) => item.level === 'medium');
  const activeCount = alerts.length + 9;
  const riskAmount = highAlerts.length * 68000 + 98000;
  const reviewCount = mediumAlerts.length + 6;

  const activeEl = document.getElementById('biz-risk-active');
  const amountEl = document.getElementById('biz-risk-amount');
  const reviewEl = document.getElementById('biz-risk-review');
  const sourceSms = document.getElementById('source-sms');
  const sourceFinance = document.getElementById('source-finance');
  const sourceTransfer = document.getElementById('source-transfer');

  if (activeEl) activeEl.textContent = `${activeCount}件`;
  if (amountEl) amountEl.textContent = `¥${riskAmount.toLocaleString()}`;
  if (reviewEl) reviewEl.textContent = `${reviewCount}件`;
  if (sourceSms) sourceSms.textContent = `${Math.max(5, highAlerts.length + 2)}件`;
  if (sourceFinance) sourceFinance.textContent = `${Math.max(4, mediumAlerts.length + 3)}件`;
  if (sourceTransfer) sourceTransfer.textContent = `${Math.max(6, highAlerts.length + mediumAlerts.length + 1)}件`;

  const displayRows = alerts.slice(0, 5);
  tableBody.innerHTML = displayRows.map((item, index) => {
    const amount = item.level === 'high' ? 50000 + index * 12000 : 12000 + index * 3500;
    const status = item.level === 'high' ? '待强制干预' : item.level === 'medium' ? '待人工核验' : '已归档观察';
    const action = item.level === 'high' ? '通知坐席 + 启动家属协同' : item.level === 'medium' ? '转入产品核验池' : '保留观察样本';
    return `
      <tr>
        <td>RM-${String(index + 1).padStart(3, '0')}</td>
        <td>${escapeHtml(item.source)}</td>
        <td>¥${amount.toLocaleString()}</td>
        <td>${escapeHtml(status)}</td>
        <td>${escapeHtml(action)}</td>
      </tr>
    `;
  }).join('');

  const priorities = [
    {
      title: '优先处理大额转账型警报',
      desc: '涉及真实资金外流的事件优先级最高，应优先派给人工席位。',
      meta: '建议时限：5 分钟内'
    },
    {
      title: '将高收益理财统一纳入核验池',
      desc: '把年化异常、高息保本和养老投资话术集中核验，减少重复处置。',
      meta: '建议时限：30 分钟内'
    },
    {
      title: '优先盯防沿海与华中目标区域',
      desc: '当前态势图已出现沿海承接链路和华中拦截带，应将值班坐席优先压到这些区域。',
      meta: '已接入地图联动'
    }
  ];

  priorityList.innerHTML = priorities.map((item) => `
    <div class="priority-item">
      <strong>${item.title}</strong>
      <p>${item.desc}</p>
      <div class="priority-meta"><span>${item.meta}</span><span>监测流</span></div>
    </div>
  `).join('');

  const routeData = [
    {
      id: 'route-1',
      eventId: 'RM-001',
      from: '北京',
      to: '厦门',
      amount: '¥68,000',
      level: '高风险',
      severity: 'high',
      sourceType: 'transfer',
      province: '福建',
      family: '已同步待确认',
      desc: '老人账户在短时间内发起异地转账，目标账户已出现在黑名单相似特征池。',
      time: '09:12',
      source: '异常转账'
    },
    {
      id: 'route-2',
      eventId: 'RM-002',
      from: '成都',
      to: '上海',
      amount: '¥32,000',
      level: '中风险',
      severity: 'medium',
      sourceType: 'finance',
      province: '上海',
      family: '待短信确认',
      desc: '命中高收益养老投资营销话术，伴随陌生账户收款请求，建议先进入产品核验池。',
      time: '10:05',
      source: '高收益理财'
    },
    {
      id: 'route-3',
      eventId: 'RM-003',
      from: '广州',
      to: '福州',
      amount: '¥94,000',
      level: '高风险',
      severity: 'high',
      sourceType: 'transfer',
      province: '福建',
      family: '二次外呼中',
      desc: '夜间连续两笔转账尝试均指向异地可疑账户，需要优先强制干预。',
      time: '10:21',
      source: '夜间异常转账'
    },
    {
      id: 'route-4',
      eventId: 'RM-004',
      from: '西安',
      to: '武汉',
      amount: '¥18,000',
      level: '中风险',
      severity: 'medium',
      sourceType: 'sms',
      province: '湖北',
      family: '已送达待回执',
      desc: '检测到伪金融推广与合同诱导，尚未形成大额资金外流，但需要观察。',
      time: '10:40',
      source: '短信话术'
    },
    {
      id: 'route-5',
      eventId: 'RM-005',
      from: '哈尔滨',
      to: '南京',
      amount: '¥41,000',
      level: '高风险',
      severity: 'high',
      sourceType: 'finance',
      province: '江苏',
      family: '家属语音确认中',
      desc: '命中养老产业基金高收益承诺与跨省收款账户双重特征，已进入重点核验。',
      time: '11:08',
      source: '高收益理财'
    },
    {
      id: 'route-6',
      eventId: 'RM-006',
      from: '昆明',
      to: '深圳',
      amount: '¥22,000',
      level: '中风险',
      severity: 'medium',
      sourceType: 'sms',
      province: '广东',
      family: '待二次短信确认',
      desc: '短信话术引导点击外部开户链接，伴随设备侧下载行为，需保持观察和拦截。',
      time: '11:32',
      source: '短信话术'
    }
  ];

  const provinceRiskBaseline = {
    北京: 44,
    河北: 32,
    山东: 47,
    江苏: 71,
    上海: 68,
    浙江: 63,
    福建: 82,
    湖北: 58,
    安徽: 52,
    江西: 48,
    广东: 76,
    广西: 39,
    云南: 34,
    陕西: 36
  };

  const riskFilters = Array.from(document.querySelectorAll('[data-risk-filter]'));
  const sourceFilters = Array.from(document.querySelectorAll('[data-source-filter]'));
  const provinceSegments = Array.from(document.querySelectorAll('[data-province]'));
  const provinceChips = Array.from(document.querySelectorAll('[data-province-chip]'));
  const resetProvinceButton = document.getElementById('province-drill-reset');
  let activeRiskFilter = 'all';
  let activeSourceFilter = 'all';
  let activeProvinceFilter = 'all';
  let activeRouteId = routeData[0]?.id || '';

  const detailId = document.getElementById('risk-detail-id');
  const detailFrom = document.getElementById('risk-detail-from');
  const detailTo = document.getElementById('risk-detail-to');
  const detailAmount = document.getElementById('risk-detail-amount');
  const detailFamily = document.getElementById('risk-detail-family');
  const detailDesc = document.getElementById('risk-detail-desc');
  const detailLevel = document.getElementById('risk-detail-level');
  const mapVisibleCount = document.getElementById('map-visible-count');
  const mapHotProvince = document.getElementById('map-hot-province');
  const mapHotProvinceDesc = document.getElementById('map-hot-province-desc');
  const mapMainSource = document.getElementById('map-main-source');
  const mapMainSourceDesc = document.getElementById('map-main-source-desc');
  const mapTrendCard = document.getElementById('map-trend-card');
  const mapTrendDirection = document.getElementById('map-trend-direction');
  const mapTrendDesc = document.getElementById('map-trend-desc');
  const provinceDrillBadge = document.getElementById('province-drill-badge');
  const provinceDrillName = document.getElementById('province-drill-name');
  const provinceDrillCount = document.getElementById('province-drill-count');
  const provinceDrillHeat = document.getElementById('province-drill-heat');
  const provinceDrillSource = document.getElementById('province-drill-source');
  const provinceDrillTrend = document.getElementById('province-drill-trend');
  const provinceDrillDesc = document.getElementById('province-drill-desc');

  function getVisibleRoutes() {
    return routeData.filter((route) => {
      const matchesRisk = activeRiskFilter === 'all' || route.severity === activeRiskFilter;
      const matchesSource = activeSourceFilter === 'all' || route.sourceType === activeSourceFilter;
      const matchesProvince = activeProvinceFilter === 'all' || route.province === activeProvinceFilter;
      return matchesRisk && matchesSource && matchesProvince;
    });
  }

  function getSourceLabel(sourceType) {
    const sourceLabelMap = {
      transfer: '异常转账',
      finance: '高收益理财',
      sms: '短信话术'
    };
    return sourceLabelMap[sourceType] || sourceType;
  }

  function getRouteWeight(route) {
    const severityWeight = route.severity === 'high' ? 28 : 16;
    const sourceWeightMap = {
      transfer: 14,
      finance: 10,
      sms: 8
    };
    return severityWeight + (sourceWeightMap[route.sourceType] || 6);
  }

  function parseRouteMinutes(route) {
    const [hourText, minuteText] = String(route.time || '00:00').split(':');
    const hour = Number(hourText || 0);
    const minute = Number(minuteText || 0);
    return hour * 60 + minute;
  }

  function getHeatLevel(score) {
    if (score >= 90) return 'critical';
    if (score >= 72) return 'high';
    if (score >= 54) return 'medium';
    if (score >= 34) return 'low';
    return 'calm';
  }

  function getHeatLabel(level) {
    const map = {
      critical: '极高',
      high: '高',
      medium: '中',
      low: '低',
      calm: '平稳'
    };
    return map[level] || '平稳';
  }

  function getProvinceHeatMap(routes) {
    const heatMap = new Map();

    Object.entries(provinceRiskBaseline).forEach(([province, baseScore]) => {
      heatMap.set(province, {
        province,
        score: baseScore,
        count: 0,
        active: false,
        level: getHeatLevel(baseScore)
      });
    });

    routes.forEach((route) => {
      const current = heatMap.get(route.province) || {
        province: route.province,
        score: 26,
        count: 0,
        active: false,
        level: 'low'
      };

      current.score += getRouteWeight(route);
      current.count += 1;
      current.active = true;
      current.level = getHeatLevel(current.score);
      heatMap.set(route.province, current);
    });

    return heatMap;
  }

  function getTrendState(routes) {
    if (!routes.length) {
      return {
        direction: '暂无波动',
        state: 'flat',
        desc: '当前筛选结果为空，无法计算最近 30 分钟趋势。'
      };
    }

    const latestMinute = Math.max(...routes.map(parseRouteMinutes));
    const threshold = latestMinute - 30;
    const recentRoutes = routes.filter((route) => parseRouteMinutes(route) >= threshold);
    const previousRoutes = routes.filter((route) => parseRouteMinutes(route) < threshold);
    const recentScore = recentRoutes.reduce((sum, route) => sum + getRouteWeight(route), 0);
    const previousScore = previousRoutes.reduce((sum, route) => sum + getRouteWeight(route), 0);
    const delta = recentScore - previousScore;

    if (recentRoutes.length && !previousRoutes.length) {
      return {
        direction: '新近激活',
        state: 'up',
        desc: `最近 30 分钟新增 ${recentRoutes.length} 条链路，风险正在快速抬升。`
      };
    }

    if (!recentRoutes.length) {
      return {
        direction: '降温',
        state: 'down',
        desc: '最近 30 分钟没有新增活跃链路，当前风险热度较前序窗口回落。'
      };
    }

    if (delta >= 12) {
      return {
        direction: '升温',
        state: 'up',
        desc: `最近 30 分钟风险权重较前序窗口上升 ${delta} 分，需要提高值班强度。`
      };
    }

    if (delta <= -12) {
      return {
        direction: '降温',
        state: 'down',
        desc: `最近 30 分钟风险权重较前序窗口下降 ${Math.abs(delta)} 分，当前处置压力有所回落。`
      };
    }

    return {
      direction: '持平',
      state: 'flat',
      desc: '最近 30 分钟风险权重变化有限，整体仍保持连续监视状态。'
    };
  }

  function paintEmptyDetail() {
    if (detailId) detailId.textContent = '--';
    if (detailFrom) detailFrom.textContent = '暂无';
    if (detailTo) detailTo.textContent = '暂无';
    if (detailAmount) detailAmount.textContent = '--';
    if (detailFamily) detailFamily.textContent = '暂无';
    if (detailDesc) detailDesc.textContent = '当前筛选条件下暂无可展示线路，请切换风险等级或来源条件。';
    if (detailLevel) {
      detailLevel.textContent = '暂无数据';
      detailLevel.className = 'badge badge-primary';
    }
  }

  function paintDetail(route) {
    if (!route) {
      paintEmptyDetail();
      return;
    }
    if (detailId) detailId.textContent = route.eventId;
    if (detailFrom) detailFrom.textContent = route.from;
    if (detailTo) detailTo.textContent = route.to;
    if (detailAmount) detailAmount.textContent = route.amount;
    if (detailFamily) detailFamily.textContent = route.family;
    if (detailDesc) detailDesc.textContent = route.desc;
    if (detailLevel) {
      detailLevel.textContent = route.level;
      detailLevel.className = `badge ${route.level === '高风险' ? 'badge-danger' : 'badge-warning'}`;
    }
  }

  function updateMapInsights(routes) {
    if (mapVisibleCount) mapVisibleCount.textContent = `${routes.length} 条`;

    if (!routes.length) {
      if (mapHotProvince) mapHotProvince.textContent = '暂无';
      if (mapHotProvinceDesc) mapHotProvinceDesc.textContent = '当前筛选条件下没有活跃省份。';
      if (mapMainSource) mapMainSource.textContent = '暂无';
      if (mapMainSourceDesc) mapMainSourceDesc.textContent = '当前筛选条件下没有主导来源。';
      if (mapTrendDirection) mapTrendDirection.textContent = '暂无波动';
      if (mapTrendDesc) mapTrendDesc.textContent = '当前筛选条件下没有可计算趋势的链路。';
      if (mapTrendCard) mapTrendCard.className = 'map-intel-card map-intel-card-trend-flat';
      return;
    }

    const provinceHeatMap = getProvinceHeatMap(routes);
    const sourceCountMap = new Map();
    const trendState = getTrendState(routes);
    routes.forEach((route) => {
      sourceCountMap.set(route.sourceType, (sourceCountMap.get(route.sourceType) || 0) + 1);
    });

    const topProvinceData = Array.from(provinceHeatMap.values())
      .filter((item) => item.active)
      .sort((a, b) => b.score - a.score)[0];
    const [topSource, topSourceCount] = Array.from(sourceCountMap.entries()).sort((a, b) => b[1] - a[1])[0];

    if (mapHotProvince) mapHotProvince.textContent = topProvinceData.province;
    if (mapHotProvinceDesc) mapHotProvinceDesc.textContent = `${topProvinceData.count} 条链路叠加后，该省风险热度达到 ${topProvinceData.score} 分，等级为${getHeatLabel(topProvinceData.level)}，应优先安排席位联动。`;
    if (mapMainSource) mapMainSource.textContent = getSourceLabel(topSource);
    if (mapMainSourceDesc) mapMainSourceDesc.textContent = `${topSourceCount} 条链路命中该类来源，是当前最主要的风险触发入口。`;
    if (mapTrendDirection) mapTrendDirection.textContent = trendState.direction;
    if (mapTrendDesc) mapTrendDesc.textContent = trendState.desc;
    if (mapTrendCard) {
      mapTrendCard.className = `map-intel-card map-intel-card-trend-${trendState.state}`;
    }
  }

  function updateProvinceVisuals(routes) {
    const visibleProvinceSet = new Set(routes.map((route) => route.province));
    const provinceHeatMap = getProvinceHeatMap(routes);

    function applyHeatClass(element, level) {
      ['critical', 'high', 'medium', 'low', 'calm'].forEach((heatLevel) => {
        element.classList.toggle(`heat-${heatLevel}`, heatLevel === level);
      });
    }

    provinceSegments.forEach((segment) => {
      const province = segment.getAttribute('data-province') || '';
      const heat = provinceHeatMap.get(province) || { level: 'calm', active: false };
      const isVisible = activeProvinceFilter === 'all' ? true : visibleProvinceSet.has(province);
      segment.classList.toggle('is-active', province === activeProvinceFilter);
      segment.classList.toggle('is-muted', !isVisible);
      applyHeatClass(segment, heat.level);
      segment.setAttribute('data-heat', heat.level);
      segment.setAttribute('data-score', String(heat.score || 0));
    });

    document.querySelectorAll('.risk-halo[data-province]').forEach((halo) => {
      const province = halo.getAttribute('data-province') || '';
      const isVisible = activeProvinceFilter === 'all' ? true : visibleProvinceSet.has(province);
      halo.classList.toggle('is-active', province === activeProvinceFilter);
      halo.classList.toggle('is-muted', !isVisible);
    });

    provinceChips.forEach((chip) => {
      const province = chip.getAttribute('data-province-chip') || '';
      const isVisible = activeProvinceFilter === 'all' ? true : visibleProvinceSet.has(province);
      const heat = provinceHeatMap.get(province) || { level: 'calm', count: 0 };
      chip.classList.toggle('is-active', province === activeProvinceFilter);
      chip.classList.toggle('is-hidden', !isVisible);
      chip.dataset.heat = heat.level;
      chip.dataset.count = String(heat.count || '');
      chip.title = `${province} 风险热度 ${getHeatLabel(heat.level)} / ${heat.score || 0} 分`;
    });
  }

  function updateProvinceDrilldown(routes) {
    if (!provinceDrillBadge || !provinceDrillName || !provinceDrillCount || !provinceDrillHeat || !provinceDrillSource || !provinceDrillDesc) return;

    if (!routes.length) {
      provinceDrillBadge.textContent = activeProvinceFilter === 'all' ? '全国视角' : '钻取为空';
      provinceDrillBadge.className = 'badge badge-primary';
      provinceDrillName.textContent = activeProvinceFilter === 'all' ? '全国' : activeProvinceFilter;
      provinceDrillCount.textContent = '0 条';
      provinceDrillHeat.textContent = '低';
      provinceDrillSource.textContent = '暂无';
      if (provinceDrillTrend) provinceDrillTrend.textContent = '暂无波动';
      provinceDrillDesc.textContent = '当前省份与筛选条件组合下暂无链路，建议切换来源或返回全国视角。';
      return;
    }

    const sourceCountMap = new Map();
    routes.forEach((route) => {
      sourceCountMap.set(route.sourceType, (sourceCountMap.get(route.sourceType) || 0) + 1);
    });
    const provinceHeatMap = getProvinceHeatMap(routes);
    const trendState = getTrendState(routes);
    const [topSource] = Array.from(sourceCountMap.entries()).sort((a, b) => b[1] - a[1])[0];
    const provinceName = activeProvinceFilter === 'all' ? '全国' : activeProvinceFilter;
    const provinceHeat = activeProvinceFilter === 'all'
      ? Array.from(provinceHeatMap.values()).filter((item) => item.active).sort((a, b) => b.score - a.score)[0]
      : provinceHeatMap.get(activeProvinceFilter);
    const heat = provinceHeat ? `${getHeatLabel(provinceHeat.level)} / ${provinceHeat.score} 分` : '平稳';

    provinceDrillBadge.textContent = activeProvinceFilter === 'all' ? '全国视角' : '省份钻取中';
    provinceDrillBadge.className = `badge ${activeProvinceFilter === 'all' ? 'badge-primary' : 'badge-warning'}`;
    provinceDrillName.textContent = provinceName;
    provinceDrillCount.textContent = `${routes.length} 条`;
    provinceDrillHeat.textContent = heat;
    provinceDrillSource.textContent = getSourceLabel(topSource);
    if (provinceDrillTrend) provinceDrillTrend.textContent = trendState.direction;
    provinceDrillDesc.textContent = activeProvinceFilter === 'all'
      ? '当前为全国总览视角，可点击省域块进入单省钻取，查看该区域链路和处置优先级。'
      : `${provinceName} 当前共有 ${routes.length} 条活跃链路，主要由${getSourceLabel(topSource)}驱动，综合热度为 ${heat}，最近 30 分钟呈${trendState.direction}态势，建议将坐席优先压向该省份关联账户与目标地区。`;
  }

  function setProvinceFilter(province) {
    activeProvinceFilter = province || 'all';
    renderByFilters(activeRouteId);
  }

  function renderStream(routes) {
    if (!stream) return;

    if (!routes.length) {
      stream.innerHTML = `
        <div class="priority-item">
          <strong>当前筛选结果为空</strong>
          <p>没有匹配当前风险等级与来源条件的监测线路，请切换筛选后再查看。</p>
          <div class="priority-meta"><span>地图联动</span><span>等待条件调整</span></div>
        </div>
      `;
      return;
    }

    stream.innerHTML = routes.map((route) => `
      <button class="map-event-card" type="button" data-route-select="${route.id}">
        <span class="map-event-time">${route.time}</span>
        <span>
          <strong>${route.from} -> ${route.to}</strong>
          <p>${route.source} / ${route.desc}</p>
        </span>
        <span>${route.amount}</span>
        <span class="badge ${route.level === '高风险' ? 'badge-danger' : 'badge-warning'}">${route.level}</span>
      </button>
    `).join('');
  }

  function bindStreamButtons() {
    document.querySelectorAll('[data-route-select]').forEach((button) => {
      button.addEventListener('click', () => {
        setActiveRoute(button.getAttribute('data-route-select') || '');
      });
    });
  }

  function syncRouteVisibility(routes) {
    const visibleIds = new Set(routes.map((route) => route.id));

    document.querySelectorAll('.risk-route').forEach((pathEl) => {
      const isVisible = visibleIds.has(pathEl.id);
      pathEl.classList.toggle('is-hidden', !isVisible);
      pathEl.classList.toggle('is-active', isVisible && pathEl.id === activeRouteId);
    });

    document.querySelectorAll('.risk-node').forEach((nodeEl) => {
      const routeId = nodeEl.getAttribute('data-route') || '';
      nodeEl.classList.toggle('is-hidden', !visibleIds.has(routeId));
    });
  }

  function updateFilterButtons(buttons, value, attrName) {
    buttons.forEach((button) => {
      button.classList.toggle('is-active', button.getAttribute(attrName) === value);
    });
  }

  function setActiveRoute(routeId) {
    const visibleRoutes = getVisibleRoutes();
    const nextRoute = visibleRoutes.find((route) => route.id === routeId) || visibleRoutes[0] || null;
    activeRouteId = nextRoute ? nextRoute.id : '';
    syncRouteVisibility(visibleRoutes);
    paintDetail(nextRoute);
  }

  function renderByFilters(preferredRouteId) {
    const visibleRoutes = getVisibleRoutes();
    updateMapInsights(visibleRoutes);
    updateProvinceVisuals(visibleRoutes);
    updateProvinceDrilldown(visibleRoutes);
    renderStream(visibleRoutes);
    bindStreamButtons();

    const chosenRoute = visibleRoutes.find((route) => route.id === preferredRouteId) || visibleRoutes[0] || null;
    activeRouteId = chosenRoute ? chosenRoute.id : '';
    syncRouteVisibility(visibleRoutes);
    paintDetail(chosenRoute);
  }

  function bindRouteEvents(route) {
    const pathEl = document.getElementById(route.id);
    const nodeEls = Array.from(document.querySelectorAll(`[data-route="${route.id}"]`));
    if (!pathEl) return;

    const showTooltip = (clientX, clientY) => {
      if (!tooltip || !mapCanvas) return;
      const bounds = mapCanvas.getBoundingClientRect();
      const left = Math.max(24, Math.min(clientX - bounds.left + 16, bounds.width - 220));
      const top = Math.max(24, Math.min(clientY - bounds.top - 18, bounds.height - 60));
      tooltip.innerHTML = `<strong>${route.from} -> ${route.to}</strong><br>${route.amount} / ${route.level}<br>${route.source}`;
      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
      tooltip.classList.add('is-visible');
    };

    const hideTooltip = () => {
      if (!tooltip) return;
      tooltip.classList.remove('is-visible');
    };

    const activateRoute = () => {
      if (pathEl.classList.contains('is-hidden')) return;
      setActiveRoute(route.id);
    };

    pathEl.addEventListener('mouseenter', (event) => {
      activateRoute();
      showTooltip(event.clientX, event.clientY);
    });

    pathEl.addEventListener('mousemove', (event) => {
      showTooltip(event.clientX, event.clientY);
    });

    pathEl.addEventListener('mouseleave', () => {
      hideTooltip();
    });

    pathEl.addEventListener('click', activateRoute);

    nodeEls.forEach((nodeEl) => {
      nodeEl.addEventListener('mouseenter', (event) => {
        activateRoute();
        showTooltip(event.clientX, event.clientY);
      });
      nodeEl.addEventListener('mousemove', (event) => {
        showTooltip(event.clientX, event.clientY);
      });
      nodeEl.addEventListener('mouseleave', hideTooltip);
      nodeEl.addEventListener('click', activateRoute);
    });
  }

  routeData.forEach(bindRouteEvents);

  riskFilters.forEach((button) => {
    button.addEventListener('click', () => {
      activeRiskFilter = button.getAttribute('data-risk-filter') || 'all';
      updateFilterButtons(riskFilters, activeRiskFilter, 'data-risk-filter');
      renderByFilters(activeRouteId);
    });
  });

  sourceFilters.forEach((button) => {
    button.addEventListener('click', () => {
      activeSourceFilter = button.getAttribute('data-source-filter') || 'all';
      updateFilterButtons(sourceFilters, activeSourceFilter, 'data-source-filter');
      renderByFilters(activeRouteId);
    });
  });

  provinceSegments.forEach((segment) => {
    segment.addEventListener('click', () => {
      const province = segment.getAttribute('data-province') || 'all';
      setProvinceFilter(activeProvinceFilter === province ? 'all' : province);
    });
  });

  provinceChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const province = chip.getAttribute('data-province-chip') || 'all';
      setProvinceFilter(activeProvinceFilter === province ? 'all' : province);
    });
  });

  if (resetProvinceButton) {
    resetProvinceButton.addEventListener('click', () => {
      setProvinceFilter('all');
    });
  }

  renderByFilters(activeRouteId);
}

function bindBizFamilyFlowPage() {
  const tableBody = document.getElementById('biz-family-table-body');
  const actionList = document.getElementById('biz-family-actions');
  if (!tableBody || !actionList) return;

  const contacts = loadContacts();
  const alerts = loadAlerts();
  const totalAlerts = Math.max(6, alerts.length + 4);
  const confirmed = Math.max(3, contacts.length + 1);
  const pending = Math.max(2, totalAlerts - confirmed);

  const alertsEl = document.getElementById('biz-family-alerts');
  const confirmedEl = document.getElementById('biz-family-confirmed');
  const pendingEl = document.getElementById('biz-family-pending');
  const touchSms = document.getElementById('family-touch-sms');
  const touchCall = document.getElementById('family-touch-call');
  const touchFail = document.getElementById('family-touch-fail');

  if (alertsEl) alertsEl.textContent = `${totalAlerts}次`;
  if (confirmedEl) confirmedEl.textContent = `${confirmed}次`;
  if (pendingEl) pendingEl.textContent = `${pending}次`;
  if (touchSms) touchSms.textContent = `${Math.max(4, confirmed)}件`;
  if (touchCall) touchCall.textContent = `${Math.max(2, pending)}件`;
  if (touchFail) touchFail.textContent = `${Math.max(1, pending - 1)}件`;

  const displayContacts = (contacts.length ? contacts : [
    { name: '李明', relation: '儿子', phone: '13800000000' },
    { name: '王芳', relation: '女儿', phone: '13900000000' }
  ]).slice(0, 5);

  tableBody.innerHTML = displayContacts.map((contact, index) => {
    const method = index % 2 === 0 ? '短信 + 电话' : '短信';
    const status = index === 0 ? '已确认协同' : index % 2 === 0 ? '待二次确认' : '已送达待回执';
    const nextAction = index === 0 ? '保持跟进' : index % 2 === 0 ? '机构坐席二次外呼' : '等待家属点击确认';
    return `
      <tr>
        <td>${escapeHtml(contact.name)}</td>
        <td>${escapeHtml(contact.relation)}</td>
        <td>${method}</td>
        <td>${status}</td>
        <td>${nextAction}</td>
      </tr>
    `;
  }).join('');

  const actions = [
    {
      title: '先补全未回执家属的电话联络',
      desc: '短信已送达但未确认的联系人，需要补电话回拨，避免提醒链路中断。',
      meta: '优先级：高'
    },
    {
      title: '登记备用联系人与备用号码',
      desc: '家庭协同流的目标是提高机构处置成功率，而不是仅展示给家属查看。',
      meta: '优先级：中'
    },
    {
      title: '建立家属回执模板库',
      desc: '后续可将短信、电话、App 通知的回执统一标准化，便于机构跟踪。',
      meta: '优先级：建设中'
    }
  ];

  actionList.innerHTML = actions.map((item) => `
    <div class="priority-item">
      <strong>${item.title}</strong>
      <p>${item.desc}</p>
      <div class="priority-meta"><span>${item.meta}</span><span>家庭协同流</span></div>
    </div>
  `).join('');
}

function saveRole(role) {
  localStorage.setItem(ROLE_KEY, role);
}

function loadRole() {
  return localStorage.getItem(ROLE_KEY) || '';
}

function clearRole() {
  localStorage.removeItem(ROLE_KEY);
}

function getCurrentFileName() {
  return window.location.pathname.split('/').pop() || 'index.html';
}

function getLoginPath() {
  return getCurrentFileName() === 'index.html' ? 'pages/login.html' : 'login.html';
}

function getRoleLabel(role) {
  const map = {
    elder: '老年用户',
    family: '家属用户',
    biz: 'B 端用户'
  };
  return map[role] || '未登录';
}

function enforceRouteAccess() {
  const currentFile = getCurrentFileName();
  const requiredRole = ROUTE_ROLE_MAP[currentFile];
  if (!requiredRole) return;

  const currentRole = loadRole();
  if (currentRole === requiredRole) return;

  const roleLabel = getRoleLabel(requiredRole);
  alert(`当前页面仅允许${roleLabel}访问，请先重新登录。`);
  window.location.href = getLoginPath();
}

function bindLogoutButtons() {
  const buttons = document.querySelectorAll('.role-logout-btn');
  if (!buttons.length) return;

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      clearRole();
      window.location.href = getLoginPath();
    });
  });
}

function injectRoleBadge() {
  const role = loadRole();
  if (!role) return;

  const target = document.querySelector('.site-header') || document.querySelector('.app-topbar');
  if (!target || target.querySelector('.current-role-pill')) return;

  const badge = document.createElement('span');
  badge.className = 'status-pill current-role-pill';
  badge.textContent = `当前身份：${getRoleLabel(role)}`;

  if (target.classList.contains('app-topbar')) {
    const actionsWrap = target.lastElementChild;
    if (actionsWrap) {
      actionsWrap.prepend(badge);
    }
    return;
  }

  const nav = target.querySelector('.main-nav');
  if (nav) {
    nav.prepend(badge);
  }
}

function bindLoginPage() {
  const buttons = document.querySelectorAll('.role-login-btn');
  if (!buttons.length) return;
  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const role = button.getAttribute('data-role') || '';
      const target = button.getAttribute('data-target') || 'detect.html';
      saveRole(role);
      window.location.href = target;
    });
  });
}

function applyRoleHints() {
  const role = loadRole();
  if (!role) return;
  const adminTitle = document.querySelector('.app-topbar h3');
  if (role === 'biz' && adminTitle) {
    document.title = 'Elder-Fin 联合干预中枢';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  enforceRouteAccess();
  ensureSeedAlerts();
  setActiveNav();
  bindDetectForm();
  bindFamilyForm();
  bindAdminPage();
  bindBizRiskMonitorPage();
  bindBizFamilyFlowPage();
  bindLoginPage();
  applyRoleHints();
  bindLogoutButtons();
  injectRoleBadge();
  
  const sim = document.getElementById('simulate-alert');
  if(sim) sim.addEventListener('click', () => {
    alert("🚨【全网最高级别预警】\n\n坐标：朝阳区 192.168.x.x\n事件：检测到用户向高危诈骗账户（已在黑名单库）进行 50,000 元大额转账！\n\n系统动作：已在终端进行10分钟交易硬件熔断，并向授权家属发送短信与语音电话！");
  });
});
