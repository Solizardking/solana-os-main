# SimulateTransactionRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**transaction** | **Array&lt;number&gt;** | Transaction bytes | [default to undefined]
**organizationId** | **string** |  | [default to undefined]
**walletId** | **string** |  | [default to undefined]
**derivationInfo** | [**DerivationInfo**](DerivationInfo.md) |  | [optional] [default to undefined]

## Example

```typescript
import { SimulateTransactionRequest } from '@phantom/openapi-wallet-service';

const instance: SimulateTransactionRequest = {
    transaction,
    organizationId,
    walletId,
    derivationInfo,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
