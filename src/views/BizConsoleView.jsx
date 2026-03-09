import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import 'maplibre-gl/dist/maplibre-gl.css';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import ConsoleLayout from '../biz/layouts/ConsoleLayout';
import { useConsoleStore } from '../biz/store/consoleStore';
import { getRoleLabel } from '../lib/storage';
import { useAppStore } from '../store/appStore';

export default function BizConsoleView() {
  const navigate = useNavigate();
  const role = useAppStore((state) => state.role);
  const clearRole = useAppStore((state) => state.clearRole);
  const appRevision = useAppStore((state) => state.lastUpdatedAt);
  const hydrateConsoleData = useConsoleStore((state) => state.hydrateConsoleData);
  const hydrateGeoData = useConsoleStore((state) => state.hydrateGeoData);
  const closeRemoteChannel = useConsoleStore((state) => state.closeRemoteChannel);

  useEffect(() => {
    hydrateConsoleData();
  }, [appRevision, hydrateConsoleData]);

  useEffect(() => {
    hydrateGeoData();

    return () => {
      closeRemoteChannel();
    };
  }, [closeRemoteChannel, hydrateGeoData]);

  return (
    <div className="biz-console-root">
      <div className="biz-console-toolbar">
        <span className="status-pill">当前身份：{getRoleLabel(role || 'biz')}</span>
        <button
          className="btn btn-outline btn-sm"
          type="button"
          onClick={() => {
            navigate('/login', { state: { from: '/biz' } });
          }}
        >
          切换身份
        </button>
        <button
          className="btn btn-outline btn-sm"
          type="button"
          onClick={() => {
            clearRole();
            navigate('/login', { replace: true });
          }}
        >
          退出登录
        </button>
      </div>
      <ConsoleLayout />
    </div>
  );
}