# EIP1559JSONTransaction


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**chainId** | **number** |  | [default to undefined]
**data** | **string** |  | [optional] [default to undefined]
**gasLimit** | **number** |  | [default to undefined]
**maxFeePerGas** | **number** |  | [default to undefined]
**maxPriorityFeePerGas** | **number** |  | [default to undefined]
**nonce** | **number** |  | [default to undefined]
**to** | **string** |  | [default to undefined]
**value** | **string** |  | [default to undefined]
**kind** | **string** |  | [default to undefined]

## Example

```typescript
import { EIP1559JSONTransaction } from '@phantom/openapi-wallet-service';

const instance: EIP1559JSONTransaction = {
    chainId,
    data,
    gasLimit,
    maxFeePerGas,
    maxPriorityFeePerGas,
    nonce,
    to,
    value,
    kind,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
