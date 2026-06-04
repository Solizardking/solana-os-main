# PasskeyAuthenticator


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**attestationObject** | **string** | The attestation object, as binary. | [default to undefined]
**clientDataJSON** | **string** | The client data JSON, as binary. | [default to undefined]
**credentialId** | **string** |  | [default to undefined]
**transports** | **Array&lt;string&gt;** | The transports used by the authenticator. | [optional] [default to undefined]
**authenticatorKind** | **string** |  | [default to undefined]

## Example

```typescript
import { PasskeyAuthenticator } from '@phantom/openapi-wallet-service';

const instance: PasskeyAuthenticator = {
    attestationObject,
    clientDataJSON,
    credentialId,
    transports,
    authenticatorKind,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
