# InstructionMatcher


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**discriminator** | [**DiscriminatorMatcher**](DiscriminatorMatcher.md) |  | [default to undefined]
**programId** | **string** |  | [default to undefined]
**validate** | [**Array&lt;InstructionValidationRule&gt;**](InstructionValidationRule.md) |  | [optional] [default to undefined]

## Example

```typescript
import { InstructionMatcher } from '@phantom/openapi-wallet-service';

const instance: InstructionMatcher = {
    discriminator,
    programId,
    validate,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
