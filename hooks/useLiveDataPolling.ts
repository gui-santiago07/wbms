
import { useEffect } from 'react';
import { useProductionStore } from '../store/useProductionStore';

export const useLiveDataPolling = (intervalMs: number) => {
  const fetchLiveData = useProductionStore((state) => state.fetchLiveData);
  const machineStatus = useProductionStore((state) => state.machineStatus);


  useEffect(() => {
    // Only poll when the machine is running
    if (machineStatus === 'RUNNING') {
        const intervalId = setInterval(() => {
            fetchLiveData();
        }, intervalMs);

        return () => clearInterval(intervalId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchLiveData, intervalMs, machineStatus]);
};
