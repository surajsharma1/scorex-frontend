import { useState, useCallback } from 'react';
import { AxiosError } from 'axios';

interface OptimisticState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

interface UseOptimisticMutationOptions<T, TVariables, TError> {
  onMutate?: (variables: TVariables) => void;
  onError?: (error: AxiosError<TError>, variables: TVariables) => void;
  onSettled?: (data: T | null, error: AxiosError<TError> | null, variables: TVariables) => void;
}

/**
 * Custom hook for optimistic UI updates with automatic rollback on error
 * This provides instant feedback to users while maintaining data consistency
 * 
 * @example
 * const { mutate, data, isLoading, error } = useOptimisticMutation({
 *   mutationFn: (updatedScore) => api.updateScore(updatedScore),
 *   onMutate: (newScore) => {
 *     // Update UI immediately before server response
 *     queryClient.setQueryData(['scores', tournamentId], oldScores => 
 *       oldScores.map(s => s.id === newScore.id ? newScore : s)
 *     );
 *   },
 *   onError: (error, variables) => {
 *     // Rollback on error
 *     queryClient.setQueryData(['scores', tournamentId], previousScores);
 *   }
 * });
 */
export function useOptimisticMutation<T, TVariables, TError = unknown>(
  mutationFn: (variables: TVariables) => Promise<T>,
  options?: UseOptimisticMutationOptions<T, TVariables, TError>
) {
  const [state, setState] = useState<OptimisticState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const mutate = useCallback(
    async (variables: TVariables) => {
      setState({ data: null, isLoading: true, error: null });

      try {
        // Trigger optimistic update
        options?.onMutate?.(variables);

        const result = await mutationFn(variables);

        setState({ data: result, isLoading: false, error: null });
        options?.onSettled?.(result, null, variables);

        return result;
      } catch (err) {
        const error = err as AxiosError<TError>;
        const errorMessage = error.response?.data 
          ? JSON.stringify(error.response.data) 
          : error.message;

        setState({ data: null, isLoading: false, error: errorMessage });
        options?.onError?.(error, variables);
        options?.onSettled?.(null, error, variables);

        throw error;
      }
    },
    [mutationFn, options]
  );

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null });
  }, []);

  return {
    ...state,
    mutate,
    reset,
  };
}

/**
 * Hook for managing optimistic list updates (add, update, delete)
 */
export function useOptimisticListUpdate<T extends { id: string | number }>() {
  const [pendingUpdates, setPendingUpdates] = useState<Set<string | number>>(new Set());

  const addOptimistic = useCallback((list: T[], item: T) => {
    return [...list, item];
  }, []);

  const updateOptimistic = useCallback((list: T[], updatedItem: T) => {
    return list.map((item) =>
      item.id === updatedItem.id ? updatedItem : item
    );
  }, []);

  const removeOptimistic = useCallback((list: T[], itemId: string | number) => {
    return list.filter((item) => item.id !== itemId);
  }, []);

  const isPending = useCallback((id: string | number) => {
    return pendingUpdates.has(id);
  }, [pendingUpdates]);

  const setPending = useCallback((id: string | number, pending: boolean) => {
    setPendingUpdates((prev) => {
      const newSet = new Set(prev);
      if (pending) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  }, []);

  return {
    addOptimistic,
    updateOptimistic,
    removeOptimistic,
    isPending,
    setPending,
    pendingUpdates,
  };
}
