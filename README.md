# sync-ws-request
Even though websocket's concept inherently disregards the synchronous nature, there are some edge-cases, when users might still need to make synchronous request-response, while they might be using websockets ([`ws` module](https://www.npmjs.com/package/ws)). This lightweight single-file wrapper (without any dependencies) will help you to do that.


## How does it work
Alike the traditional `fetch` method, this wrapper has similar method named  `fetchSync`, which works the following way (note, the data you are sending to server, should be an `Object`):
```
const WebSocket = require('ws');
const WsSyncRequest = require('ws-sync-request');

const ws = new WebSocket('ws://127.0.0.1:33479');
var WSR = null;

ws.on('open', ()=> {
	console.log('WS OPENED CLIENT CONNECT');
	WSR = new WsSyncRequest(this.wsc);
	sampleRequest();
}); 

async function sampleRequest() {
	const response = await WSR.fetchSync({"mykey": "myValue"}, 5000); // timeout 5000 MS
	console.log (response);
}
```

Signature of `fetchSync` method looks like this (you only need to provide the first argument, others can be left as default):
```
async fetchSync(dataToSend = {}, timeoutMs = 10000, expectedKey = 'ws_response_uniq_id', expectedValue = null, keyOfIdToSend = 'ws_request_uniq_id')
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