# ImportEnvelope


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**envelope** | **string** | Encrypted material of (16 bytes organization ID + 32 bytes master seed of the ephemeral key). | [default to undefined]
**publicKey** | **string** | Public key of the ephemeral key used to encrypt the envelope. | [default to undefined]

## Example

```typescript
import { ImportEnvelope } from '@phantom/openapi-wallet-service';

const instance: ImportEnvelope = {
    envelope,
    publicKey,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
