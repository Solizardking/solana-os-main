# CelPolicyPresetOneOf2

A preset for user policy created for a specific dapp connection (\"User Wallet\" use case).

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**preset** | **string** |  | [default to undefined]
**usdLimit** | [**UsdLimitSettings**](UsdLimitSettings.md) |  | [optional] [default to undefined]
**walletId** | **string** |  | [default to undefined]

## Example

```typescript
import { CelPolicyPresetOneOf2 } from '@phantom/openapi-wallet-service';

const instance: CelPolicyPresetOneOf2 = {
    preset,
    usdLimit,
    walletId,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
