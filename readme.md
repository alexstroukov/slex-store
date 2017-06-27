# Slex Store

```
$ npm install slex-store
```

`slex-store` is a state management store implementation similar to [`redux`](http://redux.js.org/docs/introduction/). It follows the [`flux`](https://facebook.github.io/flux/docs/in-depth-overview.html#content) architecture philosophy and exposes a uni-directional, predictable state container.

`ACTION` - actions are dispatched (`dispatch(action)`) or merged from an `rx` stream via action streams. Out of the box `slex-store` supports 3 types of actions:
  - `object` - `{ type, ... }`
  - `thunk` - `(...args) => (dispatch, getState) => any`
  - `array` - `[{ type, ... }]`

&darr;

`MIDDLEWARE` - they are then passed through middleware where side effects can be triggered based in the current state and the action `(dispatch, getState, action) => action | void`

&darr;

`REDUCER` - actions are then given to a reducer along with the current state of the store. The next state of the store is returned. Immutability is useful here. `(state, action) => nextState`

&darr;

`SIDEEFFECT` - Side effects are triggered. Side effects are aware of the state before and after an action was reduced into the state. `({ prevState, nextState, action, dispatch }) => void`

&darr;

`STATE` - Finally, subscribers are notified.

## Example Usage

```javascript
import createStore from 'slex-store'

const store = createStore({
  reducers: {
    route: reduceRoute
  },
  middleware: [
    routeMiddleware
  ],
  sideEffects: [
    authSideEffects
  ],
  actionStreams: [
    loginFromCacheActionStream$
  ]
})

store.subscribe((state) => {
  // rerender your app e.g. ReactDOM.render()
})

```