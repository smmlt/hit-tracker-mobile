// EN: Shares the selected analytics period across overview and detail screens so every chart requests the same time window.
// UK: Передає вибраний період аналітики між оглядовим і детальними екранами, щоб усі графіки запитували однаковий часовий проміжок.
import React, { createContext, useContext, useMemo, useState } from 'react';

const AnalyticsPeriodContext = createContext(null);

export function AnalyticsPeriodProvider({ children }) {
  const [period, setPeriod] = useState('today');
  const value = useMemo(() => ({ period, setPeriod }), [period]);
  return <AnalyticsPeriodContext.Provider value={value}>{children}</AnalyticsPeriodContext.Provider>;
}

export function useAnalyticsPeriod() {
  const value = useContext(AnalyticsPeriodContext);
  if (!value) throw new Error('useAnalyticsPeriod must be used inside AnalyticsPeriodProvider');
  return value;
}
