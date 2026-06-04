# NoSignerAccountUsage

Rule to prevent using signer accounts in transactions.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**allowlist** | [**Array&lt;InstructionMatcher&gt;**](InstructionMatcher.md) |  | [optional] [default to undefined]

## Example

```typescript
import { NoSignerAccountUsage } from '@phantom/openapi-wallet-service';

const instance: NoSignerAccountUsage = {
    allowlist,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
