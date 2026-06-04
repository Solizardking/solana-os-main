# EthereumSignMessageRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**derivationInfo** | [**DerivationInfoSchema**](DerivationInfoSchema.md) |  | [optional] [default to undefined]
**message** | **string** | Base64-encoded message to sign | [default to undefined]
**organizationId** | **string** |  | [default to undefined]
**policyName** | **string** |  | [optional] [default to undefined]
**walletId** | **string** |  | [default to undefined]

## Example

```typescript
import { EthereumSignMessageRequest } from '@phantom/openapi-wallet-service';

const instance: EthereumSignMessageRequest = {
    derivationInfo,
    message,
    organizationId,
    policyName,
    walletId,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
