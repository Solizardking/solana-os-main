# KmsOrgUser


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**authenticators** | [**Array&lt;ExternalKmsAuthenticator&gt;**](ExternalKmsAuthenticator.md) |  | [default to undefined]
**createdAtMs** | **number** |  | [optional] [default to undefined]
**expiresAtMs** | **number** |  | [optional] [default to undefined]
**policy** | [**UserPolicy**](UserPolicy.md) |  | [default to undefined]
**traits** | **{ [key: string]: string; }** |  | [optional] [default to undefined]
**username** | **string** |  | [default to undefined]

## Example

```typescript
import { KmsOrgUser } from '@phantom/openapi-wallet-service';

const instance: KmsOrgUser = {
    authenticators,
    createdAtMs,
    expiresAtMs,
    policy,
    traits,
    username,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
