# KmsWalletWithDerivedAccounts


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**tags** | **Array&lt;string&gt;** |  | [default to undefined]
**type** | [**ExternalKmsWalletKind**](ExternalKmsWalletKind.md) |  | [default to undefined]
**walletId** | **string** |  | [default to undefined]
**walletName** | **string** |  | [default to undefined]
**accounts** | [**Array&lt;ExternalDerivedAccount&gt;**](ExternalDerivedAccount.md) |  | [default to undefined]
**account** | [**ExternalKeypairAccount**](ExternalKeypairAccount.md) |  | [default to undefined]

## Example

```typescript
import { KmsWalletWithDerivedAccounts } from '@phantom/openapi-wallet-service';

const instance: KmsWalletWithDerivedAccounts = {
    tags,
    type,
    walletId,
    walletName,
    accounts,
    account,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
