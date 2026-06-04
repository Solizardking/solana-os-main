# EthereumDomain


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**chainId** | **string** | EIP-155 chain ID | [optional] [default to undefined]
**name** | **string** | Human-readable name of the signing domain | [optional] [default to undefined]
**salt** | **string** | Disambiguating salt for the protocol | [optional] [default to undefined]
**verifyingContract** | **string** | Address of the contract that will verify the signature | [optional] [default to undefined]
**version** | **string** | Current version of the signing domain | [optional] [default to undefined]

## Example

```typescript
import { EthereumDomain } from '@phantom/openapi-wallet-service';

const instance: EthereumDomain = {
    chainId,
    name,
    salt,
    verifyingContract,
    version,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
