[![CircleCI](https://circleci.com/gh/alexstroukov/slex-store/tree/master.svg?style=svg)](https://circleci.com/gh/alexstroukov/slex-store/tree/master)
# Slex Store

```
$ npm install slex-store
```

`slex-store` is a uni directional, predictable state container inspired by the ideas of [`flux`](https://facebook.github.io/flux/docs/in-depth-overview.html#content) and [`redux`](http://redux.js.org/docs/introduction/).


## Pipeline 

The uni directional flow refers to the action pipeline. The pipeline runs in the following sequence and is made up of:

`ACTION` - actions are dispatched (`dispatch(action)`) using the dispatcher.

```javascript
const action = {
  type: 'ACTION_NAME',
  ...
}
```

&darr;

`REDUCER` - actions are then given to a reducer along with the current state of the store. The next state of the store is returned. Immutability is assumed. 

```javascript
  const reducer = (state, action) => {
    return {
      ...state,
      ...
    }
  }
```

&darr;

`SIDEEFFECT` - Side effects are triggered after the action has been reduced into the state. Side effects are aware of the state before and after an action was reduced into the state.

```javascript
  const sideEffect = ({ prevState, nextState, action, dispatch, getState }) => {
    if (action.type === 'ACTION_NAME') {
      ...
    }
  }
```

&darr;

`STATE` - Finally, subscribers are notified.

## Example Usage

```javascript
import slexStore from 'slex-store'

const createDispatch = slexStore.compose(
  slexStore.createDispatch
)
const createStore = () => slexStore.createStore(
  createDispatch({
    reducer: slexStore.createReducer({
      store: reducer
    }),
    sideEffects: [...]
  })
)
const store = createStore()

store.subscribe((state) => {
  // rerender your app e.g. ReactDOM.render()
})

```