## @phantom/openapi-wallet-service@0.1.0

This generator creates TypeScript/JavaScript client that utilizes [axios](https://github.com/axios/axios). The generated Node module can be used in the following environments:

Environment
* Node.js
* Webpack
* Browserify

Language level
* ES5 - you must have a Promises/A+ library installed
* ES6

Module system
* CommonJS
* ES6 module system

It can be used in both TypeScript and JavaScript. In TypeScript, the definition will be automatically resolved via `package.json`. ([Reference](https://www.typescriptlang.org/docs/handbook/declaration-files/consumption.html))

### Building

To build and compile the typescript sources to javascript use:
```
npm install
npm run build
```

### Publishing

First build the package then run `npm publish`

### Consuming

navigate to the folder of your consuming project and run one of the following commands.

_published:_

```
npm install @phantom/openapi-wallet-service@0.1.0 --save
```

_unPublished (not recommended):_

```
npm install PATH_TO_GENERATED_PACKAGE --save
```

### Documentation for API Endpoints

All URIs are relative to *http://localhost:8000*

Class | Method | HTTP request | Description
------------ | ------------- | ------------- | -------------
*DefaultApi* | [**simulateTransaction**](docs/DefaultApi.md#simulatetransaction) | **POST** /simulations | Simulate a transaction
*HealthApi* | [**healthHandler**](docs/HealthApi.md#healthhandler) | **GET** /healthz | 
*KMSRPCApi* | [**postKmsRpc**](docs/KMSRPCApi.md#postkmsrpc) | **POST** /kms/rpc | 


### Documentation For Models

 - [AddUserToOrganization](docs/AddUserToOrganization.md)
 - [AddUserToOrganizationRequest](docs/AddUserToOrganizationRequest.md)
 - [AddressFormat](docs/AddressFormat.md)
 - [Algorithm](docs/Algorithm.md)
 - [BitcoinTransaction](docs/BitcoinTransaction.md)
 - [BundleSizeLimit](docs/BundleSizeLimit.md)
 - [CelFullPolicy](docs/CelFullPolicy.md)
 - [CelPolicyConstant](docs/CelPolicyConstant.md)
 - [CelPolicyOutcome](docs/CelPolicyOutcome.md)
 - [CelPolicyPreset](docs/CelPolicyPreset.md)
 - [CelPolicyPresetOneOf](docs/CelPolicyPresetOneOf.md)
 - [CelPolicyPresetOneOf1](docs/CelPolicyPresetOneOf1.md)
 - [CelPolicyPresetOneOf2](docs/CelPolicyPresetOneOf2.md)
 - [CelPolicyPresetOneOf3](docs/CelPolicyPresetOneOf3.md)
 - [CelPolicyRule](docs/CelPolicyRule.md)
 - [CompleteImportWallet](docs/CompleteImportWallet.md)
 - [CompleteImportWalletRequest](docs/CompleteImportWalletRequest.md)
 - [ComputeBudgetLimit](docs/ComputeBudgetLimit.md)
 - [CreateAuthenticator](docs/CreateAuthenticator.md)
 - [CreateAuthenticatorRequest](docs/CreateAuthenticatorRequest.md)
 - [CreateOrganization](docs/CreateOrganization.md)
 - [CreateOrganizationRequest](docs/CreateOrganizationRequest.md)
 - [CreateWallet](docs/CreateWallet.md)
 - [CreateWalletRequest](docs/CreateWalletRequest.md)
 - [Curve](docs/Curve.md)
 - [DeleteAuthenticator](docs/DeleteAuthenticator.md)
 - [DeleteAuthenticatorRequest](docs/DeleteAuthenticatorRequest.md)
 - [DeleteUserFromOrganization](docs/DeleteUserFromOrganization.md)
 - [DeleteUserFromOrganizationRequest](docs/DeleteUserFromOrganizationRequest.md)
 - [DerivationInfo](docs/DerivationInfo.md)
 - [DerivationInfoSchema](docs/DerivationInfoSchema.md)
 - [DiscriminatorMatcher](docs/DiscriminatorMatcher.md)
 - [DiscriminatorMatcherOneOf](docs/DiscriminatorMatcherOneOf.md)
 - [DiscriminatorMatcherOneOf1](docs/DiscriminatorMatcherOneOf1.md)
 - [EIP1559JSONTransaction](docs/EIP1559JSONTransaction.md)
 - [EIP2718RLPEncodedHexTransaction](docs/EIP2718RLPEncodedHexTransaction.md)
 - [EncryptedBundleEitherMnemonicEntropyOrKeypair](docs/EncryptedBundleEitherMnemonicEntropyOrKeypair.md)
 - [ErrorResponse](docs/ErrorResponse.md)
 - [EthereumDomain](docs/EthereumDomain.md)
 - [EthereumSignMessageAsPerEIP191](docs/EthereumSignMessageAsPerEIP191.md)
 - [EthereumSignMessageRequest](docs/EthereumSignMessageRequest.md)
 - [EthereumSignTypedDataAsPerEIP712](docs/EthereumSignTypedDataAsPerEIP712.md)
 - [EthereumSignTypedDataRequest](docs/EthereumSignTypedDataRequest.md)
 - [EthereumTransaction](docs/EthereumTransaction.md)
 - [EthereumTransactionEip1559](docs/EthereumTransactionEip1559.md)
 - [EthereumTypedData](docs/EthereumTypedData.md)
 - [ExportWallet](docs/ExportWallet.md)
 - [ExportWalletRequest](docs/ExportWalletRequest.md)
 - [ExternalCelPolicy](docs/ExternalCelPolicy.md)
 - [ExternalCurve](docs/ExternalCurve.md)
 - [ExternalDerivedAccount](docs/ExternalDerivedAccount.md)
 - [ExternalKeypairAccount](docs/ExternalKeypairAccount.md)
 - [ExternalKeypairAuthenticator](docs/ExternalKeypairAuthenticator.md)
 - [ExternalKmsAuthenticator](docs/ExternalKmsAuthenticator.md)
 - [ExternalKmsAuthenticatorData](docs/ExternalKmsAuthenticatorData.md)
 - [ExternalKmsOrganization](docs/ExternalKmsOrganization.md)
 - [ExternalKmsWallet](docs/ExternalKmsWallet.md)
 - [ExternalKmsWalletKind](docs/ExternalKmsWalletKind.md)
 - [ExternalOidcAuthenticator](docs/ExternalOidcAuthenticator.md)
 - [ExternalOrganizationToWallet](docs/ExternalOrganizationToWallet.md)
 - [ExternalWalletAccounts](docs/ExternalWalletAccounts.md)
 - [ExternalWalletAccountsOneOf](docs/ExternalWalletAccountsOneOf.md)
 - [ExternalWalletAccountsOneOf1](docs/ExternalWalletAccountsOneOf1.md)
 - [GetAccounts](docs/GetAccounts.md)
 - [GetAccountsRequest](docs/GetAccountsRequest.md)
 - [GetOrCreatePhantomOrganization](docs/GetOrCreatePhantomOrganization.md)
 - [GetOrCreateWalletWithTag](docs/GetOrCreateWalletWithTag.md)
 - [GetOrCreateWalletWithTagRequest](docs/GetOrCreateWalletWithTagRequest.md)
 - [GetOrganization](docs/GetOrganization.md)
 - [GetOrganizationRequest](docs/GetOrganizationRequest.md)
 - [GetOrganizationWallets](docs/GetOrganizationWallets.md)
 - [GetOrganizationWalletsRequest](docs/GetOrganizationWalletsRequest.md)
 - [GetPhantomOrganization](docs/GetPhantomOrganization.md)
 - [GetWalletAccessGrants](docs/GetWalletAccessGrants.md)
 - [GetWalletAccessGrantsRequest](docs/GetWalletAccessGrantsRequest.md)
 - [GetWalletWithTag](docs/GetWalletWithTag.md)
 - [GetWalletWithTagRequest](docs/GetWalletWithTagRequest.md)
 - [GrantOrganizationAccess](docs/GrantOrganizationAccess.md)
 - [GrantOrganizationAccessRequest](docs/GrantOrganizationAccessRequest.md)
 - [IdTokenVerificationClaims](docs/IdTokenVerificationClaims.md)
 - [ImportEnvelope](docs/ImportEnvelope.md)
 - [InitWalletImport](docs/InitWalletImport.md)
 - [InitWalletImportRequest](docs/InitWalletImportRequest.md)
 - [InstructionAllowlist](docs/InstructionAllowlist.md)
 - [InstructionMatcher](docs/InstructionMatcher.md)
 - [InstructionValidationRule](docs/InstructionValidationRule.md)
 - [InstructionValidationRuleOneOf](docs/InstructionValidationRuleOneOf.md)
 - [InstructionValidationRuleOneOf1](docs/InstructionValidationRuleOneOf1.md)
 - [InstructionValidationRuleOneOf2](docs/InstructionValidationRuleOneOf2.md)
 - [JWKSet](docs/JWKSet.md)
 - [JWKSetURL](docs/JWKSetURL.md)
 - [JwkSource](docs/JwkSource.md)
 - [KeypairAuthenticator](docs/KeypairAuthenticator.md)
 - [KeypairWalletParameters](docs/KeypairWalletParameters.md)
 - [KmcRpcResponseV2Error](docs/KmcRpcResponseV2Error.md)
 - [KmcRpcResponseV2ErrorDetails](docs/KmcRpcResponseV2ErrorDetails.md)
 - [KmcRpcResponseV2Result](docs/KmcRpcResponseV2Result.md)
 - [KmsOrgUser](docs/KmsOrgUser.md)
 - [KmsResult](docs/KmsResult.md)
 - [KmsRpcRequest](docs/KmsRpcRequest.md)
 - [KmsRpcRequestParams](docs/KmsRpcRequestParams.md)
 - [KmsRpcResponseV2](docs/KmsRpcResponseV2.md)
 - [KmsWalletWithDerivedAccounts](docs/KmsWalletWithDerivedAccounts.md)
 - [MnemonicWalletParameters](docs/MnemonicWalletParameters.md)
 - [NoSignerAccountUsage](docs/NoSignerAccountUsage.md)
 - [OIDCAuthenticator](docs/OIDCAuthenticator.md)
 - [OIDCIssuerURL](docs/OIDCIssuerURL.md)
 - [OrganizationPolicyV0](docs/OrganizationPolicyV0.md)
 - [OrganizationPolicyV1](docs/OrganizationPolicyV1.md)
 - [OrganizationRootAccess](docs/OrganizationRootAccess.md)
 - [OrganizationRootAccessOneOf](docs/OrganizationRootAccessOneOf.md)
 - [OrganizationRootAccessOneOf1](docs/OrganizationRootAccessOneOf1.md)
 - [OrganizationRootAccessOneOf2](docs/OrganizationRootAccessOneOf2.md)
 - [OrganizationToWallet](docs/OrganizationToWallet.md)
 - [OrganizationWalletScope](docs/OrganizationWalletScope.md)
 - [OrganizationWallets](docs/OrganizationWallets.md)
 - [PartialKmsAuthenticator](docs/PartialKmsAuthenticator.md)
 - [PartialKmsUser](docs/PartialKmsUser.md)
 - [PasskeyAuthenticator](docs/PasskeyAuthenticator.md)
 - [PasskeyRegistration](docs/PasskeyRegistration.md)
 - [ReverseRuleInstructionAllowlist](docs/ReverseRuleInstructionAllowlist.md)
 - [RevokeOrganizationAccess](docs/RevokeOrganizationAccess.md)
 - [RevokeOrganizationAccessRequest](docs/RevokeOrganizationAccessRequest.md)
 - [SignRawPayload](docs/SignRawPayload.md)
 - [SignRawPayloadRequest](docs/SignRawPayloadRequest.md)
 - [SignTransaction](docs/SignTransaction.md)
 - [SignTransactionRequest](docs/SignTransactionRequest.md)
 - [SignUTF8Message](docs/SignUTF8Message.md)
 - [SignUtf8MessageRequest](docs/SignUtf8MessageRequest.md)
 - [SignatureWithPublicKey](docs/SignatureWithPublicKey.md)
 - [SignedBitcoinTransaction](docs/SignedBitcoinTransaction.md)
 - [SignedEthereumTransaction](docs/SignedEthereumTransaction.md)
 - [SignedSolanaTransaction](docs/SignedSolanaTransaction.md)
 - [SignedTransaction](docs/SignedTransaction.md)
 - [SignedTransactionWithPublicKey](docs/SignedTransactionWithPublicKey.md)
 - [SignerPolicyRule](docs/SignerPolicyRule.md)
 - [SignerPolicyRuleOneOf](docs/SignerPolicyRuleOneOf.md)
 - [SignerPolicyRuleOneOf1](docs/SignerPolicyRuleOneOf1.md)
 - [SignerPolicyRuleOneOf2](docs/SignerPolicyRuleOneOf2.md)
 - [SignerPolicyRuleOneOf3](docs/SignerPolicyRuleOneOf3.md)
 - [SignerPolicyRuleOneOf4](docs/SignerPolicyRuleOneOf4.md)
 - [SignerPolicyRuleOneOf5](docs/SignerPolicyRuleOneOf5.md)
 - [SignerPolicyRuleOneOf6](docs/SignerPolicyRuleOneOf6.md)
 - [SimulateTransactionRequest](docs/SimulateTransactionRequest.md)
 - [SimulationResult](docs/SimulationResult.md)
 - [SolanaSignerPolicy](docs/SolanaSignerPolicy.md)
 - [TransactionPolicyV0](docs/TransactionPolicyV0.md)
 - [TransferOrganizationWallet](docs/TransferOrganizationWallet.md)
 - [TransferOrganizationWalletRequest](docs/TransferOrganizationWalletRequest.md)
 - [UnsignedTransaction](docs/UnsignedTransaction.md)
 - [UpdateAuthenticator](docs/UpdateAuthenticator.md)
 - [UpdateAuthenticatorRequest](docs/UpdateAuthenticatorRequest.md)
 - [UpdatePartialKmsAuthenticator](docs/UpdatePartialKmsAuthenticator.md)
 - [UpdateUserInOrganization](docs/UpdateUserInOrganization.md)
 - [UpdateUserInOrganizationRequest](docs/UpdateUserInOrganizationRequest.md)
 - [UsdLimitSettings](docs/UsdLimitSettings.md)
 - [UserPolicy](docs/UserPolicy.md)
 - [UserPolicyOneOf](docs/UserPolicyOneOf.md)
 - [UserPolicyOneOf1](docs/UserPolicyOneOf1.md)
 - [VersionedOrganizationPolicy](docs/VersionedOrganizationPolicy.md)
 - [VersionedOrganizationPolicyOneOf](docs/VersionedOrganizationPolicyOneOf.md)
 - [VersionedOrganizationPolicyOneOf1](docs/VersionedOrganizationPolicyOneOf1.md)
 - [VersionedTransactionPolicy](docs/VersionedTransactionPolicy.md)
 - [WalletAccessGrants](docs/WalletAccessGrants.md)
 - [WalletParameters](docs/WalletParameters.md)


<a id="documentation-for-authorization"></a>
## Documentation For Authorization


Authentication schemes defined for the API:
<a id="x-phantom-stamp"></a>
### x-phantom-stamp

- **Type**: API key
- **API key parameter name**: X-Phantom-Stamp
- **Location**: HTTP header

