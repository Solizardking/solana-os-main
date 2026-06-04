# TransferOrganizationWalletRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**ownerOrganizationId** | **string** |  | [default to undefined]
**retainPolicy** | [**VersionedOrganizationPolicy**](VersionedOrganizationPolicy.md) | If set, the owner organization policy will retain access to the wallet with this policy after the transfer. | [optional] [default to undefined]
**targetOrganizationId** | **string** |  | [default to undefined]
**walletId** | **string** |  | [default to undefined]

## Example

```typescript
import { TransferOrganizationWalletRequest } from '@phantom/openapi-wallet-service';

const instance: TransferOrganizationWalletRequest = {
    ownerOrganizationId,
    retainPolicy,
    targetOrganizationId,
    walletId,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
