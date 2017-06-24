import { expect } from 'chai'
import sinon from 'sinon'
import {
  applyReducer,
  applySideEffects,
  appyMiddleware,
  arrayActionsMiddleware,
  createInitialState,
  createState,
  functionActionsMiddleware,
  reduceActionStreams,
  reduceState,
  createStore
} from '../src/slexStore'

describe('slexStore', function () {
  const sandbox = sinon.sandbox.create()
  beforeEach(function () {
    sandbox.restore()
  })

  afterEach(function () {
    sandbox.restore()
  })

  describe('applyReducer', function () {
    it('should do something', function () {

    })
  })
})
