# GetOrCreateWalletWithTagRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**addressFormat** | [**AddressFormat**](AddressFormat.md) |  | [optional] [default to undefined]
**curve** | [**ExternalCurve**](ExternalCurve.md) |  | [default to undefined]
**accounts** | [**Array&lt;DerivationInfoSchema&gt;**](DerivationInfoSchema.md) |  | [optional] [default to undefined]
**mnemonicLength** | **number** |  | [optional] [default to 24]
**organizationId** | **string** |  | [default to undefined]
**tag** | **string** |  | [default to undefined]
**walletName** | **string** |  | [default to undefined]

## Example

```typescript
import { GetOrCreateWalletWithTagRequest } from '@phantom/openapi-wallet-service';

const instance: GetOrCreateWalletWithTagRequest = {
    addressFormat,
    curve,
    accounts,
    mnemonicLength,
    organizationId,
    tag,
    walletName,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
