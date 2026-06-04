# KmsRpcResponseV2


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**result** | [**KmsResult**](KmsResult.md) |  | [default to undefined]
**signature** | **string** |  | [optional] [default to undefined]
**error** | [**KmcRpcResponseV2ErrorDetails**](KmcRpcResponseV2ErrorDetails.md) |  | [default to undefined]
**requestId** | **string** |  | [default to undefined]

## Example

```typescript
import { KmsRpcResponseV2 } from '@phantom/openapi-wallet-service';

const instance: KmsRpcResponseV2 = {
    result,
    signature,
    error,
    requestId,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
