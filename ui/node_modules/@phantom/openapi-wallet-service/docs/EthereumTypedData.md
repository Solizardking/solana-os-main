# EthereumTypedData


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**domain** | [**EthereumDomain**](EthereumDomain.md) | Domain separator parameters | [default to undefined]
**message** | **any** |  | [default to undefined]
**primaryType** | **string** | The primary type being signed (must be a key in types) | [default to undefined]
**types** | **{ [key: string]: any; }** | Type definitions for all structs used in the typed data | [default to undefined]

## Example

```typescript
import { EthereumTypedData } from '@phantom/openapi-wallet-service';

const instance: EthereumTypedData = {
    domain,
    message,
    primaryType,
    types,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
