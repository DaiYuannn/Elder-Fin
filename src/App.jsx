import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Suspense, lazy, useEffect, useMemo, useState } from 'react';

import robotImage from '../robot.png';
import { useAppStore } from './store/appStore';
import {
  ensureSeedAlerts,
  getRoleLabel,
  recommendFinance,
  scoreRisk,
} from './lib/storage';

const BizConsoleView = lazy(() => import('./views/BizConsoleView'));

const ROLE_HOME_MAP = {
  elder: '/elder',
  family: '/family/dashboard',
  biz: '/biz'
};

const ROLE_NAV_LINKS = {
  elder: [
    { to: '/elder', label: '老人首页', end: true },
    { to: '/elder/detect', label: '风险检测' },
    { to: '/elder/finance', label: '理财陪伴' },
    { to: '/elder/family', label: '家属授权' }
  ],
  family: [
    { to: '/family/dashboard', label: '家属看板', end: true }
  ],
  biz: []
};

const PUBLIC_HOME_LINKS = [];

const DIALECT_OPTIONS = [
  '普通话',
  '北京话',
  '上海话',
  '粤语',
  '天津话',
  '四川话',
  '重庆话',
  '武汉话',
  '闽南话',
  '客家话',
  '苏州话',
  '东北话'
];

const ELDER_COMPANION_MESSAGE = '今天是3月10日，普陀区的温度为13~6℃，天气晴朗，可以去公园走走散心哦。';

const HOME_EXPERIENCES = {
  guest: {
    sectionTitle: '三端协同网络',
    heroTitle: '为爸妈的养老钱，穿上隐形的防弹衣',
    heroSubtitle: '检测、陪伴、联防、干预四位一体，把老人、家属与机构联动成一张守护网。',
    actions: [
      { to: '/login', state: { from: '/elder' }, label: '登录后进入老人首页', className: 'btn primary home-hero-btn' },
      { to: '/login', state: { from: '/elder/family' }, label: '登录后绑定家属', className: 'btn btn-outline home-hero-btn home-hero-btn-outline' }
    ],
    featureCards: [
      { tone: 'primary', title: '长辈端：大字陪伴、风险直说', text: '通过适老化流程减少误触和信息过载，把高风险话术直接翻译成能看懂、敢停下来的提醒。' },
      { tone: 'warning', title: '家属端：提醒摘要、协同确认', text: '把老人最新风险、授权联系人和协同状态汇总成家属视角，不和机构工作台混在一起。' },
      { tone: 'danger', title: 'B 端：中枢联动、快速干预', text: '机构端聚合风险态势、事件流与家庭协作信息，用于快速判断与介入。' }
    ],
    summaryTitle: '平台核心能力',
    summaryItems: [
      { title: '风险识别', text: '围绕诈骗话术、异常转账和高收益宣传做快速识别。' },
      { title: '家属协同', text: '把提醒结果和联系人关系沉淀为可协作的家庭守护链。' },
      { title: '机构联动', text: '通过联合干预中枢汇总事件、地图和处置状态。' }
    ]
  },
  elder: {
    sectionTitle: '老人端当前可用功能',
    heroTitle: '老人端已登录，先看风险再做操作',
    heroSubtitle: '首页已按老年用户身份收口，只展示老人端主流程入口，避免误入家属端和 B 端工作台。',
    actions: [
      { to: '/elder', label: '进入老人首页', className: 'btn primary home-hero-btn' },
      { to: '/elder/family', label: '管理家属授权', className: 'btn btn-outline home-hero-btn home-hero-btn-outline' }
    ],
    featureCards: [
      { tone: 'primary', title: '风险检测', text: '识别诈骗短信、电话话术和异常理财宣传，先给出直白的风险级别和停手建议。' },
      { tone: 'warning', title: '理财陪伴', text: '围绕养老、医疗和备用金等用途生成稳健建议，不鼓励复杂产品和陌生平台。' },
      { tone: 'danger', title: '家属授权', text: '只有老人端可以发起授权和调整联系人，涉及绑定、删除和变更都留在这里完成。' }
    ],
    summaryTitle: '老人端推荐流程',
    summaryItems: [
      { title: '先检测', text: '遇到陌生来电、链接和高收益话术时，先做风险检测。' },
      { title: '再判断', text: '确有理财需求时，再进入理财陪伴页面看稳健建议。' },
      { title: '最后授权', text: '需要家属协同时，再由老人本人进入家属授权页面进行设置。' }
    ]
  },
  family: {
    sectionTitle: '家属端当前可用功能',
    heroTitle: '家属端已登录，优先查看提醒摘要',
    heroSubtitle: '家属视角聚焦提醒查看、情况确认和协同判断。',
    actions: [
      { to: '/family/dashboard', label: '进入家属看板', className: 'btn primary home-hero-btn' },
      { to: '/login', state: { from: '/elder/family' }, label: '切换为老人身份管理授权', className: 'btn btn-outline home-hero-btn home-hero-btn-outline' }
    ],
    featureCards: [
      { tone: 'warning', title: '风险提醒汇总', text: '集中查看最近高风险提醒、时间和来源，先判断是否需要主动联系老人。' },
      { tone: 'primary', title: '协同决策', text: '把最近的风险摘要和建议整理成家属视角，用于电话确认和共同判断。' },
      { tone: 'danger', title: '权限边界', text: '家属可以看结果，但不能替老人修改授权联系人或直接操作老人端功能。' }
    ],
    summaryTitle: '家属端推荐流程',
    summaryItems: [
      { title: '先看板', text: '先进入家属看板看最近告警和风险等级。' },
      { title: '再沟通', text: '根据告警内容联系老人核实情况，必要时帮助停止操作。' },
      { title: '需改授权时切换身份', text: '涉及新增、删除或变更授权联系人时，应由老人身份进入授权页处理。' }
    ]
  },
  biz: {
    sectionTitle: 'B 端当前可用功能',
    heroTitle: 'B 端已登录，直接进入联合干预中枢',
    heroSubtitle: '机构端聚焦风险态势、事件流与处置联动。',
    actions: [
      { to: '/biz', label: '进入联合干预中枢', className: 'btn primary home-hero-btn' },
      { to: '/login', state: { from: '/biz' }, label: '切换其他身份', className: 'btn btn-outline home-hero-btn home-hero-btn-outline' }
    ],
    featureCards: [
      { tone: 'danger', title: '风险态势总览', text: '进入统一中枢后查看全局风险事件、处置状态和联动情况。' },
      { tone: 'primary', title: '地图语义缩放', text: '从国际、省级到城市与网点层逐级下钻，定位风险链路和处置位置。' },
      { tone: 'warning', title: '与 C 端隔离', text: 'B 端是处置工作台，不直接承接老人端和家属端的日常交互流程。' }
    ],
    summaryTitle: 'B 端推荐流程',
    summaryItems: [
      { title: '先入中枢', text: '进入联合干预中枢查看风险态势和事件清单。' },
      { title: '再联动模块', text: '通过地图、总览、家庭流和风险流模块进行关联分析。' },
      { title: '保持角色隔离', text: '如需体验 C 端或家属端流程，应切换身份后进入对应界面。' }
    ]
  }
};

function getRoleHomePath(role) {
  return ROLE_HOME_MAP[role] || '/';
}

function getRoleHomeLabel(role) {
  if (role === 'elder') return '进入老人端';
  if (role === 'family') return '进入家属看板';
  if (role === 'biz') return '进入联合中枢';
  return '返回首页';
}

function getRoleLinks(role) {
  return ROLE_NAV_LINKS[role] || [];
}

function getRouteMeta(pathname) {
  const path = typeof pathname === 'string' ? pathname : '';

  if (path === '/elder' || path === '/elder/') return { role: 'elder', title: '老人端首页' };
  if (path.startsWith('/elder/detect')) return { role: 'elder', title: '风险检测' };
  if (path.startsWith('/elder/finance')) return { role: 'elder', title: '理财陪伴' };
  if (path.startsWith('/elder/family')) return { role: 'elder', title: '家属授权' };
  if (path.startsWith('/elder/')) return { role: 'elder', title: '老人端页面' };
  if (path.startsWith('/family/dashboard')) return { role: 'family', title: '家属看板' };
  if (path.startsWith('/family/')) return { role: 'family', title: '家属端页面' };
  if (path.startsWith('/biz')) return { role: 'biz', title: '联合干预中枢' };
  if (path.startsWith('/login')) return { role: '', title: '登录页' };

  return { role: '', title: '首页' };
}

function canRoleAccessPath(role, pathname) {
  const { role: requiredRole } = getRouteMeta(pathname);

  return !requiredRole || requiredRole === role;
}

function getCrossRoleGuidance(currentRole, requiredRole) {
  const pair = `${currentRole}->${requiredRole}`;

  if (pair === 'family->elder') {
    return '家属端可以查看提醒摘要和联系人结果，但不能直接替老人新增、删除或变更授权联系人。涉及授权动作时，应切换到老人身份完成。';
  }

  if (pair === 'elder->family') {
    return '老人端负责发起授权和日常检测，家属看板则用于家属查看提醒摘要与协同信息，所以需要家属身份才能进入。';
  }

  if (pair === 'elder->biz' || pair === 'family->biz') {
    return '联合干预中枢属于机构处置工作台，信息密度和操作权限都与 C 端不同，必须使用 B 端身份进入。';
  }

  if (pair === 'biz->elder' || pair === 'biz->family') {
    return 'B 端当前以处置中枢为主，不直接承接老人端或家属端的交互流程。需要体验对应端界面时，应切换到相应身份进入。';
  }

  return '当前页面仅向对应身份开放。你可以先返回自己的界面，或切换身份后再进入该页面。';
}

function CurrentSessionActions({ role, onLogout, switchTargetPath, showHomeButton = true }) {
  const location = useLocation();
  const homePath = getRoleHomePath(role);
  const nextSwitchTarget = switchTargetPath || location.pathname;

  return (
    <>
      <span className="status-pill current-role-pill">当前身份：{getRoleLabel(role)}</span>
      {showHomeButton && location.pathname !== homePath ? (
        <NavLink to={homePath} className="btn btn-outline btn-sm">
          {getRoleHomeLabel(role)}
        </NavLink>
      ) : null}
      <NavLink to="/login" state={{ from: nextSwitchTarget }} className="btn btn-outline btn-sm">
        切换身份
      </NavLink>
      <button className="btn btn-outline btn-sm" type="button" onClick={onLogout}>
        退出登录
      </button>
    </>
  );
}

function RoleAccessNotice({ requiredRole }) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentRole = useAppStore((state) => state.role);
  const clearRole = useAppStore((state) => state.clearRole);
  const routeMeta = getRouteMeta(location.pathname);

  return (
    <>
      <AppHeader
        links={getRoleLinks(currentRole)}
        action={
          <CurrentSessionActions
            role={currentRole}
            switchTargetPath={location.pathname}
            onLogout={() => {
              clearRole();
              navigate('/login', { replace: true, state: { from: location.pathname } });
            }}
          />
        }
      />
      <main className="container access-shell">
        <section className="card access-card">
          <p className="eyebrow">权限提示</p>
          <h1>当前身份无法进入这个页面</h1>
          <p>
            你当前以<strong>{getRoleLabel(currentRole)}</strong>登录，正在尝试进入
            <strong>{getRoleLabel(requiredRole)}</strong>专属页面“{routeMeta.title}”。
          </p>
          <div className="access-role-box">
            <h2>权限说明</h2>
            <p>{getCrossRoleGuidance(currentRole, requiredRole)}</p>
          </div>
          <div className="form-actions-row">
            <NavLink className="btn primary" to={getRoleHomePath(currentRole)}>
              返回我的界面
            </NavLink>
            <NavLink className="btn btn-outline" to="/login" state={{ from: location.pathname }}>
              切换身份进入该页
            </NavLink>
          </div>
        </section>
      </main>
      <PageFooter text="请选择正确身份后继续访问对应页面。" />
    </>
  );
}

function AppHeader({ links, action, mobileHideLinks = false, mobileInlineAction = false }) {
  return (
    <header className={`site-header${mobileHideLinks ? ' mobile-hide-header-links' : ''}${mobileInlineAction ? ' mobile-inline-action' : ''}`}>
      <NavLink to="/" className="brand">
        Elder-Fin 老年财经伴侣中枢平台
      </NavLink>
      <div className="app-header-actions">
        <div className="status-pill"><span className="status-orb"></span>Elder-Fin 安全守护</div>
        <nav className="main-nav">
          <div className="main-nav-links">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} className={({ isActive }) => (isActive ? 'active' : '')} end={link.end}>
                {link.label}
              </NavLink>
            ))}
          </div>
          {action}
        </nav>
      </div>
    </header>
  );
}

function PageFooter({ text }) {
  return <footer className="site-footer app-footer">{text}</footer>;
}

function MobileBottomNav({ items }) {
  const location = useLocation();

  return (
    <nav className="mobile-bottom-nav" aria-label="移动端快捷导航">
      {items.map((item) => {
        if (item.to) {
          return (
            <NavLink
              key={item.key}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `mobile-bottom-nav-item${isActive ? ' active' : ''}`}
            >
              <span>{item.label}</span>
            </NavLink>
          );
        }

        const isActive = item.isActive ? item.isActive(location.pathname) : false;

        return (
          <button
            key={item.key}
            className={`mobile-bottom-nav-item${isActive ? ' active' : ''}`}
            type="button"
            onClick={item.onClick}
          >
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function getOutreachStatusLabel(status) {
  if (status === 'pending') return '待联系';
  if (status === 'no-answer') return '已联系未接通';
  if (status === 'safe') return '已确认安全';
  if (status === 'high-risk') return '已确认高风险';
  if (status === 'stopped') return '已协助停止操作';
  return '待处理';
}

function getOutreachStatusTone(status) {
  if (status === 'safe') return 'low';
  if (status === 'high-risk' || status === 'stopped') return 'high';
  return 'medium';
}

function RequireRole({ role, children }) {
  const location = useLocation();
  const currentRole = useAppStore((state) => state.role);

  if (!currentRole) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (currentRole !== role) {
    return <RoleAccessNotice requiredRole={role} />;
  }

  return children;
}

function HomeView() {
  const navigate = useNavigate();
  const role = useAppStore((state) => state.role);
  const clearRole = useAppStore((state) => state.clearRole);
  const homeExperience = HOME_EXPERIENCES[role] || HOME_EXPERIENCES.guest;

  return (
    <>
      <AppHeader
        links={role ? getRoleLinks(role) : PUBLIC_HOME_LINKS}
        mobileHideLinks={Boolean(role && role !== 'biz')}
        mobileInlineAction={!role}
        action={role ? (
          <CurrentSessionActions
            role={role}
            switchTargetPath={getRoleHomePath(role)}
            showHomeButton={role !== 'elder'}
            onLogout={() => {
              clearRole();
              navigate('/login', { replace: true });
            }}
          />
        ) : <NavLink to="/login" className="btn btn-outline btn-sm">登录</NavLink>}
      />
      <main>
        <section className="hero-section">
          <div className="hero-content">
            {role ? <p className="eyebrow home-role-eyebrow">当前首页视角：{getRoleLabel(role)}</p> : null}
            <h1 className="hero-title">{homeExperience.heroTitle}</h1>
            <p className="hero-subtitle">{homeExperience.heroSubtitle}</p>
            <div className="cta-row home-cta-row">
              {homeExperience.actions.map((action) => (
                <NavLink key={`${action.to}-${action.label}`} className={action.className} to={action.to} state={action.state}>
                  {action.label}
                </NavLink>
              ))}
            </div>
            <div className="hero-glass-panel">
              <div className="glass-metric">
                <strong>245,600</strong>
                <span>今日守护老年用户</span>
              </div>
              <div className="glass-metric">
                <strong>34,102</strong>
                <span>自动熔断高危操作</span>
              </div>
              <div className="glass-metric">
                <strong className="hero-metric-success">12,503</strong>
                <span>完成亲情与机构互联</span>
              </div>
            </div>
          </div>
        </section>
        <div className="container">
          <section className="section-spacing-lg">
            <h2 className="section-title-center">{homeExperience.sectionTitle}</h2>
            <div className="grid-3">
              {homeExperience.featureCards.map((card) => (
                <article key={card.title} className={`card feature-card feature-card-${card.tone}`}>
                  <h3>{card.title}</h3>
                  <p>{card.text}</p>
                </article>
              ))}
            </div>
          </section>
          <section className="card home-summary-card">
            <h2 className="home-summary-title">{homeExperience.summaryTitle}</h2>
            <div className="grid-3">
              {homeExperience.summaryItems.map((item) => (
                <div key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
      <PageFooter text="© 2026 Elder-Fin 老年财经伴侣中枢平台" />
    </>
  );
}

function LoginView() {
  const navigate = useNavigate();
  const location = useLocation();
  const setRole = useAppStore((state) => state.setRole);
  const requestedPath = location.state?.from;
  const requestedMeta = useMemo(() => getRouteMeta(requestedPath), [requestedPath]);

  const goToRole = (role) => {
    setRole(role);

    const nextPath = canRoleAccessPath(role, requestedPath) ? requestedPath : getRoleHomePath(role);

    navigate(nextPath || '/', { replace: true });
  };

  return (
    <>
      <AppHeader links={[]} action={<NavLink to="/" className="btn btn-outline btn-sm">返回首页</NavLink>} />
      <main className="login-shell">
        <section className="login-hero card">
          <div>
            <p className="eyebrow">身份进入</p>
            <h1>选择你的登录身份</h1>
            <p className="login-intro">请选择与你当前使用场景相符的身份入口。</p>
            {requestedMeta.role ? (
              <div className="login-redirect-hint">
                <strong>待进入页面：</strong>{requestedMeta.title}
                <span>该页面需要以{getRoleLabel(requestedMeta.role)}进入。</span>
              </div>
            ) : null}
          </div>
          <div className="login-status-board">
            <div className="login-status-card">
              <span>老人端</span>
              <strong>手机优先</strong>
              <p>风险检测、理财陪伴、家属授权</p>
            </div>
            <div className="login-status-card">
              <span>家属端</span>
              <strong>协同提醒</strong>
              <p>查看风险摘要与授权联系人</p>
            </div>
            <div className="login-status-card login-status-card-dark">
              <span>B 端</span>
              <strong>联合干预中枢</strong>
              <p>面向机构处置人员查看风险态势与事件联动</p>
            </div>
          </div>
        </section>

        <section className="login-role-grid">
          <article className="role-card role-card-elder">
            <div className="role-card-icon">长辈</div>
            <h2>老年用户登录</h2>
            <p>进入适老化主流程，优先手机布局，包含风险检测、理财陪伴和家属授权。</p>
            <ul className="role-points">
              <li>大字与高对比度界面</li>
              <li>少步骤、强提醒、易操作</li>
              <li>适合老人本人日常使用</li>
            </ul>
            <button className="btn primary role-login-btn" type="button" onClick={() => goToRole('elder')}>以老年用户进入</button>
          </article>
          <article className="role-card role-card-family">
            <div className="role-card-icon">家属</div>
            <h2>家属用户登录</h2>
            <p>进入家属看板，查看最近风险提醒、授权联系人和协同辅助信息。</p>
            <ul className="role-points">
              <li>风险提醒汇总</li>
              <li>联系人信息查看</li>
              <li>帮助共同决策</li>
            </ul>
            <button className="btn btn-outline role-login-btn" type="button" onClick={() => goToRole('family')}>以家属身份进入</button>
          </article>
          <article className="role-card role-card-biz">
            <div className="role-card-icon">B端</div>
            <h2>B 端用户登录</h2>
            <p>进入联合干预中枢，查看风险事件、地图态势和协同信息。</p>
            <ul className="role-points">
              <li>查看风险事件与处理状态</li>
              <li>联动地图与家庭协作信息</li>
              <li>适合机构人员统一处置</li>
            </ul>
            <button className="btn btn-danger role-login-btn" type="button" onClick={() => goToRole('biz')}>以 B 端身份进入</button>
          </article>
        </section>
      </main>
    </>
  );
}

function ElderLayout({ children }) {
  const navigate = useNavigate();
  const role = useAppStore((state) => state.role);
  const clearRole = useAppStore((state) => state.clearRole);
  const mobileNavItems = [
    { key: 'elder-home', to: '/elder', label: '首页', end: true },
    { key: 'elder-detect', to: '/elder/detect', label: '检测' },
    { key: 'elder-finance', to: '/elder/finance', label: '理财' },
    { key: 'elder-family', to: '/elder/family', label: '家属' }
  ];

  return (
    <>
      <AppHeader
        links={getRoleLinks(role)}
        mobileHideLinks
        action={
          <CurrentSessionActions
            role={role}
            showHomeButton={false}
            onLogout={() => {
              clearRole();
              navigate('/login', { replace: true });
            }}
          />
        }
      />
      <main className="container page-main-with-mobile-nav">{children}</main>
      <MobileBottomNav items={mobileNavItems} />
    </>
  );
}

function ElderHomeView() {
  const navigate = useNavigate();
  const alerts = useAppStore((state) => state.alerts).slice(0, 6);
  const contacts = useAppStore((state) => state.contacts);
  const highRiskCount = alerts.filter((item) => item.level === 'high').length;
  const mediumRiskCount = alerts.filter((item) => item.level === 'medium').length;
  const lowRiskCount = alerts.filter((item) => item.level === 'low').length;
  const recentAlerts = alerts.slice(0, 3);
  const currentHour = new Date().getHours();
  const greetingText = currentHour < 11 ? '上午好' : currentHour < 18 ? '下午好' : '晚上好';
  const statusTone = highRiskCount >= 2 ? 'danger' : mediumRiskCount >= 2 ? 'warning' : 'safe';
  const statusLabel = highRiskCount >= 2 ? '今天风险偏高，先别急着继续操作。' : mediumRiskCount >= 2 ? '今天有几条提醒待确认，建议先核实。' : '今天整体较平稳，仍要保持警惕。';
  const trendLabel = highRiskCount >= 2 ? '高风险提醒需要优先处理' : mediumRiskCount >= 1 ? '今天以待确认事项为主' : '目前没有明显高风险堆积';

  return (
    <ElderLayout>
      <section className="card elder-dashboard-hero">
        <p className="eyebrow">老人端首页</p>
        <h1>{greetingText}，先看提醒，再决定要不要继续操作</h1>
        <p className="elder-dashboard-intro">
          这里集中展示最近风险、家属协同和下一步操作建议。遇到陌生链接、电话催促或高收益宣传，先停一下，再进入检测。
        </p>
        <div className={`elder-status-banner elder-status-banner-${statusTone}`}>
          <strong>今日守护状态</strong>
          <span>{statusLabel}</span>
        </div>
        <div className="cta-row elder-dashboard-actions">
          <button className="btn primary elder-action-btn" type="button" onClick={() => navigate('/elder/detect')}>
            立即做风险检测
          </button>
          <button className="btn elder-action-btn" type="button" onClick={() => navigate('/elder/finance')}>
            查看理财陪伴建议
          </button>
          <button className="btn btn-outline elder-action-btn" type="button" onClick={() => navigate('/elder/family')}>
            管理家属授权
          </button>
        </div>
      </section>

      <section className="card elder-companion-card">
        <div className="elder-companion-media">
          <img src={robotImage} alt="陪伴机器人" className="elder-companion-image" />
        </div>
        <div className="elder-companion-content">
          <p className="eyebrow">情感陪伴助手</p>
          <h2>今天想和我聊聊什么呢</h2>
          <div className="elder-companion-bubble">
            <p>{ELDER_COMPANION_MESSAGE}</p>
          </div>
        </div>
      </section>

      <section className="grid-3 elder-sim-grid">
        <article className="card elder-today-card">
          <h2>今日风险走势</h2>
          <p className="elder-today-value">{trendLabel}</p>
          <p>高风险 {highRiskCount} 条，中风险 {mediumRiskCount} 条，低风险 {lowRiskCount} 条。</p>
        </article>
        <article className="card elder-today-card">
          <h2>当前最该做的事</h2>
          <p className="elder-today-value">先核实，再操作</p>
          <p>任何涉及转账、验证码、下载 App 的要求，都先检测再联系家属。</p>
        </article>
        <article className="card elder-today-card">
          <h2>守护链路状态</h2>
          <p className="elder-today-value">{contacts.length ? '已连接' : '待补充'}</p>
          <p>{contacts.length ? `当前已配置 ${contacts.length} 位联系人，可用于异常时快速确认。` : '建议先配置至少 1 位家属联系人。'}</p>
        </article>
      </section>

      <section className="grid-3 elder-sim-grid">
        <article className="card elder-overview-card elder-overview-card-danger">
          <h2>高风险提醒</h2>
          <p className="summary-value summary-value-danger">{highRiskCount}</p>
          <p>建议优先停止操作，并联系已授权家属确认。</p>
        </article>
        <article className="card elder-overview-card elder-overview-card-warning">
          <h2>待确认事项</h2>
          <p className="summary-value">{mediumRiskCount}</p>
          <p>这些提醒适合先打电话核实，不要直接点链接或转账。</p>
        </article>
        <article className="card elder-overview-card elder-overview-card-safe">
          <h2>守护联系人</h2>
          <p className="summary-value summary-value-time">{contacts.length}</p>
          <p>涉及异常转账、陌生 App 或验证码时，优先联系他们。</p>
        </article>
      </section>

      <section className="row elder-dashboard-row">
        <section className="card elder-dashboard-panel">
          <div className="section-row-between">
            <h2 className="section-no-margin">最近提醒</h2>
            <button className="btn btn-outline" type="button" onClick={() => navigate('/elder/detect')}>
              去检测更多内容
            </button>
          </div>
          <div className="simulation-list">
            {recentAlerts.map((item) => (
              <article key={`elder-home-${item.time}-${item.content}`} className="simulation-item">
                <div className="simulation-item-head">
                  <strong>{item.source}</strong>
                  <span className={`tag ${item.level}`}>{item.level === 'high' ? '高风险' : item.level === 'medium' ? '中风险' : '低风险'}</span>
                </div>
                <p className="simulation-item-content">{item.content}</p>
                <p className="simulation-item-meta">{item.time} · {item.advice}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="card elder-dashboard-panel">
          <h2>今天怎么做更稳妥</h2>
          <div className="elder-task-list">
            <div className="elder-task-item">
              <strong>第 1 步：先检测</strong>
              <p>接到催促转账、验证码、陌生理财推荐时，先把内容放进风险检测。</p>
            </div>
            <div className="elder-task-item">
              <strong>第 2 步：再看建议</strong>
              <p>真有理财需求，再去理财陪伴看稳健方向，不急着做决定。</p>
            </div>
            <div className="elder-task-item">
              <strong>第 3 步：需要时找家属</strong>
              <p>如果出现高风险提醒，优先联系已授权家属，一起判断下一步。</p>
            </div>
          </div>
        </section>
      </section>

      <section className="card">
        <h2>快捷入口</h2>
        <div className="elder-quick-grid">
          <button className="elder-quick-card" type="button" onClick={() => navigate('/elder/detect')}>
            <strong>检测短信和电话</strong>
            <span>把陌生话术和链接内容放进去先判断风险。</span>
          </button>
          <button className="elder-quick-card" type="button" onClick={() => navigate('/elder/finance')}>
            <strong>看稳健理财建议</strong>
            <span>围绕养老、医疗和备用金需求看更稳妥的方案。</span>
          </button>
          <button className="elder-quick-card" type="button" onClick={() => navigate('/elder/family')}>
            <strong>联系家属协同</strong>
            <span>查看并管理已授权的家属联系人，遇事优先电话确认。</span>
          </button>
        </div>
      </section>

      <section className="card">
        <div className="section-row-between">
          <h2 className="section-no-margin">已授权联系人</h2>
          <button className="btn" type="button" onClick={() => navigate('/elder/family')}>
            去管理联系人
          </button>
        </div>
        <div className="contact-brief-list">
          {contacts.length ? contacts.map((contact) => (
            <div key={`elder-contact-${contact.name}-${contact.phone}`} className="contact-brief-item">
              <strong>{contact.name}</strong>
              <span>{contact.relation}</span>
              <span>{contact.phone}</span>
            </div>
          )) : <p className="empty-hint">当前还没有守护联系人，建议尽快完成家属授权。</p>}
        </div>
      </section>
    </ElderLayout>
  );
}

function DetectView() {
  const navigate = useNavigate();
  const addAlert = useAppStore((state) => state.addAlert);
  const alerts = useAppStore((state) => state.alerts).slice(0, 4);
  const contacts = useAppStore((state) => state.contacts);
  const [input, setInput] = useState('');
  const [dialect, setDialect] = useState(DIALECT_OPTIONS[0]);
  const [result, setResult] = useState(null);
  const highRiskCount = alerts.filter((item) => item.level === 'high').length;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!input.trim()) return;

    const nextResult = scoreRisk(input);
    addAlert({
      time: new Date().toLocaleString('sv-SE').replace('T', ' ').slice(0, 16),
      source: '检测器',
      content: input.trim(),
      level: nextResult.level,
      advice: nextResult.advice
    });
    setResult(nextResult);
  };

  return (
    <ElderLayout>
      <section className="card detect-card-main">
        <h1>风险检测</h1>
        <p>输入短信、电话话术、理财宣传语或合同片段，系统将给出基础风险评级。</p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="risk-text">检测内容</label>
          <div className="detect-input-row">
            <input
              className="detect-text-input"
              id="risk-text"
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="直接输入需要识别的话术或宣传内容"
            />
            <div className="detect-voice-group" aria-label="方言语音识别入口">
              <button className="detect-tool-button detect-voice-button" type="button" aria-label={`语音识别，当前方言${dialect}`}>
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M12 15.5a3.5 3.5 0 0 0 3.5-3.5V7a3.5 3.5 0 1 0-7 0v5a3.5 3.5 0 0 0 3.5 3.5Zm6-3.5a1 1 0 1 0-2 0 4 4 0 1 1-8 0 1 1 0 1 0-2 0 6 6 0 0 0 5 5.91V21H9.5a1 1 0 1 0 0 2h5a1 1 0 1 0 0-2H13v-3.09A6 6 0 0 0 18 12Z" />
                </svg>
                <span className="detect-voice-copy">
                  <strong>语音</strong>
                  <small>方言识别</small>
                </span>
              </button>
              <div className="detect-dialect-shell">
                <select className="detect-dialect-select" value={dialect} onChange={(event) => setDialect(event.target.value)} aria-label="选择识别方言">
                  {DIALECT_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <span className="detect-dialect-arrow" aria-hidden="true">▾</span>
              </div>
            </div>
            <label className="detect-tool-button detect-upload-button" htmlFor="risk-image-upload">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M9 4a2 2 0 0 0-1.8 1.1L6.7 6H5a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V9a3 3 0 0 0-3-3h-1.7l-.5-.9A2 2 0 0 0 15 4H9Zm3 13.5A4.5 4.5 0 1 1 12 8a4.5 4.5 0 0 1 0 9Zm0-2A2.5 2.5 0 1 0 12 10a2.5 2.5 0 0 0 0 5Z" />
              </svg>
              <span>图片/相机</span>
            </label>
            <input id="risk-image-upload" className="detect-hidden-input" type="file" accept="image/*" capture="environment" />
          </div>
          <div className="form-actions-row detect-actions-row">
            <button className="btn primary detect-action-btn" type="submit">开始检测</button>
            <button className="btn detect-action-btn" type="button" onClick={() => navigate('/elder/family')}>去设置家属提醒</button>
            <button className="btn btn-outline detect-action-btn" type="button" onClick={() => navigate('/elder')}>返回老人首页</button>
          </div>
        </form>
      </section>
      <section className="card">
        <h2>检测结果</h2>
        <div className={`result ${result?.level || ''}`}>
          {result ? (
            <>
              <p className="result-title">分析结论：<span className={`tag ${result.level}`}>{result.label}</span></p>
              <p><strong>处置建议：</strong>{result.advice}</p>
            </>
          ) : (
            <p>尚未检测，请先输入内容后点击开始检测。</p>
          )}
        </div>
      </section>
      <section className="grid-3 elder-sim-grid">
        <article className="card">
          <h2>模拟预警总数</h2>
          <p className="summary-value">{alerts.length}</p>
        </article>
        <article className="card">
          <h2>高风险事件</h2>
          <p className="summary-value summary-value-danger">{highRiskCount}</p>
        </article>
        <article className="card">
          <h2>已绑定守护人</h2>
          <p className="summary-value summary-value-time">{contacts.length}</p>
        </article>
      </section>
      <section className="card">
        <div className="section-row-between">
          <h2 className="section-no-margin">近期模拟提醒</h2>
          <button className="btn" type="button" onClick={() => navigate('/family/dashboard')}>查看家属看板联动</button>
        </div>
        <div className="simulation-list">
          {alerts.map((item) => (
            <article key={`${item.time}-${item.content}`} className="simulation-item">
              <div className="simulation-item-head">
                <strong>{item.source}</strong>
                <span className={`tag ${item.level}`}>{item.level === 'high' ? '高风险' : item.level === 'medium' ? '中风险' : '低风险'}</span>
              </div>
              <p className="simulation-item-content">{item.content}</p>
              <p className="simulation-item-meta">{item.time} · {item.advice}</p>
            </article>
          ))}
        </div>
      </section>
    </ElderLayout>
  );
}

function FinanceView() {
  const navigate = useNavigate();
  const alerts = useAppStore((state) => state.alerts).slice(0, 3);
  const [formState, setFormState] = useState({
    goal: 'daily',
    horizon: 'short',
    risk: 'low',
    note: ''
  });
  const [result, setResult] = useState(null);

  const handleChange = (key, value) => {
    setFormState((current) => ({ ...current, [key]: value }));
  };

  return (
    <ElderLayout>
      <section className="card">
        <h1>理财陪伴</h1>
        <p>根据资金用途、持有时间和可承受波动，生成稳健型建议与风险提示。</p>
        <form onSubmit={(event) => {
          event.preventDefault();
          setResult(recommendFinance(formState));
        }}>
          <div className="row">
            <div>
              <label htmlFor="finance-goal">资金用途</label>
              <select id="finance-goal" value={formState.goal} onChange={(event) => handleChange('goal', event.target.value)}>
                <option value="daily">日常养老支出</option>
                <option value="medical">医疗储备</option>
                <option value="reserve">家庭备用金</option>
                <option value="growth">长期增值</option>
              </select>
            </div>
            <div>
              <label htmlFor="finance-horizon">预计持有时间</label>
              <select id="finance-horizon" value={formState.horizon} onChange={(event) => handleChange('horizon', event.target.value)}>
                <option value="short">1年以内</option>
                <option value="mid">1-3年</option>
                <option value="long">3年以上</option>
              </select>
            </div>
            <div>
              <label htmlFor="finance-risk">可承受波动</label>
              <select id="finance-risk" value={formState.risk} onChange={(event) => handleChange('risk', event.target.value)}>
                <option value="low">不能接受亏损</option>
                <option value="medium">可接受小幅波动</option>
                <option value="high">可接受较大波动</option>
              </select>
            </div>
            <div>
              <label htmlFor="finance-note">当前关注产品</label>
              <input id="finance-note" type="text" value={formState.note} onChange={(event) => handleChange('note', event.target.value)} placeholder="例如：年化8%保本理财 / 养老保险产品" />
            </div>
          </div>
          <div className="form-actions-row">
            <button className="btn primary" type="submit">生成建议</button>
            <button className="btn" type="button" onClick={() => navigate('/elder/detect')}>先做风险检测</button>
          </div>
        </form>
      </section>
      <section className="card">
        <h2>陪伴建议</h2>
        <div className={`result ${result?.tone || ''}`}>
          {result ? (
            <>
              <p className="result-title">推荐方向：<span className={`tag ${result.tone}`}>{result.label}</span></p>
              <p><strong>建议：</strong>{result.summary}</p>
              <p className="result-subtext"><strong>特别提醒：</strong>{result.warning}</p>
            </>
          ) : (
            <p>请先填写基础信息并点击生成建议。</p>
          )}
        </div>
      </section>
      <section className="card">
        <h2>模拟场景参考</h2>
        <div className="simulation-list">
          {alerts.map((item) => (
            <article key={`finance-${item.time}-${item.content}`} className="simulation-item simulation-item-compact">
              <div className="simulation-item-head">
                <strong>{item.source}</strong>
                <span>{item.time}</span>
              </div>
              <p className="simulation-item-content">{item.content}</p>
            </article>
          ))}
        </div>
      </section>
    </ElderLayout>
  );
}

function FamilyAuthView() {
  const contacts = useAppStore((state) => state.contacts);
  const addContact = useAppStore((state) => state.addContact);
  const removeContact = useAppStore((state) => state.deleteContact);
  const [formState, setFormState] = useState({ name: '', relation: '', phone: '' });

  return (
    <ElderLayout>
      <section className="card">
        <h1>家属授权</h1>
        <p>在老人同意前提下，添加可接收风险提醒的家属联系人。</p>
        <form className="row" onSubmit={(event) => {
          event.preventDefault();
          if (!formState.name.trim() || !formState.relation.trim() || !formState.phone.trim()) return;
          addContact(formState);
          setFormState({ name: '', relation: '', phone: '' });
        }}>
          <div>
            <label htmlFor="family-name">姓名</label>
            <input id="family-name" type="text" value={formState.name} onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))} placeholder="例如：李明" />
          </div>
          <div>
            <label htmlFor="family-relation">关系</label>
            <input id="family-relation" type="text" value={formState.relation} onChange={(event) => setFormState((current) => ({ ...current, relation: event.target.value }))} placeholder="例如：儿子" />
          </div>
          <div>
            <label htmlFor="family-phone">手机号</label>
            <input id="family-phone" type="tel" value={formState.phone} onChange={(event) => setFormState((current) => ({ ...current, phone: event.target.value }))} placeholder="例如：13800000000" />
          </div>
          <div className="form-button-column">
            <button className="btn primary" type="submit">添加授权联系人</button>
          </div>
        </form>
      </section>
      <section className="card">
        <h2>已授权联系人</h2>
        {contacts.length ? contacts.map((contact, index) => (
          <div key={`${contact.name}-${contact.phone}`} className="contact-card-row">
            <div>
              <div className="contact-name-row">{contact.name} <span className="tag low">{contact.relation}</span></div>
              <div className="contact-phone-row">接收预警电话：{contact.phone}</div>
            </div>
            <button
              className="btn btn-outline"
              type="button"
              onClick={() => {
                removeContact(index);
              }}
            >
              取消授权
            </button>
          </div>
        )) : <p className="empty-hint">尚未配置家属协同，建议立即添加。</p>}
      </section>
    </ElderLayout>
  );
}

function FamilyDashboardView() {
  const navigate = useNavigate();
  const alerts = useAppStore((state) => state.alerts).slice(0, 10);
  const contacts = useAppStore((state) => state.contacts);
  const outreachLogs = useAppStore((state) => state.outreachLogs);
  const addOutreachLog = useAppStore((state) => state.addOutreachLog);
  const role = useAppStore((state) => state.role);
  const clearRole = useAppStore((state) => state.clearRole);
  const highRiskCount = alerts.filter((item) => item.level === 'high').length;
  const mediumRiskCount = alerts.filter((item) => item.level === 'medium').length;
  const latestAlert = alerts[0];
  const latestTime = alerts[0]?.time || '--';
  const topFollowUps = alerts.filter((item) => item.level !== 'low').slice(0, 3);
  const pendingOutreachCount = outreachLogs.filter((item) => item.status === 'pending' || item.status === 'no-answer').length;
  const resolvedOutreachCount = outreachLogs.filter((item) => item.status === 'safe' || item.status === 'stopped').length;
  const [outreachForm, setOutreachForm] = useState({
    alertContent: alerts[0]?.content || '',
    contactName: contacts[0]?.name || '',
    status: 'pending',
    note: ''
  });

  useEffect(() => {
    setOutreachForm((current) => ({
      ...current,
      alertContent: current.alertContent || alerts[0]?.content || '',
      contactName: current.contactName || contacts[0]?.name || ''
    }));
  }, [alerts, contacts]);

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const mobileNavItems = [
    { key: 'family-summary', label: '摘要', onClick: () => scrollToSection('family-summary-wrap'), isActive: (pathname) => pathname.startsWith('/family/dashboard') },
    { key: 'family-alerts', label: '提醒', onClick: () => scrollToSection('family-alert-section') },
    { key: 'family-outreach', label: '外呼', onClick: () => scrollToSection('family-outreach-section') },
    { key: 'family-contacts', label: '联系人', onClick: () => scrollToSection('family-contacts-section') }
  ];

  return (
    <>
      <AppHeader
        links={getRoleLinks(role)}
        mobileHideLinks
        action={
          <CurrentSessionActions
            role={role}
            switchTargetPath="/family/dashboard"
            onLogout={() => {
              clearRole();
              navigate('/login', { replace: true });
            }}
          />
        }
      />
      <main className="container page-main-with-mobile-nav">
        <section className="card family-dashboard-hero">
          <p className="eyebrow">家属看板</p>
          <h1>先看最新提醒，再决定要不要马上联系老人</h1>
          <p className="family-dashboard-intro">
            家属端优先展示最新风险摘要、需要外呼确认的事项和已授权联系人，方便在手机上快速判断下一步。
          </p>
          <div className="family-status-strip">
            <span className="status-pill">高风险 {highRiskCount} 条</span>
            <span className="status-pill">中风险 {mediumRiskCount} 条</span>
            <span className="status-pill">联系人 {contacts.length} 位</span>
          </div>
          <div className="family-action-row">
            <button
              className="btn primary family-action-btn"
              type="button"
              onClick={() => {
                scrollToSection('family-summary-wrap');
              }}
            >
              先看今日摘要
            </button>
            <button className="btn family-action-btn" type="button" onClick={() => navigate('/login', { state: { from: '/elder/family' } })}>
              切换为老人身份管理授权
            </button>
          </div>
        </section>

        <section className="grid-3" id="family-summary-wrap">
          <article className="card family-summary-card family-summary-card-safe">
            <h2>已授权联系人</h2>
            <p className="summary-value">{contacts.length}</p>
            <p>发生异常时，可优先联系这些已授权联系人核实情况。</p>
          </article>
          <article className="card family-summary-card family-summary-card-danger">
            <h2>高风险提醒</h2>
            <p className="summary-value summary-value-danger">{highRiskCount}</p>
            <p>建议优先电话联系老人，确认是否正在操作转账、验证码或下载链接。</p>
          </article>
          <article className="card family-summary-card family-summary-card-info">
            <h2>最近告警时间</h2>
            <p className="summary-value summary-value-time">{latestTime}</p>
            <p>{latestAlert ? `${latestAlert.source}：${latestAlert.content}` : '当前没有新的联动提醒。'}</p>
          </article>
        </section>

        <section className="card family-mobile-priority-card">
          <div className="section-row-between">
            <h2 className="section-no-margin">手机优先查看</h2>
            <span className="tag high">优先确认</span>
          </div>
          <div className="family-priority-stack">
            {topFollowUps.length ? topFollowUps.map((item) => (
              <article key={`family-priority-${item.time}-${item.content}`} className="family-alert-card family-alert-card-priority">
                <div className="family-alert-head">
                  <strong>{item.source}</strong>
                  <span className={`tag ${item.level}`}>{item.level === 'high' ? '优先外呼' : '待确认'}</span>
                </div>
                <p className="family-alert-time">{item.time}</p>
                <p className="family-alert-content">{item.content}</p>
                <p className="family-alert-advice">建议动作：{item.advice}</p>
              </article>
            )) : <p className="empty-hint">当前没有需要优先确认的提醒。</p>}
          </div>
        </section>

        <section className="card family-alert-section" id="family-alert-section">
          <h1>家属关怀提醒</h1>
          <div className="family-table-wrap">
            <table className="table family-alert-table">
              <thead>
                <tr>
                  <th>时间</th>
                  <th>来源</th>
                  <th>内容摘要</th>
                  <th>风险等级</th>
                  <th>建议</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((item) => (
                  <tr key={`${item.time}-${item.content}`}>
                    <td>{item.time}</td>
                    <td>{item.source}</td>
                    <td>{item.content}</td>
                    <td><span className={`tag ${item.level}`}>{item.level === 'high' ? '高风险' : item.level === 'medium' ? '中风险' : '低风险'}</span></td>
                    <td>{item.advice}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="family-alert-mobile-list">
            {alerts.map((item) => (
              <article key={`family-mobile-${item.time}-${item.content}`} className="family-alert-card">
                <div className="family-alert-head">
                  <strong>{item.source}</strong>
                  <span className={`tag ${item.level}`}>{item.level === 'high' ? '高风险' : item.level === 'medium' ? '中风险' : '低风险'}</span>
                </div>
                <p className="family-alert-time">{item.time}</p>
                <p className="family-alert-content">{item.content}</p>
                <p className="family-alert-advice">建议动作：{item.advice}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="card" id="family-outreach-section">
          <div className="section-row-between">
            <h2 className="section-no-margin">外呼记录与确认结果</h2>
            <span className="status-pill">待跟进 {pendingOutreachCount} 条</span>
          </div>
          <div className="grid-3 family-outreach-summary-grid">
            <article className="card family-outreach-summary-card">
              <h3>待继续联系</h3>
              <p className="summary-value">{pendingOutreachCount}</p>
              <p>包括待联系和已联系未接通的事项。</p>
            </article>
            <article className="card family-outreach-summary-card">
              <h3>已完成确认</h3>
              <p className="summary-value summary-value-time">{resolvedOutreachCount}</p>
              <p>已确认安全或已协助老人停止操作。</p>
            </article>
            <article className="card family-outreach-summary-card">
              <h3>累计记录</h3>
              <p className="summary-value summary-value-danger">{outreachLogs.length}</p>
              <p>家属端保留最近外呼和确认结果，便于连续跟进。</p>
            </article>
          </div>
          <form
            className="family-outreach-form"
            onSubmit={(event) => {
              event.preventDefault();

              if (!outreachForm.alertContent || !outreachForm.contactName) {
                return;
              }

              addOutreachLog({
                id: `outreach-${Date.now()}`,
                time: new Date().toLocaleString('sv-SE').replace('T', ' ').slice(0, 16),
                alertContent: outreachForm.alertContent,
                contactName: outreachForm.contactName,
                status: outreachForm.status,
                note: outreachForm.note
              });

              setOutreachForm((current) => ({
                ...current,
                status: 'pending',
                note: ''
              }));
            }}
          >
            <div>
              <label htmlFor="outreach-alert">关联提醒</label>
              <select
                id="outreach-alert"
                value={outreachForm.alertContent}
                onChange={(event) => setOutreachForm((current) => ({ ...current, alertContent: event.target.value }))}
              >
                {alerts.map((item) => (
                  <option key={`outreach-option-${item.time}-${item.content}`} value={item.content}>
                    {item.time} · {item.content}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="outreach-contact">联系对象</label>
              <select
                id="outreach-contact"
                value={outreachForm.contactName}
                onChange={(event) => setOutreachForm((current) => ({ ...current, contactName: event.target.value }))}
              >
                {contacts.map((contact) => (
                  <option key={`outreach-contact-${contact.name}-${contact.phone}`} value={contact.name}>
                    {contact.name} · {contact.relation}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="outreach-status">确认结果</label>
              <select
                id="outreach-status"
                value={outreachForm.status}
                onChange={(event) => setOutreachForm((current) => ({ ...current, status: event.target.value }))}
              >
                <option value="pending">待联系</option>
                <option value="no-answer">已联系未接通</option>
                <option value="safe">已确认安全</option>
                <option value="high-risk">已确认高风险</option>
                <option value="stopped">已协助停止操作</option>
              </select>
            </div>
            <div>
              <label htmlFor="outreach-note">备注</label>
              <input
                id="outreach-note"
                type="text"
                value={outreachForm.note}
                onChange={(event) => setOutreachForm((current) => ({ ...current, note: event.target.value }))}
                placeholder="例如：老人已停止操作，约定 15 分钟后回拨。"
              />
            </div>
            <div className="family-outreach-form-actions">
              <button className="btn primary family-action-btn" type="submit">保存外呼记录</button>
            </div>
          </form>
          <div className="family-outreach-log-list">
            {outreachLogs.map((item) => (
              <article key={item.id} className="family-outreach-log-card">
                <div className="family-alert-head">
                  <strong>{item.contactName}</strong>
                  <span className={`tag ${getOutreachStatusTone(item.status)}`}>{getOutreachStatusLabel(item.status)}</span>
                </div>
                <p className="family-alert-time">{item.time}</p>
                <p className="family-alert-content">关联提醒：{item.alertContent}</p>
                <p className="family-alert-advice">确认结果：{item.note || '暂无补充备注。'}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="section-row-between">
            <h2 className="section-no-margin">模拟联动任务</h2>
            <span className="status-pill">中风险 {mediumRiskCount} 条</span>
          </div>
          <div className="simulation-list">
            {topFollowUps.length ? topFollowUps.map((item) => (
              <article key={`follow-${item.time}-${item.content}`} className="simulation-item">
                <div className="simulation-item-head">
                  <strong>{item.source}</strong>
                  <span className={`tag ${item.level}`}>{item.level === 'high' ? '优先外呼' : '待确认'}</span>
                </div>
                <p className="simulation-item-content">{item.content}</p>
                <p className="simulation-item-meta">建议动作：{item.advice}</p>
              </article>
            )) : <p className="empty-hint">当前没有待联动的模拟任务。</p>}
          </div>
        </section>

        <section className="card" id="family-contacts-section">
          <div className="section-row-between">
            <h2 className="section-no-margin">授权联系人摘要</h2>
            <button
              className="btn family-action-btn"
              type="button"
              onClick={() => navigate('/login', { state: { from: '/elder/family' } })}
            >
              切换为老人身份管理授权
            </button>
          </div>
          <div className="contact-brief-list family-contact-list">
            {contacts.length ? contacts.map((contact) => (
              <div key={`${contact.name}-${contact.phone}`} className="contact-brief-item family-contact-item">
                <strong>{contact.name}</strong>
                <span>{contact.relation}</span>
                <span>{contact.phone}</span>
              </div>
            )) : <p className="empty-hint">当前没有授权联系人，建议先到老人端完成绑定。</p>}
          </div>
        </section>
      </main>
      <MobileBottomNav items={mobileNavItems} />
      <PageFooter text="家属看板用于查看提醒摘要、联系人信息与协助决策。" />
    </>
  );
}

function BizLandingView() {
  return (
    <Suspense fallback={<main className="container"><section className="card"><h1>联合干预中枢加载中</h1><p>正在装载地图、布局与风险态势模块。</p></section></main>}>
      <BizConsoleView />
    </Suspense>
  );
}

export default function App() {
  useEffect(() => {
    ensureSeedAlerts();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<HomeView />} />
      <Route path="/login" element={<LoginView />} />
      <Route path="/elder" element={<RequireRole role="elder"><ElderHomeView /></RequireRole>} />
      <Route path="/elder/detect" element={<RequireRole role="elder"><DetectView /></RequireRole>} />
      <Route path="/elder/finance" element={<RequireRole role="elder"><FinanceView /></RequireRole>} />
      <Route path="/elder/family" element={<RequireRole role="elder"><FamilyAuthView /></RequireRole>} />
      <Route path="/family/dashboard" element={<RequireRole role="family"><FamilyDashboardView /></RequireRole>} />
      <Route path="/biz" element={<RequireRole role="biz"><BizLandingView /></RequireRole>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}