# ImportMnemonicRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**accounts** | [**Array&lt;DerivationInfo&gt;**](DerivationInfo.md) |  | [default to undefined]
**encryptedEntropy** | **Array&lt;number&gt;** |  | [default to undefined]
**importEnvelope** | [**ImportEnvelope**](ImportEnvelope.md) |  | [default to undefined]
**mnemonicLength** | **number** |  | [optional] [default to 24]
**organizationId** | **string** |  | [default to undefined]
**tags** | **Array&lt;string&gt;** |  | [optional] [default to undefined]
**walletName** | **string** |  | [default to undefined]

## Example

```typescript
import { ImportMnemonicRequest } from '@phantom/openapi-wallet-service';

const instance: ImportMnemonicRequest = {
    accounts,
    encryptedEntropy,
    importEnvelope,
    mnemonicLength,
    organizationId,
    tags,
    walletName,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
