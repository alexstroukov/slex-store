import { expect } from 'chai'
import sinon from 'sinon'
import slexStore from '../src/slexStore'

describe('slexStore', function () {
  const sandbox = sinon.sandbox.create()
  beforeEach(function () {
    sandbox.restore()
  })

  afterEach(function () {
    sandbox.restore()
  })

  describe('createStore', function () {
    it('should return an object', function () {
      const store = slexStore.createStore({})
      expect(store).to.exist
      expect(typeof store === 'object').to.equal(true)
    })
    it('should have dispatch function', function () {
      const store = slexStore.createStore({})
      expect(store.dispatch).to.exist
      expect(typeof store.dispatch === 'function').to.equal(true)
    })
    it('should have getState function', function () {
      const store = slexStore.createStore({})
      expect(store.dispatch).to.exist
      expect(typeof store.getState === 'function').to.equal(true)
    })
    it('should have subscribe function', function () {
      const store = slexStore.createStore({})
      expect(store.dispatch).to.exist
      expect(typeof store.subscribe === 'function').to.equal(true)
    })
    it('should dispatch an initialise action when created to allow reducers to provide an initial state for their store', function () {
      const initialState = {}
      const reducer = (state = initialState, action) => state
      const spyReducer = sandbox.spy(reducer)
      const store =
        slexStore.createStore(
          slexStore.createDispatch({
            reducer: slexStore.createReducer({
              testStore: spyReducer
            })
          })
        )
      expect(spyReducer.calledOnce).to.be.true
      expect(spyReducer.firstCall.args[0]).to.equal(undefined)
      expect(spyReducer.firstCall.args[1]).to.equal(slexStore.initialAction)
      expect(store.getState().testStore).to.equal(initialState)
    })
  })
  describe('sideEffects', function () {
    it('should be triggered in the order they were registered', function () {
      const action = { type: 'testAction' }
      const sideEffect1 = ({ prevState, nextState, action, dispatch }) => action
      const sideEffect2 = ({ prevState, nextState, action, dispatch }) => action
      const spySideEffect1 = sandbox.spy(sideEffect1)
      const spySideEffect2 = sandbox.spy(sideEffect2)
      const store =
        slexStore.createStore(
          slexStore.createDispatch({
            sideEffects: [
              spySideEffect1,
              spySideEffect2
            ]
          })
        )
      store.subscribe(() => {})
      store.dispatch(action)

      expect(spySideEffect1.called).to.be.true
      expect(spySideEffect2.called).to.be.true
      expect(spySideEffect1.calledBefore(spySideEffect2)).to.be.true
    })
    it('should be provided the state before and after the reduction of a dispatched action', function () {
      const initialState = {}
      const reducedState = {}
      const action = { type: 'testAction' }
      const reducer = (state = initialState, action) => {
        switch (action.type) {
          case 'testAction':
            return reducedState
          default:
            return state
        }
      }
      const spyReducer = sandbox.spy(reducer)
      const sideEffect = ({ prevState, nextState, action, dispatch }) => action
      const spySideEffect = sandbox.spy(sideEffect)
      const store =
        slexStore.createStore(
          slexStore.createDispatch({
            reducer: slexStore.createReducer({
              testStore: spyReducer
            }),
            sideEffects: [
              spySideEffect
            ]
          })
        )
      store.subscribe(() => {})
      store.dispatch(action)

      expect(spySideEffect.called).to.be.true
      expect(spySideEffect.firstCall.args[0].prevState.testStore).to.equal(initialState)
      expect(spySideEffect.firstCall.args[0].nextState.testStore).to.equal(reducedState)
    })
    it('should provided the action', function () {
      const action = { type: 'testAction' }
      const sideEffect = ({ prevState, nextState, action, dispatch }) => {
        return
      }
      const spySideEffect = sandbox.spy(sideEffect)
      const store =
        slexStore.createStore(
          slexStore.createDispatch({
            sideEffects: [
              spySideEffect
            ]
          })
        )
      store.subscribe(() => {})
      store.dispatch(action)

      expect(spySideEffect.firstCall.args[0].action).to.equal(action)
    })
    it('should be provided dispatch', function () {
      const action = { type: 'testAction' }
      const sideEffect = ({ prevState, nextState, action, dispatch }) => action
      const spySideEffect = sandbox.spy(sideEffect)
      const store =
        slexStore.createStore(
          slexStore.createDispatch({
            sideEffects: [
              spySideEffect
            ]
          })
        )
      store.subscribe(() => {})
      store.dispatch(action)

      expect(spySideEffect.called).to.be.true
      expect(spySideEffect.firstCall.args[0].dispatch).to.equal(store.dispatch)
    })
  })

  describe('reducers', function () {
    it('should be triggered when an action is dispatched', function () {
      const initialState = {}
      const action = { type: 'testAction' }
      const reducer = (state = initialState, action) => {
        return state
      }
      const spyReducer = sandbox.spy(reducer)
      const store =
        slexStore.createStore(
          slexStore.createDispatch({
            reducer: slexStore.createReducer({
              testStore: spyReducer
            })
          })
        )
      store.subscribe(() => {})
      store.dispatch(action)
      // twice because of initial action
      expect(spyReducer.calledTwice).to.be.true
    })
    it('should be provided the action', function () {
      const initialState = {}
      const action = { type: 'testAction' }
      const reducer = (state = initialState, action) => {
        return state
      }
      const spyReducer = sandbox.spy(reducer)
      const store =
        slexStore.createStore(
          slexStore.createDispatch({
            reducer: slexStore.createReducer({
              testStore: spyReducer
            })
          })
        )
      store.subscribe(() => {})
      store.dispatch(action)
      // twice because of initial action
      expect(spyReducer.secondCall.args[1]).to.equal(action)
    })
    it('should provide the next state for their store', function () {
      const reducedState = {}
      const action = { type: 'testAction' }
      const reducer = (state, action) => {
        return reducedState
      }
      const spyReducer = sandbox.spy(reducer)
      const store =
        slexStore.createStore(
          slexStore.createDispatch({
            reducer: slexStore.createReducer({
              testStore: spyReducer
            })
          })
        )
      store.subscribe(() => {})
      store.dispatch(action)
      expect(store.getState().testStore).to.equal(reducedState)
    })
  })

  describe('dispatch', function () {
    it('should trigger reducers, sideEffects, then subscribers in that order', function () {
      const action = { type: 'testAction' }
      const spyReducer = sandbox.spy((state, action) => ({ ...state, id: Math.random() }))
      const spySideEffect = sandbox.spy()
      const spySubscriber = sandbox.spy()
      const store =
        slexStore.createStore(
          slexStore.createDispatch({
            reducer: slexStore.createReducer({
              testStore: spyReducer
            }),
            sideEffects: [
              spySideEffect
            ]
          })
        )
      store.subscribe(spySubscriber)
      store.dispatch(action)
      expect(spyReducer.calledTwice).to.be.true
      expect(spyReducer.secondCall.calledBefore(spySideEffect.firstCall)).to.be.true

      expect(spySideEffect.calledOnce).to.be.true
      expect(spySideEffect.firstCall.calledAfter(spyReducer.secondCall)).to.be.true
      
      // twice because subscriber is triggered straight away
      expect(spySubscriber.calledTwice).to.be.true
      expect(spySubscriber.secondCall.calledAfter(spySideEffect.firstCall)).to.be.true
    })
  })

  describe('getState', function () {
    it('should return the state of the store', function () {
      const initialState1 = {}
      const initialState2 = {}
      const action = { type: 'testAction' }
      const createDefaultReducer = initialState => (state = initialState, action) => state
      const spyReducer1 = sandbox.spy(createDefaultReducer(initialState1))
      const spyReducer2 = sandbox.spy(createDefaultReducer(initialState2))
      const store =
        slexStore.createStore(
          slexStore.createDispatch({
            reducer: slexStore.createReducer({
              testStore1: spyReducer1,
              testStore2: spyReducer2
            })
          })
        )
      store.subscribe(() => {})
      store.dispatch(action)
      expect(store.getState().testStore1).to.equal(initialState1)
      expect(store.getState().testStore2).to.equal(initialState2)
    })
  })
})
