# ExportWalletRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**organizationId** | **string** |  | [default to undefined]
**policyName** | **string** |  | [optional] [default to undefined]
**publicKey** | **string** | Base64-encoded X25519 public key | [default to undefined]
**walletId** | **string** |  | [default to undefined]

## Example

```typescript
import { ExportWalletRequest } from '@phantom/openapi-wallet-service';

const instance: ExportWalletRequest = {
    organizationId,
    policyName,
    publicKey,
    walletId,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
