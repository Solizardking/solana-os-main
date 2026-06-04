# SignRawPayloadRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**algorithm** | [**Algorithm**](Algorithm.md) |  | [default to undefined]
**derivationInfo** | [**DerivationInfoSchema**](DerivationInfoSchema.md) |  | [optional] [default to undefined]
**organizationId** | **string** |  | [default to undefined]
**payload** | **string** | Base64-encoded payload to sign | [default to undefined]
**policyName** | **string** |  | [optional] [default to undefined]
**walletId** | **string** |  | [default to undefined]

## Example

```typescript
import { SignRawPayloadRequest } from '@phantom/openapi-wallet-service';

const instance: SignRawPayloadRequest = {
    algorithm,
    derivationInfo,
    organizationId,
    payload,
    policyName,
    walletId,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
