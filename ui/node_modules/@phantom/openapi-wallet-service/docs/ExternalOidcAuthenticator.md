# ExternalOidcAuthenticator


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**jwkSet** | **object** |  | [default to undefined]
**jwksUrl** | **string** |  | [default to undefined]
**issuerUrl** | **string** |  | [default to undefined]
**idTokenClaims** | [**IdTokenVerificationClaims**](IdTokenVerificationClaims.md) |  | [default to undefined]

## Example

```typescript
import { ExternalOidcAuthenticator } from '@phantom/openapi-wallet-service';

const instance: ExternalOidcAuthenticator = {
    jwkSet,
    jwksUrl,
    issuerUrl,
    idTokenClaims,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
