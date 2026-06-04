# OrganizationToWallet


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**deletedAtMs** | **number** |  | [optional] [default to undefined]
**organizationId** | **string** |  | [default to undefined]
**organizationPolicy** | [**VersionedOrganizationPolicy**](VersionedOrganizationPolicy.md) |  | [default to undefined]
**policyName** | **string** |  | [optional] [default to undefined]
**transactionPolicy** | [**VersionedTransactionPolicy**](VersionedTransactionPolicy.md) |  | [optional] [default to undefined]
**walletId** | **string** |  | [default to undefined]

## Example

```typescript
import { OrganizationToWallet } from '@phantom/openapi-wallet-service';

const instance: OrganizationToWallet = {
    deletedAtMs,
    organizationId,
    organizationPolicy,
    policyName,
    transactionPolicy,
    walletId,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
