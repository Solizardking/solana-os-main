# PartialKmsUser


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**authenticators** | [**Array&lt;PartialKmsAuthenticator&gt;**](PartialKmsAuthenticator.md) |  | [default to undefined]
**expiresInMs** | **number** |  | [optional] [default to undefined]
**policy** | [**UserPolicy**](UserPolicy.md) |  | [default to undefined]
**traits** | **{ [key: string]: string; }** |  | [optional] [default to undefined]
**username** | **string** |  | [default to undefined]

## Example

```typescript
import { PartialKmsUser } from '@phantom/openapi-wallet-service';

const instance: PartialKmsUser = {
    authenticators,
    expiresInMs,
    policy,
    traits,
    username,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
