import { useState, useCallback } from 'react';
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
export function useOptimisticMutation(mutationFn, options) {
    const [state, setState] = useState({
        data: null,
        isLoading: false,
        error: null,
    });
    const mutate = useCallback(async (variables) => {
        setState({ data: null, isLoading: true, error: null });
        try {
            // Trigger optimistic update
            options?.onMutate?.(variables);
            const result = await mutationFn(variables);
            setState({ data: result, isLoading: false, error: null });
            options?.onSettled?.(result, null, variables);
            return result;
        }
        catch (err) {
            const error = err;
            const errorMessage = error.response?.data
                ? JSON.stringify(error.response.data)
                : error.message;
            setState({ data: null, isLoading: false, error: errorMessage });
            options?.onError?.(error, variables);
            options?.onSettled?.(null, error, variables);
            throw error;
        }
    }, [mutationFn, options]);
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
export function useOptimisticListUpdate() {
    const [pendingUpdates, setPendingUpdates] = useState(new Set());
    const addOptimistic = useCallback((list, item) => {
        return [...list, item];
    }, []);
    const updateOptimistic = useCallback((list, updatedItem) => {
        return list.map((item) => item.id === updatedItem.id ? updatedItem : item);
    }, []);
    const removeOptimistic = useCallback((list, itemId) => {
        return list.filter((item) => item.id !== itemId);
    }, []);
    const isPending = useCallback((id) => {
        return pendingUpdates.has(id);
    }, [pendingUpdates]);
    const setPending = useCallback((id, pending) => {
        setPendingUpdates((prev) => {
            const newSet = new Set(prev);
            if (pending) {
                newSet.add(id);
            }
            else {
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
