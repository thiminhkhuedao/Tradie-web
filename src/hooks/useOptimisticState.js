// hooks/useOptimisticState.js
import { useState, useCallback } from "react";

export function useOptimisticState(initialData, apiCallback) {
  const [data, setData] = useState(initialData);
  const [error, setError] = useState(null);

  const clearError = useCallback(() => setError(null), []);

  const updateOptimistically = useCallback(
    async (newData, updateFn) => {
      setError(null); // 1. Réinitialise l'erreur précédente

      let rollbackData;
      
      // 2. Calcule la nouvelle valeur et garde une copie exacte pour le rollback
      setData((prevData) => {
        rollbackData = prevData;
        return updateFn ? updateFn(prevData) : newData;
      });

      try {
        // 3. Calcule la valeur réelle transmise à l'API
        const payload = updateFn ? updateFn(rollbackData) : newData;
        await apiCallback(payload);
      } catch (err) {
        // 4. Rollback en cas d'échec
        setData(rollbackData);
        setError(err?.message || "Failed to sync changes.");
      }
    },
    [apiCallback]
  );

  return {
    data,
    updateOptimistically,
    error,
    clearError,
  };
}