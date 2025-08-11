
import { useState, useEffect } from 'react';
import { pollingManager } from '../services/api';

export const useClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    // Registrar intervalo no sistema centralizado
    pollingManager.registerInterval(timerId);

    return () => {
      clearInterval(timerId);
      pollingManager.unregisterInterval(timerId);
    };
  }, []);

  return time;
};
