// @flow
import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';
import parametersReducer from './parameters';

export default function createRootReducer(history: History) {
  return combineReducers({
    router: connectRouter(history),
    parameters: parametersReducer
  });
}
