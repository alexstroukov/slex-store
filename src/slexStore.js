import _ from 'lodash'

class SlexStoreModule {

  initialAction = { type: 'INITIALISE' }
  
  defaultApplyDispatch = ({ dispatch, getState, setState, notifyListeners }) => {
    return action => {
      return {
        stateChanged: false,
        prevState: getState(),
        nextState: getState(),
        appliedAction: action
      }
    }
  }
  
  defaultReduce = (state, action) => {
    return state
  }
  
  createStore = ({ reducer = this.defaultReduce, applyDispatch = this.defaultApplyDispatch }) => {
    const { notifyListeners, addListener, removeListener } = this.createListeners()
    const { getState, setState } = this.createInitialState(reducer)
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
  
  createReducer = (reducers) => {
    return _.chain(reducers)
      .map((storeReducer, storeName) => ({ storeReducer, storeName }))
      .reduce((memo, { storeReducer, storeName }) => {
        return (state, action) => {
          const stateSection = state
            ? state[storeName]
            : undefined
          const nextStateSection = storeReducer(stateSection, action)
          const nextState = {
            ...state,
            [storeName]: nextStateSection
          }
          return memo(nextState, action)
        }
      }, this.defaultReduce)
      .value()
  }
  
  createListeners = () => {
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
  
  createDispatch = ({ reducer = this.defaultReduce, middleware = [], sideEffects = [] }) => {
    const applyDispatch = ({ dispatch, getState, setState, notifyListeners }) => {
      return action => {
        const appliedAction = this.applyMiddleware({ middleware, dispatch, getState })(action)
        const prevState = getState()
        const nextState = reducer(prevState, appliedAction)
        this.applySideEffects({ sideEffects, prevState, nextState, action: appliedAction, dispatch })
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
  
  createInitialState = (reducer) => {
    let state = reducer(undefined, this.initialAction)
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
  
  applyMiddleware = ({ middleware = [], dispatch, getState }) => {
    return _.chain([this.functionActionsMiddleware, this.arrayActionsMiddleware, ...middleware])
      .map(middlewareFn => _.chain(middlewareFn)
        .partial(dispatch, getState)
        .wrap((func, action) => {
          const appliedAction = func(action)
          if (appliedAction && !appliedAction.then) {
            return appliedAction
          } else {
            return action
          }
        })
        .value()
      )
      .thru(middlewareFns => _.flow(middlewareFns))
      .value()
  }
  
  applySideEffects = ({ sideEffects, prevState, nextState, action, dispatch }) => {
    for (const sideEffect of sideEffects) {
      sideEffect({ prevState, nextState, action, dispatch })
    }
  }
  
  arrayActionsMiddleware = (dispatch, getState, action) => {
    if (Array.isArray(action)) {
      for (const arrayAction of action) {
        dispatch(arrayAction)
      }
    }
    return action
  }
  
  functionActionsMiddleware = (dispatch, getState, action) => {
    if (typeof action === 'function') {
      return action(dispatch, getState)
    }
    return action
  }
  
}

export default new SlexStoreModule()
