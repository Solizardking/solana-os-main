# CreateAuthenticatorRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**authenticator** | [**PartialKmsAuthenticator**](PartialKmsAuthenticator.md) |  | [default to undefined]
**organizationId** | **string** |  | [default to undefined]
**replaceExpirable** | **boolean** | Replace the oldest expirable authenticator if one exists, and the user has reached the limit of allowed authenticators. If none exists, reaching the authenticator limit per user will disallow adding more authenticators. | [optional] [default to undefined]
**username** | **string** |  | [default to undefined]

## Example

```typescript
import { CreateAuthenticatorRequest } from '@phantom/openapi-wallet-service';

const instance: CreateAuthenticatorRequest = {
    authenticator,
    organizationId,
    replaceExpirable,
    username,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
