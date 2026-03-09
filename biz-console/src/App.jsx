import { useEffect } from 'react';

import ConsoleLayout from './layouts/ConsoleLayout';
import { useConsoleStore } from './store/consoleStore';

export default function App() {
  const hydrateConsoleData = useConsoleStore((state) => state.hydrateConsoleData);
  const hydrateGeoData = useConsoleStore((state) => state.hydrateGeoData);
  const closeRemoteChannel = useConsoleStore((state) => state.closeRemoteChannel);

  useEffect(() => {
    hydrateConsoleData();
    hydrateGeoData();

    return () => {
      closeRemoteChannel();
    };
  }, [closeRemoteChannel, hydrateConsoleData, hydrateGeoData]);

  return <ConsoleLayout />;
}