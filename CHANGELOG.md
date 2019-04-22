# 0.2.0 (04-22-2019) (first release) 
##### Supported features
- View parameters: Tree view, list view
- Filter parameters: Filter by keyword (with highlighting)
- Search parameters: by path (glob (*, **) supported)
  - e.g. `/path/**/*Url`
  - e.g. `*parameter`
- Add new parameters
  - Service parameter (assuming path `/services/{environments}/{serviceName}/{parameterName}`)
  - Generic parameter
  - Supports `String`, `SecureString` (no `StringList` support atm)
    - Supports KMS Key Encryption for `SecureString`
- Edit parameter
  - Change the description, value
  - Change from/to `String` and `SecureString`
- Duplicate parameter
  - Opens the `add new parameters` flow with the values pre-filled.
- Delete parameter
- Copy parameter values with one click
- Refetch/refresh parameters
- Program Auto Updater/Update checker (Buggy?)

##### Note
* _Assumes `eu-west-1` as the environment at the moment. This will be customizable soon._ 
