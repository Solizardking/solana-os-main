# SignUtf8MessageRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**algorithm** | [**Algorithm**](Algorithm.md) |  | [default to undefined]
**derivationInfo** | [**DerivationInfoSchema**](DerivationInfoSchema.md) |  | [default to undefined]
**message** | **string** |  | [default to undefined]
**organizationId** | **string** |  | [default to undefined]
**policyName** | **string** |  | [optional] [default to undefined]
**walletId** | **string** |  | [default to undefined]

## Example

```typescript
import { SignUtf8MessageRequest } from '@phantom/openapi-wallet-service';

const instance: SignUtf8MessageRequest = {
    algorithm,
    derivationInfo,
    message,
    organizationId,
    policyName,
    walletId,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
