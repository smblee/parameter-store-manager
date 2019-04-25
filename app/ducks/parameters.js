/* eslint-disable no-param-reassign */
import AWS from 'aws-sdk';

import { combineReducers } from 'redux';
import chunk from 'lodash/chunk';
import pAll from 'p-all';
import { createSelector } from 'reselect';
import { notification } from 'antd';
import aws from '../clients/aws';

const FETCH_ALL_PARAMETERS_REQUEST = 'FETCH_ALL_PARAMETERS_REQUEST';
const FETCH_ALL_PARAMETERS_FAILURE = 'FETCH_ALL_PARAMETERS_FAILURE';
const FETCH_ALL_PARAMETERS_SUCCESS = 'FETCH_ALL_PARAMETERS_SUCCESS';
const FETCH_ALL_PARAMETERS_BATCH_LOADED = 'FETCH_ALL_PARAMETERS_BATCH_LOADED';

const FETCH_PARAMETER_VALUES_REQUEST = 'FETCH_PARAMETER_VALUES_REQUEST';
const FETCH_PARAMETER_VALUES_FAILURE = 'FETCH_PARAMETER_VALUES_FAILURE';
const FETCH_PARAMETER_VALUES_SUCCESS = 'FETCH_PARAMETER_VALUES_SUCCESS';

const FETCH_KMS_KEYS_REQUEST = 'FETCH_KMS_KEYS_REQUEST';
const FETCH_KMS_KEYS_FAILURE = 'FETCH_KMS_KEYS_FAILURE';
const FETCH_KMS_KEYS_SUCCESS = 'FETCH_KMS_KEYS_SUCCESS';

const CREATE_SERVICE_PARAMETERS_REQUEST = 'CREATE_SERVICE_PARAMETERS_REQUEST';
const CREATE_SERVICE_PARAMETERS_FAILURE = 'CREATE_SERVICE_PARAMETERS_FAILURE';
const CREATE_SERVICE_PARAMETERS_SUCCESS = 'CREATE_SERVICE_PARAMETERS_SUCCESS';

const CREATE_GENERIC_PARAMETER_REQUEST = 'CREATE_GENERIC_PARAMETER_REQUEST';
const CREATE_GENERIC_PARAMETER_FAILURE = 'CREATE_GENERIC_PARAMETER_FAILURE';
const CREATE_GENERIC_PARAMETER_SUCCESS = 'CREATE_GENERIC_PARAMETER_SUCCESS';

const DELETE_PARAMETER_REQUEST = 'DELETE_PARAMETER_REQUEST';
const DELETE_PARAMETER_FAILURE = 'DELETE_PARAMETER_FAILURE';
const DELETE_PARAMETER_SUCCESS = 'DELETE_PARAMETER_SUCCESS';

const fetchAllParameters = () => dispatch => {
  dispatch({ type: FETCH_ALL_PARAMETERS_REQUEST });

  let allParameters = [];

  const recursivelyPopulateParameters = nextToken => {
    aws
      .getSSM()
      .describeParameters(
        { NextToken: nextToken, MaxResults: 50 },
        (err, data) => {
          if (err) {
            dispatch({
              type: FETCH_ALL_PARAMETERS_FAILURE,
              payload: err
            });
          } else {
            dispatch({
              type: FETCH_ALL_PARAMETERS_BATCH_LOADED,
              payload: data.Parameters
            });

            const names = data.Parameters.map(p => p.Name);

            // initiate the action creator to fetch parameter values
            dispatch(fetchParameterValues(names));

            allParameters = [...allParameters, ...data.Parameters];
            if (data.NextToken) {
              recursivelyPopulateParameters(data.NextToken);
            } else {
              dispatch({
                type: FETCH_ALL_PARAMETERS_SUCCESS,
                payload: allParameters
              });
            }
          }
        }
      );
  };

  recursivelyPopulateParameters();
};

const fetchKmsKeys = () => dispatch => {
  dispatch({ type: FETCH_KMS_KEYS_REQUEST });

  const recursivelyFetchKmsKeys = (truncated, nextMarker, arr = []) => {
    if (!truncated) {
      dispatch({
        type: FETCH_KMS_KEYS_SUCCESS,
        payload: arr
      });
      return arr;
    }
    aws
      .getKMS()
      .listAliases({ Limit: 100, Marker: nextMarker })
      .promise()
      .then(res => {
        const validAliases = res.Aliases.filter(alias => alias.TargetKeyId);
        return recursivelyFetchKmsKeys(res.Truncated, res.NextMarker, [
          ...arr,
          ...validAliases
        ]);
      })
      .catch(err => {
        dispatch({ type: FETCH_KMS_KEYS_FAILURE });
        console.error('Something went wrong while fetching KMS Keys.', err);
        return arr;
      });
  };

  recursivelyFetchKmsKeys(true);
};

const fetchParameterValues = names => dispatch => {
  dispatch({ type: FETCH_PARAMETER_VALUES_REQUEST, payload: { names } });

  // AWS limits these calls to 10 per batch.
  const chunkedNames = chunk(names, 10);

  const getParameterRequestActions = chunkedNames.map(currBatchNames => () =>
    aws
      .getSSM()
      .getParameters({
        Names: currBatchNames,
        // TODO: Separate out withDecryption
        WithDecryption: true
      })
      .promise()
      .then(data => {
        // TODO: Enable this if the parameter store values should be updated more frequently.
        // dispatch({ type: FETCH_PARAMETER_VALUES_SUCCESS, payload: data.Parameters });

        // if (data.InvalidParameters.length) {
        //   dispatch({ type: FETCH_PARAMETER_VALUES_FAILURE, payload: data.InvalidParameters });
        // }

        const mapping = data.Parameters.reduce((map, param) => {
          map[param.Name] = param;
          return map;
        }, {});

        return [mapping, data.InvalidParameters];
      })
      .catch(err => {
        console.error('Something went wrong while fetching parameters', err);

        dispatch({
          type: FETCH_PARAMETER_VALUES_FAILURE,
          payload: names
        });
      })
  ); // end of chunk calls

  return pAll(getParameterRequestActions, { concurrency: 2 }).then(
    bulkResults => {
      // res will be a list of [mapping, invalidParameters]
      const nameValueMapping = bulkResults.reduce(
        (map, r) => ({ ...map, ...r[0] }),
        {}
      );
      dispatch({
        type: FETCH_PARAMETER_VALUES_SUCCESS,
        payload: { names: Object.keys(nameValueMapping), nameValueMapping }
      });

      const invalidParameters = bulkResults.reduce(
        (lst, r) => [...lst, ...r[1]],
        []
      );

      if (invalidParameters.length) {
        dispatch({
          type: FETCH_PARAMETER_VALUES_FAILURE,
          payload: { names: invalidParameters }
        });
      }

      return [nameValueMapping, invalidParameters];
    }
  );
};

const createServiceParameters = (
  { serviceName, name, environments, ...rest },
  overwrite = false
) => dispatch => {
  dispatch({ type: CREATE_SERVICE_PARAMETERS_REQUEST });

  const genericParameterNames = environments.map(
    env => `/services/${env}/${serviceName}/${name}`
  );

  const promises = genericParameterNames.map(gName =>
    dispatch(createGenericParameter({ ...rest, name: gName }, overwrite))
  );

  return Promise.all(promises)
    .then(results => {
      dispatch({ type: CREATE_SERVICE_PARAMETERS_SUCCESS });
      dispatch({
        type: CREATE_SERVICE_PARAMETERS_SUCCESS,
        payload: results
      });
      return results;
    })
    .catch(err => {
      dispatch({ type: CREATE_SERVICE_PARAMETERS_FAILURE, payload: err });
      throw err;
    });
};

const createGenericParameter = (
  { name, description, type, kmsKey, value },
  overwrite = false
) => dispatch => {
  dispatch({ type: CREATE_GENERIC_PARAMETER_REQUEST });

  const params = {
    Name: name,
    Type: type,
    Value: value,
    Description: description,
    KeyId: kmsKey,
    Overwrite: overwrite,
    Tags: overwrite
      ? null
      : [
          {
            Key: 'createdFrom',
            Value: 'ParameterStoreManager'
          }
        ]
  };
  return aws
    .getSSM()
    .putParameter(params)
    .promise()
    .then(res => {
      console.log(res);
      dispatch({
        type: CREATE_GENERIC_PARAMETER_SUCCESS,
        payload: { response: res, params }
      });
      return res;
    })
    .catch(err => {
      dispatch({ type: CREATE_GENERIC_PARAMETER_FAILURE, payload: err });
      throw err;
    });
};

const deleteParameter = name => dispatch => {
  dispatch({ type: DELETE_PARAMETER_REQUEST });

  const params = {
    Name: name
  };
  return aws
    .getSSM()
    .deleteParameter(params)
    .promise()
    .then(res => {
      dispatch({
        type: DELETE_PARAMETER_SUCCESS,
        payload: { response: res, name }
      });
      return res;
    })
    .catch(err => {
      dispatch({ type: DELETE_PARAMETER_FAILURE, payload: err });
      throw err;
    });
};

export const actions = {
  fetchAllParameters,
  fetchKmsKeys,
  createServiceParameters,
  createGenericParameter,
  deleteParameter
};

function parameterNames(state = [], action) {
  switch (action.type) {
    // reset if fetch all request comes in
    case FETCH_ALL_PARAMETERS_REQUEST:
      return [];
    case FETCH_ALL_PARAMETERS_BATCH_LOADED: {
      return [...new Set([...state, ...action.payload.map(res => res.Name)])];
    }
    case CREATE_GENERIC_PARAMETER_SUCCESS: {
      return [...new Set([...state, action.payload.params.Name])];
    }
    case DELETE_PARAMETER_SUCCESS: {
      return state.filter(name => name !== action.payload.name);
    }
    default:
      return state;
  }
}

function parametersByName(state = {}, action) {
  switch (action.type) {
    case FETCH_ALL_PARAMETERS_BATCH_LOADED: {
      const mapping = action.payload.reduce(
        (map, parameter) => ({
          ...map,
          [parameter.Name]: parameter
        }),
        {}
      );
      return { ...state, ...mapping };
    }
    case CREATE_GENERIC_PARAMETER_SUCCESS: {
      const parameter = {
        ...action.payload.params,
        LastModifiedDate: new Date(),
        LastModifiedUser: 'Parameter Store Manager',
        LoadedLocally: true,
        Version: 1
      };
      return { ...state, [action.payload.params.Name]: parameter };
    }
    default:
      return state;
  }
}

function valuesByName(state = {}, action) {
  switch (action.type) {
    case FETCH_PARAMETER_VALUES_SUCCESS: {
      return { ...state, ...action.payload.nameValueMapping };
    }
    case CREATE_GENERIC_PARAMETER_SUCCESS: {
      const parameter = {
        ...action.payload.params,
        LastModifiedDate: new Date(),
        LastModifiedUser: 'Parameter Store Manager',
        LoadedLocally: true,
        Version: 1
      };
      return { ...state, [action.payload.params.Name]: parameter };
    }
    default:
      return state;
  }
}

const fetchParameterValuesKey = name => `FETCH_PARAMETER_VALUES:${name}`;
const setAllTo = (bool, stringKeys) =>
  stringKeys.reduce((map, stringKey) => {
    map[stringKey] = bool;
    return map;
  }, {});

function lastUpdatedDate(state = {}, action) {
  switch (action.type) {
    case FETCH_ALL_PARAMETERS_SUCCESS:
      return { ...state, FETCH_ALL_PARAMETERS: new Date() };
    case FETCH_KMS_KEYS_REQUEST:
      return { ...state, FETCH_KMS_KEYS: true };
    case FETCH_KMS_KEYS_FAILURE:
    case FETCH_KMS_KEYS_SUCCESS:
      return { ...state, FETCH_KMS_KEYS: new Date() };

    default:
      return state;
  }
}

function isLoading(state = {}, action) {
  switch (action.type) {
    case FETCH_ALL_PARAMETERS_REQUEST:
      return { ...state, FETCH_ALL_PARAMETERS: true };
    case FETCH_ALL_PARAMETERS_FAILURE:
    case FETCH_ALL_PARAMETERS_SUCCESS:
      return { ...state, FETCH_ALL_PARAMETERS: false };
    case FETCH_PARAMETER_VALUES_REQUEST:
      return {
        ...state,
        ...setAllTo(
          true,
          action.payload.names.map(name => fetchParameterValuesKey(name))
        )
      };
    case FETCH_PARAMETER_VALUES_SUCCESS:
    case FETCH_PARAMETER_VALUES_FAILURE:
      return {
        ...state,
        ...setAllTo(
          false,
          action.payload.names.map(name => fetchParameterValuesKey(name))
        )
      };
    case FETCH_KMS_KEYS_REQUEST:
      return { ...state, FETCH_KMS_KEYS: true };
    case FETCH_KMS_KEYS_FAILURE:
    case FETCH_KMS_KEYS_SUCCESS:
      return { ...state, FETCH_KMS_KEYS: false };

    default:
      return state;
  }
}

function isLoaded(state = {}, action) {
  switch (action.type) {
    case FETCH_ALL_PARAMETERS_REQUEST:
    case FETCH_ALL_PARAMETERS_FAILURE:
      return { ...state, FETCH_ALL_PARAMETERS: false };
    case FETCH_ALL_PARAMETERS_SUCCESS:
      return { ...state, FETCH_ALL_PARAMETERS: true };
    case FETCH_PARAMETER_VALUES_REQUEST:
    case FETCH_PARAMETER_VALUES_FAILURE:
      return {
        ...state,
        ...setAllTo(
          false,
          action.payload.names.map(name => fetchParameterValuesKey(name))
        )
      };
    case FETCH_PARAMETER_VALUES_SUCCESS:
      return {
        ...state,
        ...setAllTo(
          true,
          action.payload.names.map(name => fetchParameterValuesKey(name))
        )
      };

    case FETCH_KMS_KEYS_REQUEST:
    case FETCH_KMS_KEYS_FAILURE:
      return { ...state, FETCH_KMS_KEYS: false };
    case FETCH_KMS_KEYS_SUCCESS:
      return { ...state, FETCH_KMS_KEYS: true };

    default:
      return state;
  }
}

function hasError(state = {}, action) {
  switch (action.type) {
    case FETCH_ALL_PARAMETERS_REQUEST:
    case FETCH_ALL_PARAMETERS_SUCCESS:
      return { ...state, FETCH_ALL_PARAMETERS: false };
    case FETCH_ALL_PARAMETERS_FAILURE:
      return { ...state, FETCH_ALL_PARAMETERS: true };
    case FETCH_PARAMETER_VALUES_REQUEST:
    case FETCH_PARAMETER_VALUES_SUCCESS:
      return {
        ...state,
        ...setAllTo(
          false,
          action.payload.names.map(name => fetchParameterValuesKey(name))
        )
      };
    case FETCH_PARAMETER_VALUES_FAILURE:
      return {
        ...state,
        ...setAllTo(
          true,
          action.payload.names.map(name => fetchParameterValuesKey(name))
        )
      };
    case FETCH_KMS_KEYS_REQUEST:
    case FETCH_KMS_KEYS_SUCCESS:
      return { ...state, FETCH_KMS_KEYS: false };
    case FETCH_KMS_KEYS_FAILURE:
      return { ...state, FETCH_KMS_KEYS: true };
    default:
      return state;
  }
}

function kmsKeys(state = [], action) {
  switch (action.type) {
    case FETCH_KMS_KEYS_SUCCESS:
      return action.payload;

    default:
      return state;
  }
}

const parametersReducer = combineReducers({
  names: parameterNames,
  parametersByName,
  valuesByName,
  isLoading,
  isLoaded,
  hasError,
  kmsKeys,
  lastUpdatedDate
});

export default parametersReducer;

// - SELECTORS

const getNames = state => state.parameters.names;
const getParametersByName = state => state.parameters.parametersByName;
const getValuesByName = state => state.parameters.valuesByName;
const getAllParameters = createSelector(
  [getNames, getParametersByName, getValuesByName],
  (names, parametersMap, valuesMap) => {
    names.sort();
    return names.map(name => ({ ...parametersMap[name], ...valuesMap[name] }));
  }
);

const getIsAllParametersLoaded = state =>
  state.parameters.isLoaded.FETCH_ALL_PARAMETERS;
const getIsAllParametersLoading = state =>
  state.parameters.isLoading.FETCH_ALL_PARAMETERS;
const getHasAllParametersErrored = state =>
  state.parameters.hasError.FETCH_ALL_PARAMETERS;

const getLastUpdatedDate = state => state.parameters.lastUpdatedDate;

const getAllParametersLastUpdatedDate = createSelector(
  [getLastUpdatedDate],
  lastUpdatedDates => lastUpdatedDates.FETCH_ALL_PARAMETERS
);

const getIsKmsKeyLoaded = state => state.parameters.isLoaded.FETCH_KMS_KEYS;
const getIsKmsKeyLoading = state => state.parameters.isLoading.FETCH_KMS_KEYS;
const getKmsKeyLoadHasError = state => state.parameters.hasError.FETCH_KMS_KEYS;
const getKmsKeys = state => state.parameters.kmsKeys;

const getAllServiceNames = createSelector(
  [getNames],
  names => {
    const regex = /\/services\/.+\/([\w\d]+)\/.+/;
    return [
      ...new Set(
        names.map(name => {
          const matches = name.match(regex);
          return matches ? matches[1] : null;
        })
      )
    ].filter(name => name);
  }
);

export const selectors = {
  getAllParameters,
  getIsAllParametersLoaded,
  getIsAllParametersLoading,
  getHasAllParametersErrored,
  getIsKmsKeyLoaded,
  getIsKmsKeyLoading,
  getKmsKeyLoadHasError,
  getKmsKeys,
  getAllServiceNames,
  getAllParametersLastUpdatedDate
};

// const getFulfillersById = state => state.identities.fulfillers.byId;
// const getFulfillerPermissionMap = state => state.identities.fulfillers.permissionMap;
// const getFetchFulfillerStatus = state => state.identities.fulfillers.fetchStatus;
// const getFetchFulfillerPermissionStatus = state => state.identities.fulfillers.fetchPermissionStatus;
// const getFulfillersSortedByName = createSelector([getFulfillerIds, getFulfillersById], (ids, map) => {
//   ids.sort((id1, id2) => identityNameComparer(id1, id2, map));
//   return ids.map(id => map[id]);
// });
//
//
