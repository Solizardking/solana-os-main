# UserPolicy


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**type** | **string** |  | [default to undefined]
**constants** | [**Array&lt;CelPolicyConstant&gt;**](CelPolicyConstant.md) |  | [default to undefined]
**rules** | [**Array&lt;CelPolicyRule&gt;**](CelPolicyRule.md) |  | [default to undefined]
**preset** | **string** |  | [default to undefined]
**usdLimit** | [**UsdLimitSettings**](UsdLimitSettings.md) |  | [optional] [default to undefined]
**walletId** | **string** |  | [default to undefined]

## Example

```typescript
import { UserPolicy } from '@phantom/openapi-wallet-service';

const instance: UserPolicy = {
    type,
    constants,
    rules,
    preset,
    usdLimit,
    walletId,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
