import _ from 'lodash'

export const initialAction = { type: 'INITIALISE' }

export function createStore ({ reducers = {}, middleware = [], sideEffects = [] }) {
  const { notifyListeners, addListener, removeListener } = createListeners()
  let state = createInitialState(reducers)

  const getState = createGetState(() => {
    return state
  })
  const dispatch = createDispatch(action => {
    const nextState = reduceState(reducers, state, action)
    applySideEffects({ sideEffects, prevState: state, nextState, action, dispatch })
    state = nextState
    notifyListeners(state)
  }, getState, middleware)

  const subscribe = listener => {
    addListener(listener)
    listener(state)
    return () => {
      removeListener(listener)
    }
  }
  return { getState, dispatch, subscribe }
}

export function createListeners () {
  const listeners = []
  const addListener = listener => {
    listeners.push(listener)
  }
  const removeListener = listener => {
    const index = listeners.indexOf(listener)
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }
  const notifyListeners = state => {
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

export function createGetState (getter) {
  return function getState () {
    return getter()
  }
}

export function createDispatch (sideEffect, getState, middleware) {
  return function dispatch (action) {
    const appliedAction = applyMiddleware({ middleware, dispatch, getState })(action)
    sideEffect(appliedAction)
    return appliedAction || action
  }
}

export function reduceState (reducers, state, action) {
  let nextState = state
  for (const key in reducers) {
    const sectionReducer = reducers[key]
    const stateSection = state[key]
    const nextStateSection = sectionReducer(stateSection, action)
    if (nextStateSection !== stateSection) {
      nextState = {
        ...nextState,
        [key]: nextStateSection
      }
      break
    }
  }
  return nextState
}

export function createInitialState (reducers) {
  const initialState = _.chain(reducers)
    .map((sectionReducer, sectionName) => ({ sectionName, sectionReducer }))
    .reduce((state, next) => {
      const { sectionName, sectionReducer } = next
      const section = sectionReducer(undefined, initialAction)
      const nextState = {
        ...state,
        [sectionName]: section
      }
      return nextState
    }, {})
    .value()
  return initialState
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
