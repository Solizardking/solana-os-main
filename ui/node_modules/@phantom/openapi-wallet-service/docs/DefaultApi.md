# DefaultApi

All URIs are relative to *http://localhost:8000*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**simulateTransaction**](#simulatetransaction) | **POST** /simulations | Simulate a transaction|

# **simulateTransaction**
> SimulationResult simulateTransaction(simulateTransactionRequest)


### Example

```typescript
import {
    DefaultApi,
    Configuration,
    SimulateTransactionRequest
} from '@phantom/openapi-wallet-service';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let simulateTransactionRequest: SimulateTransactionRequest; //

const { status, data } = await apiInstance.simulateTransaction(
    simulateTransactionRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **simulateTransactionRequest** | **SimulateTransactionRequest**|  | |


### Return type

**SimulationResult**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Simulation successful |  -  |
|**400** | Bad Request - Invalid parameters |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

