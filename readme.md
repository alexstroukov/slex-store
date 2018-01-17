# Slex Store

```
$ npm install slex-store
```

`slex-store` is a uni directional, predictable state container inspired by the ideas of [`flux`](https://facebook.github.io/flux/docs/in-depth-overview.html#content) and [`redux`](http://redux.js.org/docs/introduction/).


## Pipeline 

The uni directional flow refers to the action pipeline. The pipeline runs in the following sequence and is made up of:

`ACTION` - actions are dispatched (`dispatch(action)`) using the dispatcher. Out of the box `slex-store` supports 3 types of actions:
  - `object` - `{ type, ... }`
  - `array` - `[{ type, ... }]`

&darr;

`MIDDLEWARE` - they are then passed through middleware where side effects can be triggered based in the current state and the action `(dispatch, getState, action) => action | void`. Middleware can swallow or modify actions before they make it to reducers or to the next registered middleware in the list. Returning promises results in the same result as returning the original action or void to simplify testing.

&darr;

`REDUCER` - actions are then given to a reducer along with the current state of the store. The next state of the store is returned. Immutability is useful here. `(state, action) => nextState`

&darr;

`SIDEEFFECT` - Side effects are triggered after the action has been reduced into the state. Side effects are aware of the state before and after an action was reduced into the state. `({ prevState, nextState, action, dispatch }) => void`

&darr;

`STATE` - Finally, subscribers are notified.

## Example Usage

```javascript
import slexStore from 'slex-store'

const store =
  slexStore.createStore(
    slexStore.createDispatch({
      reducer: slexStore.createReducer({
        store: reducer
      }),
      middleware: [...],
      sideEffects: [...]
    })
  )

store.subscribe((state) => {
  // rerender your app e.g. ReactDOM.render()
})

```