# IdTokenVerificationClaims


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**aud** | **Array&lt;string&gt;** | The audience that is allowed to authenticate with this ID token. | [optional] [default to undefined]
**iss** | **string** | The issuer of the ID token, typically the OIDC provider\&#39;s URL. | [optional] [default to undefined]
**sub** | **string** | The subject of the ID token, typically the user ID. | [default to undefined]

## Example

```typescript
import { IdTokenVerificationClaims } from '@phantom/openapi-wallet-service';

const instance: IdTokenVerificationClaims = {
    aud,
    iss,
    sub,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
