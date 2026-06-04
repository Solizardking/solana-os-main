# PartialKmsAuthenticator


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**algorithm** | [**Algorithm**](Algorithm.md) |  | [default to undefined]
**publicKey** | **Array&lt;number&gt;** |  | [default to undefined]
**authenticatorKind** | **string** |  | [default to undefined]
**attestationObject** | **string** | The attestation object, as binary. | [default to undefined]
**clientDataJSON** | **string** | The client data JSON, as binary. | [default to undefined]
**credentialId** | **string** |  | [default to undefined]
**transports** | **Array&lt;string&gt;** | The transports used by the authenticator. | [optional] [default to undefined]
**jwkSet** | **object** |  | [default to undefined]
**jwksUrl** | **string** |  | [default to undefined]
**issuerUrl** | **string** |  | [default to undefined]
**idTokenClaims** | [**IdTokenVerificationClaims**](IdTokenVerificationClaims.md) |  | [default to undefined]
**authenticatorName** | **string** |  | [default to undefined]
**expiresInMs** | **number** |  | [optional] [default to undefined]

## Example

```typescript
import { PartialKmsAuthenticator } from '@phantom/openapi-wallet-service';

const instance: PartialKmsAuthenticator = {
    algorithm,
    publicKey,
    authenticatorKind,
    attestationObject,
    clientDataJSON,
    credentialId,
    transports,
    jwkSet,
    jwksUrl,
    issuerUrl,
    idTokenClaims,
    authenticatorName,
    expiresInMs,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
