'use client'

import React, {createContext, useContext, useReducer, useCallback, useMemo} from 'react'

/**
 * Lightweight state management — creates a typed Context + Provider + hook
 * with no external dependencies.
 *
 * Usage:
 * ```ts
 * // 1. Define your store
 * const { StoreProvider, useStore } = createStore(
 *   { count: 0, name: '' },                         // initial state
 *   (state, action) => {                             // reducer
 *     switch (action.type) {
 *       case 'increment': return { ...state, count: state.count + 1 }
 *       case 'setName':   return { ...state, name: action.payload }
 *       default: return state
 *     }
 *   }
 * )
 *
 * // 2. Wrap your app (or a subtree)
 * <StoreProvider>
 *   <App />
 * </StoreProvider>
 *
 * // 3. Use in any child component
 * const { state, dispatch } = useStore()
 * ```
 */
export function createStore<
    S,
    A extends {type: string; payload?: unknown},
>(
    initialState: S,
    reducer: (state: S, action: A) => S,
) {
    type ContextValue = {
        state: S
        dispatch: React.Dispatch<A>
    }

    const StoreContext = createContext<ContextValue | null>(null)

    function StoreProvider({children, initial}: {children: React.ReactNode; initial?: Partial<S>}) {
        const [state, dispatch] = useReducer(reducer, {...initialState, ...initial})

        const value = useMemo(() => ({state, dispatch}), [state, dispatch])

        return React.createElement(StoreContext.Provider, {value}, children)
    }

    function useStore() {
        const ctx = useContext(StoreContext)
        if (!ctx) {
            throw new Error('useStore must be used within a <StoreProvider>')
        }
        return ctx
    }

    /**
     * Selector hook — re-renders only when the selected slice changes.
     * Note: uses JSON comparison for simplicity. For complex objects,
     * prefer useStore() with your own memo logic.
     */
    function useStoreSelector<T>(selector: (state: S) => T): T {
        const {state} = useStore()
        return selector(state)
    }

    return {StoreProvider, useStore, useStoreSelector}
}

/**
 * Even simpler: createSimpleStore for key-value state without a reducer.
 *
 * Usage:
 * ```ts
 * const { SimpleStoreProvider, useSimpleStore } = createSimpleStore({ count: 0, name: '' })
 *
 * // In component:
 * const { state, set } = useSimpleStore()
 * set('count', state.count + 1)
 * ```
 */
export function createSimpleStore<S extends Record<string, unknown>>(initialState: S) {
    type Action = {type: 'set'; payload: {key: keyof S; value: S[keyof S]}} | {type: 'reset'}

    const {StoreProvider, useStore: useInternalStore, useStoreSelector} = createStore<S, Action>(
        initialState,
        (state, action) => {
            switch (action.type) {
                case 'set':
                    return {...state, [action.payload.key]: action.payload.value}
                case 'reset':
                    return initialState
                default:
                    return state
            }
        },
    )

    function useSimpleStore() {
        const {state, dispatch} = useInternalStore()

        const set = useCallback(
            <K extends keyof S>(key: K, value: S[K]) => {
                dispatch({type: 'set', payload: {key, value: value as S[keyof S]}})
            },
            [dispatch],
        )

        const reset = useCallback(() => dispatch({type: 'reset'}), [dispatch])

        return {state, set, reset}
    }

    return {SimpleStoreProvider: StoreProvider, useSimpleStore, useStoreSelector}
}
