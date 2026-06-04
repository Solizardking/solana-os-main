# ComputeBudgetLimit

Rule to limit the number of compute units and compute unit price in a transaction.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**maxComputeUnitPrice** | **number** |  | [optional] [default to undefined]
**maxComputeUnits** | **number** |  | [optional] [default to undefined]

## Example

```typescript
import { ComputeBudgetLimit } from '@phantom/openapi-wallet-service';

const instance: ComputeBudgetLimit = {
    maxComputeUnitPrice,
    maxComputeUnits,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
