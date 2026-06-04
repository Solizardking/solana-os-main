# ExternalCelPolicy

Generic policy based on Common Expression Language (CEL) and a layer of JSON config on top of it: - allow/deny rules, each with a CEL expression - constants (values that can be used in the CEL expressions) - comments  Initially used by KMS transaction policies, but can be used in other places as well.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**constants** | [**Array&lt;CelPolicyConstant&gt;**](CelPolicyConstant.md) |  | [default to undefined]
**rules** | [**Array&lt;CelPolicyRule&gt;**](CelPolicyRule.md) |  | [default to undefined]
**preset** | **string** |  | [default to undefined]
**usdLimit** | [**UsdLimitSettings**](UsdLimitSettings.md) |  | [optional] [default to undefined]
**walletId** | **string** |  | [default to undefined]

## Example

```typescript
import { ExternalCelPolicy } from '@phantom/openapi-wallet-service';

const instance: ExternalCelPolicy = {
    constants,
    rules,
    preset,
    usdLimit,
    walletId,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
