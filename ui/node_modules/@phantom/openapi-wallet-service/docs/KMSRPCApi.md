# KMSRPCApi

All URIs are relative to *http://localhost:8000*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**postKmsRpc**](#postkmsrpc) | **POST** /kms/rpc | |

# **postKmsRpc**
> KmsRpcResponseV2 postKmsRpc(kmsRpcRequest)

 ### Endpoint This endpoint implements an RPC interface for KMS operations. The request body should be a JSON object with the following fields: - `method`: The RPC method to call. Supported methods:   - `createOrganization`: Creates a new organization with users and authenticators   - `createAuthenticator`: Creates a new authenticator for a user in an organization   - `deleteAuthenticator`: Deletes an authenticator from a user in an organization   - `createWallet`: Creates a new wallet within an organization   - `getOrganizationWallets`: Retrieves all wallets owned by an organization with pagination support   - `grantOrganizationAccess`: Grants wallet access to another organization   - `getOrCreatePhantomOrganization`: Gets or creates a phantom organization with the given public key and algorithm   - `signRawPayload`: Signs raw bytes with a specified wallet and derivation path   - `signTransaction`: Signs a transaction with a specified wallet and derivation path   - `initMnemonicImport`: Initializes a mnemonic import for a user in an organization   - `completeMnemonicImport`: Completes the mnemonic import process for a user in an organization   - `exportWallet`: Exports a wallet\'s data in an encrypted format - `params`: Parameters for the method, specific to each method type - `timestampMs`: Request timestamp in milliseconds (must be within 5 minutes of current time) ### Response The response body will be a JSON object with the following fields: - `result`: The result of the RPC call. The structure depends on the method:   - For `createOrganization`: Contains organization details   - For `createAuthenticator`: Contains authenticator details   - For `createWallet`: Contains wallet ID and name   - For `getOrganizationWallets`: Contains array of wallets with wallet_id and wallet_name, plus total_count, limit, and offset for pagination   - For `grantOrganizationAccess`: Contains confirmation of access grant with target organization ID and wallet ID   - For `getOrCreatePhantomOrganization`: Contains organization details for the phantom organization   - For `signRawPayload`: Contains signature and public key   - For `signTransaction`: Contains signed transaction and public key   - For `initMnemonicImport`: Contains import envelope and public key   - For `completeMnemonicImport`: Contains wallet ID and name   - For `exportWallet`: Contains encrypted wallet data 

### Example

```typescript
import {
    KMSRPCApi,
    Configuration,
    KmsRpcRequest
} from '@phantom/openapi-wallet-service';

const configuration = new Configuration();
const apiInstance = new KMSRPCApi(configuration);

let kmsRpcRequest: KmsRpcRequest; //

const { status, data } = await apiInstance.postKmsRpc(
    kmsRpcRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **kmsRpcRequest** | **KmsRpcRequest**|  | |


### Return type

**KmsRpcResponseV2**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Transaction signed successfully |  -  |
|**400** | Bad Request - Invalid parameters |  -  |
|**401** | Unauthorized - Invalid or missing API key |  -  |
|**403** | Forbidden - Policy violation |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

