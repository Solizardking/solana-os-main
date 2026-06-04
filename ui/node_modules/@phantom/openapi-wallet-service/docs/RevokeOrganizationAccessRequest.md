# RevokeOrganizationAccessRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**ownerOrganizationId** | **string** |  | [default to undefined]
**targetOrganizationId** | **string** |  | [default to undefined]
**targetPolicyName** | **string** | If provided, remove the access grant with this specific policy name. If not provided, default grant will be removed, which is the one without a policy name. Note that it might mean that there are still other grants to the same target organization. | [optional] [default to undefined]
**walletId** | **string** |  | [default to undefined]

## Example

```typescript
import { RevokeOrganizationAccessRequest } from '@phantom/openapi-wallet-service';

const instance: RevokeOrganizationAccessRequest = {
    ownerOrganizationId,
    targetOrganizationId,
    targetPolicyName,
    walletId,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
