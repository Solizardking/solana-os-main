# EthereumSignTypedDataRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**derivationInfo** | [**DerivationInfoSchema**](DerivationInfoSchema.md) |  | [optional] [default to undefined]
**organizationId** | **string** |  | [default to undefined]
**policyName** | **string** |  | [optional] [default to undefined]
**typedData** | [**EthereumTypedData**](EthereumTypedData.md) |  | [default to undefined]
**walletId** | **string** |  | [default to undefined]

## Example

```typescript
import { EthereumSignTypedDataRequest } from '@phantom/openapi-wallet-service';

const instance: EthereumSignTypedDataRequest = {
    derivationInfo,
    organizationId,
    policyName,
    typedData,
    walletId,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
