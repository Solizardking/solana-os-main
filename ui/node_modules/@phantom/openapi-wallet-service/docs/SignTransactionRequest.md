# SignTransactionRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**derivationInfo** | [**DerivationInfoSchema**](DerivationInfoSchema.md) |  | [optional] [default to undefined]
**organizationId** | **string** |  | [default to undefined]
**policyName** | **string** |  | [optional] [default to undefined]
**transaction** | [**UnsignedTransaction**](UnsignedTransaction.md) |  | [default to undefined]
**walletId** | **string** |  | [default to undefined]

## Example

```typescript
import { SignTransactionRequest } from '@phantom/openapi-wallet-service';

const instance: SignTransactionRequest = {
    derivationInfo,
    organizationId,
    policyName,
    transaction,
    walletId,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
