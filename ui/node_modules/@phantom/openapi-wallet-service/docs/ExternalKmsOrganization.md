# ExternalKmsOrganization


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**organizationId** | **string** |  | [default to undefined]
**organizationName** | **string** |  | [default to undefined]
**parentOrganizationId** | **string** |  | [optional] [default to undefined]
**tags** | **Array&lt;string&gt;** |  | [default to undefined]
**users** | [**Array&lt;KmsOrgUser&gt;**](KmsOrgUser.md) |  | [default to undefined]

## Example

```typescript
import { ExternalKmsOrganization } from '@phantom/openapi-wallet-service';

const instance: ExternalKmsOrganization = {
    organizationId,
    organizationName,
    parentOrganizationId,
    tags,
    users,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
