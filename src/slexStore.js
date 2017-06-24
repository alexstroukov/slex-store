import Rx from 'rx'
import _ from 'lodash'

export function createStore ({ reducers = {}, middleware = [], sideEffects = [], actionStreams = [] }) {
  let state = createInitialState(reducers)
  const setState = nextState => {
    state = nextState
  }
  const getState = () => {
    return state
  }
  const dispatchActionSubject$ = new Rx.Subject()
  const dispatch = createDispatch(dispatchActionSubject$.onNext.bind(dispatchActionSubject$), getState, middleware)
  const stateStream$ = createState({
    middleware,
    initialState: state,
    actionStreams,
    reducers,
    sideEffects,
    dispatchActionSubject$,
    dispatch,
    getState,
    setState
  })
  const subscribe = (onSuccess, onError = error => { throw error }, onComplete) => {
    return stateStream$.subscribe(onSuccess, onError, onComplete)
  }
  return { getState, dispatch, subscribe }
}

export function createGetState (getter) {
  return function getState () {
    return getter()
  }
}

export function createDispatch (sideEffect, getState, middleware) {
  return function dispatch (action) {
    const appliedAction = appyMiddleware({ middleware, dispatch, getState })(action)
    sideEffect(appliedAction)
    return appliedAction || action
  }
}

export function applyReducer (reducer, stateSection, action) {
  let nextStateSection = stateSection
  const stateSectionReducers = _.isArray(reducer) ? reducer : [reducer]
  for (let reducer of stateSectionReducers) {
    nextStateSection = reducer(stateSection, action)
    if (nextStateSection !== stateSection) {
      break
    }
  }
  return nextStateSection
}

export function reduceState (reducers, state, action) {
  let nextState = state
  for (let key in reducers) {
    const sectionReducer = reducers[key]
    const stateSection = state[key]
    const nextStateSection = applyReducer(sectionReducer, stateSection, action)
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

export function createState ({ middleware, initialState, actionStreams, reducers, sideEffects, dispatch, getState, dispatchActionSubject$, setState }) {
  const appliedActionsStream$ = reduceActionStreams({ actionStreams, middleware, dispatch, getState })
  const store$ = Rx.Observable
    .merge(
      dispatchActionSubject$,
      appliedActionsStream$
    )
    .do(action => {
      if (typeof action !== 'function') {
        console.info(action)
      }
    })
    .scan(({ nextState: prevState }, action) => {
      const nextState = reduceState(reducers, prevState, action)
      setState(nextState)
      return { prevState, nextState, action }
    }, { prevState: undefined, nextState: initialState, action: undefined })
    .do(({ prevState, nextState, action }) => {
      console.info(nextState)
      applySideEffects({ sideEffects, prevState, nextState, action, dispatch })
    })
    .map(({ nextState }) => nextState)
    .share()
  return store$
}

export function reduceActionStreams ({ actionStreams, middleware, dispatch, getState }) {
  const appliedActionsStream$ = _.chain(actionStreams)
    .map(actionStream => {
      const appliedActionStream$ = actionStream
        .map(action => {
          const appliedAction = appyMiddleware({ middleware, dispatch, getState })(action)
          return appliedAction
        })
      return appliedActionStream$
    })
    .thru(appliedActionStreams => Rx.Observable
      .merge(
        ...appliedActionStreams
      )
    )
    .value()
  return appliedActionsStream$
}

export function createInitialState (reducers) {
  const initialState = _.chain(reducers)
    .map((sectionReducer, sectionName) => ({ sectionName, sectionReducer }))
    .reduce((state, next) => {
      const { sectionName, sectionReducer } = next
      const section = applyReducer(sectionReducer, undefined, {})
      const nextState = {
        ...state,
        [sectionName]: section
      }
      return nextState
    }, {})
    .value()
  return initialState
}

export function appyMiddleware ({ middleware = [], dispatch, getState }) {
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
  for (let sideEffect of sideEffects) {
    sideEffect({ prevState, nextState, action, dispatch })
  }
}

export function arrayActionsMiddleware (dispatch, getState, action) {
  if (Array.isArray(action)) {
    for (let arrayAction of action) {
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
