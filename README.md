# sync-ws-request
Even though websocket's concept inherently disregards the synchronous nature, there are some edge-cases, when users might still need to make synchronous request-response, while they might be using websockets ([`ws` module](https://www.npmjs.com/package/ws)). This lightweight single-file wrapper (without any dependencies) will help you to do that.


## How does it work
`fetchSync` method works like the synchronous `fetch`. Signature of `fetchSync` method looks like this:
```
async fetchSync(dataToSend = {}, timeoutMs = 10000, keyOfRequestId='ws_request_uniq_id', keyOfResponseId='ws_response_uniq_id', responseIdValue=null)
```
However, you only need to provide the first argument (which must be an `Object`, and other arguments are optional. Example:
```
const WebSocket = require('ws');
const WsSyncRequest = require('ws-sync-request');
var WSR_instance = null;

const ws = new WebSocket('ws://127.0.0.1:9999');
ws.on('open', ()=> {
	WSR_instance = new WsSyncRequest(ws);
}); 

// then anywhere you can use:
const response = await WSR_instance.fetchSync({"mykey": "myValue"}, 5000); // timeout 5000 MS
console.log (response);

```

Short explanation: In the backgrounds, the wrapper 'initiates a request' (using `ws.send()`) and waits (using asynchronous 'sleep' cycles) till it gets response from server-side. 

Long explanation: The data, that is being sent to server, automatically includes the generated unique ID (there will be additional key `ws_request_uniq_id`) in the sent object, so it will look like:
```
{
    "ws_request_uniq_id": "id_1234....",
    // and then your actual datas to send in request
    "mykey": "myValue",
}
```
That unique ID can be recognized on server-side, and then from the server-side, you should respond with the object (which includes a key `ws_response_uniq_id` which value is that same unique ID `id_1234`), so your server response would look like:
```
{
    "ws_response_uniq_id": "id_1234....",
    // and then your actual datas to respond from server
    "foo": "bar"
}
```
So, when websocket client will see that incoming object, and recognizes the unique ID, so it will resolve the awaited request.
(_You can check an [`example.js`](https://github.com/Puvox/synchronous-websocket-request-js/blob/main/example.js) for full reproducable example_).


## links
- https://github.com/Puvox/synchronous-websocket-request-js
- https://www.npmjs.com/package/ws-sync-request