# OIDCAuthenticator


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**jwkSet** | **object** |  | [default to undefined]
**jwksUrl** | **string** |  | [default to undefined]
**issuerUrl** | **string** |  | [default to undefined]
**idTokenClaims** | [**IdTokenVerificationClaims**](IdTokenVerificationClaims.md) |  | [default to undefined]
**authenticatorKind** | **string** |  | [default to undefined]

## Example

```typescript
import { OIDCAuthenticator } from '@phantom/openapi-wallet-service';

const instance: OIDCAuthenticator = {
    jwkSet,
    jwksUrl,
    issuerUrl,
    idTokenClaims,
    authenticatorKind,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
