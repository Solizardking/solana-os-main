# GrantOrganizationAccessRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**ownerOrganizationId** | **string** |  | [default to undefined]
**policy** | [**VersionedOrganizationPolicy**](VersionedOrganizationPolicy.md) |  | [default to undefined]
**policyName** | **string** | If specified, this grant be added in addition to another grant(s) to the same target organization for the same wallet (i.e. with different policies). However, access through this grant, will only be possible if policy name is specified in the request. | [optional] [default to undefined]
**targetOrganizationId** | **string** |  | [default to undefined]
**transactionPolicy** | [**VersionedTransactionPolicy**](VersionedTransactionPolicy.md) |  | [optional] [default to undefined]
**walletId** | **string** |  | [default to undefined]

## Example

```typescript
import { GrantOrganizationAccessRequest } from '@phantom/openapi-wallet-service';

const instance: GrantOrganizationAccessRequest = {
    ownerOrganizationId,
    policy,
    policyName,
    targetOrganizationId,
    transactionPolicy,
    walletId,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
