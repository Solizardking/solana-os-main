# KmsResult


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**organizationId** | **string** |  | [default to undefined]
**organizationName** | **string** |  | [default to undefined]
**parentOrganizationId** | **string** |  | [optional] [default to undefined]
**tags** | **Array&lt;string&gt;** |  | [default to undefined]
**users** | [**Array&lt;KmsOrgUser&gt;**](KmsOrgUser.md) |  | [default to undefined]
**algorithm** | [**Algorithm**](Algorithm.md) |  | [default to undefined]
**publicKey** | **string** | Public key of the ephemeral key used to encrypt the envelope. | [default to undefined]
**authenticatorKind** | **string** |  | [default to undefined]
**attestationObject** | **string** | The attestation object, as binary. | [default to undefined]
**clientDataJSON** | **string** | The client data JSON, as binary. | [default to undefined]
**credentialId** | **string** |  | [default to undefined]
**transports** | **Array&lt;string&gt;** | The transports used by the authenticator. | [optional] [default to undefined]
**jwkSet** | **object** |  | [default to undefined]
**jwksUrl** | **string** |  | [default to undefined]
**issuerUrl** | **string** |  | [default to undefined]
**idTokenClaims** | [**IdTokenVerificationClaims**](IdTokenVerificationClaims.md) |  | [default to undefined]
**authenticatorName** | **string** |  | [default to undefined]
**createdAtMs** | **string** |  | [optional] [default to undefined]
**expiresAtMs** | **string** |  | [optional] [default to undefined]
**id** | **string** |  | [default to undefined]
**type** | [**ExternalKmsWalletKind**](ExternalKmsWalletKind.md) |  | [default to undefined]
**walletId** | **string** |  | [default to undefined]
**walletName** | **string** |  | [default to undefined]
**accounts** | [**Array&lt;ExternalDerivedAccount&gt;**](ExternalDerivedAccount.md) |  | [default to undefined]
**account** | [**ExternalKeypairAccount**](ExternalKeypairAccount.md) |  | [default to undefined]
**deletedAtMs** | **number** |  | [optional] [default to undefined]
**organizationPolicy** | [**VersionedOrganizationPolicy**](VersionedOrganizationPolicy.md) |  | [default to undefined]
**policyName** | **string** |  | [optional] [default to undefined]
**transactionPolicy** | [**VersionedTransactionPolicy**](VersionedTransactionPolicy.md) |  | [optional] [default to undefined]
**kind** | **string** |  | [default to undefined]
**signature** | **string** |  | [default to undefined]
**transaction** | **string** |  | [default to undefined]
**address** | **string** |  | [default to undefined]
**limit** | **number** |  | [default to undefined]
**offset** | **number** |  | [default to undefined]
**totalCount** | **number** |  | [default to undefined]
**wallets** | [**Array&lt;ExternalKmsWallet&gt;**](ExternalKmsWallet.md) |  | [default to undefined]
**grants** | [**Array&lt;ExternalOrganizationToWallet&gt;**](ExternalOrganizationToWallet.md) |  | [default to undefined]
**envelope** | **string** | Encrypted material of (16 bytes organization ID + 32 bytes master seed of the ephemeral key). | [default to undefined]
**encryptedBundle** | **string** |  | [default to undefined]

## Example

```typescript
import { KmsResult } from '@phantom/openapi-wallet-service';

const instance: KmsResult = {
    organizationId,
    organizationName,
    parentOrganizationId,
    tags,
    users,
    algorithm,
    publicKey,
    authenticatorKind,
    attestationObject,
    clientDataJSON,
    credentialId,
    transports,
    jwkSet,
    jwksUrl,
    issuerUrl,
    idTokenClaims,
    authenticatorName,
    createdAtMs,
    expiresAtMs,
    id,
    type,
    walletId,
    walletName,
    accounts,
    account,
    deletedAtMs,
    organizationPolicy,
    policyName,
    transactionPolicy,
    kind,
    signature,
    transaction,
    address,
    limit,
    offset,
    totalCount,
    wallets,
    grants,
    envelope,
    encryptedBundle,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
