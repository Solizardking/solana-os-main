# SignerPolicyRule


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**allowlist** | [**Array&lt;InstructionMatcher&gt;**](InstructionMatcher.md) |  | [optional] [default to undefined]
**rule** | **string** |  | [default to undefined]
**max** | **number** |  | [default to undefined]
**maxComputeUnitPrice** | **number** |  | [optional] [default to undefined]
**maxComputeUnits** | **number** |  | [optional] [default to undefined]
**instructions** | [**Array&lt;InstructionMatcher&gt;**](InstructionMatcher.md) |  | [default to undefined]

## Example

```typescript
import { SignerPolicyRule } from '@phantom/openapi-wallet-service';

const instance: SignerPolicyRule = {
    allowlist,
    rule,
    max,
    maxComputeUnitPrice,
    maxComputeUnits,
    instructions,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
