# UpdateUserInOrganizationRequest

Request to update a user in an organization. Supports only changing user policy and traits

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**addTraits** | **{ [key: string]: string; }** |  | [optional] [default to undefined]
**newPolicy** | [**UserPolicy**](UserPolicy.md) |  | [optional] [default to undefined]
**organizationId** | **string** |  | [default to undefined]
**removeTraits** | **Array&lt;string&gt;** |  | [optional] [default to undefined]
**username** | **string** |  | [default to undefined]

## Example

```typescript
import { UpdateUserInOrganizationRequest } from '@phantom/openapi-wallet-service';

const instance: UpdateUserInOrganizationRequest = {
    addTraits,
    newPolicy,
    organizationId,
    removeTraits,
    username,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
