import _ from 'lodash'

class SlexStoreModule {
  initialAction = { type: 'INITIALISE' }
  defaultApplyDispatch = ({ dispatch, getState, setState, notifyListeners }) => {
    return action => {
      return {
        stateChanged: false,
        prevState: getState(),
        nextState: getState(),
        action
      }
    }
  }
  defaultReduce = (state, action) => {
    return state
  }
  compose = _.flow
  createStore = ({ reducer = this.defaultReduce, applyDispatch = this.defaultApplyDispatch, ...rest }) => {
    const { notifyListeners, addListener, removeListener } = this.createListeners()
    const { getState, setState } = this.createInitialState(reducer)
    const dispatch = (action, options) => {
      const { stateChanged, prevState, nextState, action: appliedAction } = appliedDispatch(action, options)
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
  createApplyDispatch = ({ reducer, sideEffects }) => ({ dispatch, getState, setState, notifyListeners }) => {
    const applySideEffects = this.createApplySideEffects({ sideEffects, dispatch, getState })
    return (action, options) => {
      const prevState = getState()
      const { skipHooks = false, appliedPrevState = prevState } = options || {}
      const nextState = reducer(appliedPrevState, action)
      setState(nextState)
      !skipHooks && applySideEffects({ prevState, nextState, action })
      const stateChanged = !_.isEqual(nextState, appliedPrevState)
      if (stateChanged) {
        notifyListeners(nextState, action)
      }
      return {
        stateChanged,
        prevState,
        nextState,
        action
      }
    }
  }
  createDispatch = ({ reducer = this.defaultReduce, sideEffects = [], ...rest }) => {
    return {
      applyDispatch: this.createApplyDispatch({ sideEffects, reducer }),
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
  createApplySideEffects = ({ sideEffects, dispatch, getState }) => {
    return _.chain(sideEffects)
      .reduce((memo, sideEffect) => {
        return ({ prevState, nextState, action }) => {
          memo({ prevState, nextState, action, dispatch, getState })
          sideEffect({ prevState, nextState, action, dispatch, getState })
        }
      }, _.noop)
      .value()
  }
}

export default new SlexStoreModule()
