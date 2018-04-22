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
  createStore = ({ reducer = this.defaultReduce, applyDispatch = this.defaultApplyDispatch, ...rest }) => {
    const { notifyListeners, addListener, removeListener } = this.createListeners()
    const { getState, setState } = this.createInitialState(reducer)
    const dispatch = (action, options) => {
      const { stateChanged, prevState, nextState, appliedAction } = appliedDispatch(action, options)
      return appliedAction
    }
    const appliedDispatch = applyDispatch({ dispatch, getState, setState, notifyListeners })
    const subscribe = (listener) => {
      addListener(listener)
      listener(getState(), this.initialAction)
      return () => {
        removeListener(listener)
      }
    }
    return { getState, dispatch, subscribe, ...rest }
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
    function notifyListeners (state, action) {
      for (const listener of listeners) {
        listener(state, action)
      }
    }
    return {
      notifyListeners,
      addListener,
      removeListener
    }
  }
  createDispatch = ({ reducer = this.defaultReduce, middleware = [], sideEffects = [], ...rest }) => {
    const applyDispatch = ({ dispatch, getState, setState, notifyListeners }) => {
      const applyMiddleware = this.createApplyMiddleware({ middleware, dispatch, getState })
      const applySideEffects = this.createApplySideEffects({ sideEffects, dispatch })
      return (action, options) => {
        const prevState = getState()
        const { skipHooks = false, appliedPrevState = prevState } = options || {}
        const appliedAction = skipHooks
          ? action
          : applyMiddleware(action)
        const nextState = reducer(appliedPrevState, appliedAction)
        setState(nextState)
        !skipHooks && applySideEffects({ prevState, nextState, action: appliedAction })
        const stateChanged = !_.isEqual(nextState, appliedPrevState)
        if (stateChanged) {
          notifyListeners(nextState, appliedAction || action)
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
      reducer,
      ...rest
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
  createApplyMiddleware = ({ middleware, dispatch, getState }) => {
    return _.chain([this.arrayActionsMiddleware, ...middleware])
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
  createApplySideEffects = ({ sideEffects, dispatch }) => {
    return _.chain(sideEffects)
      .reduce((memo, sideEffect) => {
        return ({ prevState, nextState, action }) => {
          memo({ prevState, nextState, action, dispatch })
          sideEffect({ prevState, nextState, action, dispatch })
        }
      }, _.noop)
      .value()
  }
  arrayActionsMiddleware = (dispatch, getState, action) => {
    if (Array.isArray(action)) {
      for (const arrayAction of action) {
        dispatch(arrayAction)
      }
    }
    return action
  }  
}

export default new SlexStoreModule()
