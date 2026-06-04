# VersionedOrganizationPolicyOneOf


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**derivationAllowlist** | [**Array&lt;DerivationInfoSchema&gt;**](DerivationInfoSchema.md) | Allowlist of derivation paths that can be used with this policy. None means no restrictions. | [optional] [default to undefined]
**scopes** | [**Array&lt;OrganizationWalletScope&gt;**](OrganizationWalletScope.md) | Scopes that this policy is allowed to perform. | [default to undefined]
**version** | **string** |  | [default to undefined]

## Example

```typescript
import { VersionedOrganizationPolicyOneOf } from '@phantom/openapi-wallet-service';

const instance: VersionedOrganizationPolicyOneOf = {
    derivationAllowlist,
    scopes,
    version,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
