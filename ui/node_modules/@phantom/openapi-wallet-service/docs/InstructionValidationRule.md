# InstructionValidationRule


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**max** | **number** |  | [optional] [default to undefined]
**min** | **number** |  | [optional] [default to undefined]
**rule** | **string** |  | [default to undefined]
**allowlist** | **Array&lt;string&gt;** |  | [default to undefined]
**mintAllowlist** | **Array&lt;string&gt;** |  | [optional] [default to undefined]
**recipientAllowlist** | **Array&lt;string&gt;** |  | [optional] [default to undefined]

## Example

```typescript
import { InstructionValidationRule } from '@phantom/openapi-wallet-service';

const instance: InstructionValidationRule = {
    max,
    min,
    rule,
    allowlist,
    mintAllowlist,
    recipientAllowlist,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
