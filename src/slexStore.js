import _ from 'lodash'

export const initialAction = { type: 'INITIALISE' }

export function defaultApplyDispatch ({ dispatch, getState, setState, notifyListeners }) {
  return action => {
    return {
      stateChanged: false,
      prevState: getState(),
      nextState: getState(),
      appliedAction: action
    }
  }
}

export function defaultReduce (state, action) {
  return state
}

export function createStore ({ reducer = defaultReduce, applyDispatch = defaultApplyDispatch }) {
  const { notifyListeners, addListener, removeListener } = createListeners()
  const { getState, setState } = createInitialState(reducer)
  const appliedDispatch = applyDispatch({ dispatch, getState, setState, notifyListeners })
  function dispatch (action) {
    const { stateChanged, prevState, nextState, appliedAction } = appliedDispatch(action)
    return appliedAction
  }

  function subscribe (listener) {
    addListener(listener)
    listener(getState())
    return () => {
      removeListener(listener)
    }
  }
  return { getState, dispatch, subscribe }
}

export function createReducer (reducers = {}) {
  return (state, action) => {
    let nextState = state
    for (const storeName in reducers) {
      const storeReducer = reducers[storeName]
      const stateSection = state
        ? state[storeName]
        : undefined
      const nextStateSection = storeReducer(stateSection, action)
      nextState = {
        ...nextState,
        [storeName]: nextStateSection
      }
    }
    return nextState
  }
}

export function createListeners () {
  const listeners = []
  function addListener (listener) {
    listeners.push(listener)
  }
  function removeListener (listener) {
    const index = listeners.indexOf(listener)
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }
  function notifyListeners (state) {
    for (const listener of listeners) {
      listener(state)
    }
  }
  return {
    notifyListeners,
    addListener,
    removeListener
  }
}

export function createDispatch ({ reducer = defaultReduce, middleware = [], sideEffects = [] }) {
  const applyDispatch = ({ dispatch, getState, setState, notifyListeners }) => {
    return action => {
      const appliedAction = applyMiddleware({ middleware, dispatch, getState })(action)
      const prevState = getState()
      const nextState = reducer(prevState, appliedAction)
      applySideEffects({ sideEffects, prevState, nextState, action: appliedAction, dispatch })
      const stateChanged = !_.isEqual(nextState, prevState)
      setState(nextState)
      if (stateChanged) {
        notifyListeners(nextState)
      }
      return {
        stateChanged,
        prevState,
        nextState,
        appliedAction: appliedAction || action
      }
    }
  }
  return {
    applyDispatch,
    reducer
  }
}

export function createInitialState (reducer) {
  let state = reducer(undefined, initialAction)
  function getState () {
    return state
  }
  function setState (nextState) {
    state = nextState
  }
  return {
    getState,
    setState
  }
}

export function applyMiddleware ({ middleware = [], dispatch, getState }) {
  return _.chain([functionActionsMiddleware, arrayActionsMiddleware, ...middleware])
    .map(middlewareFn => _.chain(middlewareFn)
      .partial(dispatch, getState)
      .wrap((func, action) => {
        const appliedAction = func(action)
        return appliedAction || action
      })
      .value()
    )
    .thru(middlewareFns => _.flow(middlewareFns))
    .value()
}

export function applySideEffects ({ sideEffects, prevState, nextState, action, dispatch }) {
  for (const sideEffect of sideEffects) {
    sideEffect({ prevState, nextState, action, dispatch })
  }
}

export function arrayActionsMiddleware (dispatch, getState, action) {
  if (Array.isArray(action)) {
    for (const arrayAction of action) {
      dispatch(arrayAction)
    }
  }
  return action
}

export function functionActionsMiddleware (dispatch, getState, action) {
  if (typeof action === 'function') {
    return action(dispatch, getState)
  }
  return action
}

export default createStore
