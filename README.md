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

const ws = new WebSocket('ws://127.0.0.1:33479');
ws.on('open', ()=> {
	WSR_instance = new WsSyncRequest(ws);
}); 

// then anywhere you can use:
const response = await WSR_instance.fetchSync({"mykey": "myValue"}, 5000); // timeout 5000 MS
console.log (response);

```

In the backgrounds, the wrapper 'initiates a request' (using `ws.send()`) and waits (using asynchronous 'sleep' cycles) till it gets response from server-side. The data, that is being sent to server, automatically includes the generated unique ID. That unique ID is being recognized on server-side, and the response you send from server back to front-end, should also include that unique ID. After that response is received back, the promise is resolved.

To be specific, at server-side you will receiver the same object, but there will be added additional key `ws_request_uniq_id`(_can be overriden from `fetchSync` args_) in the sent object, so it will look like:
```
{
    "ws_request_uniq_id": "id_1234....",
    // and then your actual datas to send in request
    "mykey": "myValue",
}
```
then from the server-side, you should respond with the object, where there is a key `ws_response_uniq_id`(_can be overriden from `fetchSync` args_) and has the same ID value that was received (i.e. `id_1234`), so your server response would look like:
```
{
    "ws_response_uniq_id": "id_1234....",
    // and then your actual datas to respond from server
    "foo": "bar"
}
```
So, when websocket client will see the incoming object, which has key named `ws_response_uniq_id` with the value `id_1234...`, then it considers that is the expected awaited request, and will resolve to that response.


## server example
If you still don't understand how it works from server-side, see example in `/example` folder.



## links
- https://github.com/Puvox/synchronous-websocket-request-js
- https://www.npmjs.com/package/ws-sync-request