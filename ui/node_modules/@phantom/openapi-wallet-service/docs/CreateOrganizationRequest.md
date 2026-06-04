# CreateOrganizationRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**organizationName** | **string** |  | [default to undefined]
**tags** | **Array&lt;string&gt;** |  | [optional] [default to undefined]
**users** | [**Array&lt;PartialKmsUser&gt;**](PartialKmsUser.md) |  | [default to undefined]

## Example

```typescript
import { CreateOrganizationRequest } from '@phantom/openapi-wallet-service';

const instance: CreateOrganizationRequest = {
    organizationName,
    tags,
    users,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
