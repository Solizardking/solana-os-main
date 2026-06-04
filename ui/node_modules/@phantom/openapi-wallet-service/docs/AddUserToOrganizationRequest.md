# AddUserToOrganizationRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**organizationId** | **string** |  | [default to undefined]
**replaceExpirable** | **boolean** | If true, replace the oldest expirable user if one exists and reaching the user limit per organization. If none exists, reaching the user limit per organization will disallow adding more users. | [optional] [default to undefined]
**user** | [**PartialKmsUser**](PartialKmsUser.md) |  | [default to undefined]

## Example

```typescript
import { AddUserToOrganizationRequest } from '@phantom/openapi-wallet-service';

const instance: AddUserToOrganizationRequest = {
    organizationId,
    replaceExpirable,
    user,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
