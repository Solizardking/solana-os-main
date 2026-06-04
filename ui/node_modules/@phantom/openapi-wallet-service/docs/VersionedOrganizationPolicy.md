# VersionedOrganizationPolicy


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**derivationAllowlist** | [**Array&lt;DerivationInfoSchema&gt;**](DerivationInfoSchema.md) | Allowlist of derivation paths that can be used with this policy. None means no restrictions. | [optional] [default to undefined]
**scopes** | [**Array&lt;OrganizationWalletScope&gt;**](OrganizationWalletScope.md) | Scopes that this policy is allowed to perform. | [default to undefined]
**version** | **string** |  | [default to undefined]
**constants** | [**Array&lt;CelPolicyConstant&gt;**](CelPolicyConstant.md) |  | [default to undefined]
**rules** | [**Array&lt;CelPolicyRule&gt;**](CelPolicyRule.md) |  | [default to undefined]
**preset** | **string** |  | [default to undefined]
**usdLimit** | [**UsdLimitSettings**](UsdLimitSettings.md) |  | [optional] [default to undefined]
**walletId** | **string** |  | [default to undefined]
**rootAccess** | [**OrganizationRootAccess**](OrganizationRootAccess.md) |  | [default to undefined]

## Example

```typescript
import { VersionedOrganizationPolicy } from '@phantom/openapi-wallet-service';

const instance: VersionedOrganizationPolicy = {
    derivationAllowlist,
    scopes,
    version,
    constants,
    rules,
    preset,
    usdLimit,
    walletId,
    rootAccess,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
