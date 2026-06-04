# UpdatePartialKmsAuthenticator


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**authenticatorName** | **string** | New name for the authenticator, if provided. If &#x60;None&#x60;, the name will not be updated. | [optional] [default to undefined]
**expiresInMs** | **number** | New expiration time for the authenticator, if provided. If &#x60;None&#x60;, the description will not be updated. | [optional] [default to undefined]

## Example

```typescript
import { UpdatePartialKmsAuthenticator } from '@phantom/openapi-wallet-service';

const instance: UpdatePartialKmsAuthenticator = {
    authenticatorName,
    expiresInMs,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
