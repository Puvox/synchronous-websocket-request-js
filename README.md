# sync-ws-request
Even though websocket's concept inherently disregards the synchronous nature, there are some edge-cases, when users might still need to make synchronous request-response, while they might be using websockets ([`ws` module](https://www.npmjs.com/package/ws)). This lightweight single-file wrapper (without any dependencies) will help you to do that. To describe in two words, all what this wrapper does is that it 'initiates a request' (using `ws.send()`) and waits (using asynchronous 'sleep' cycles) till it gets response from server-side. 


## How does it work
`fetchSync` method works like the synchronous `fetch`. Signature of `fetchSync` method looks like this:
```
async fetchSync(dataToSend = {}, timeoutMs = 10000, expectedObjectStructure = null)
```
However, you only need to provide the first argument (which must be an `Object`, and other arguments are optional. Example:
```
const WebSocket = require('ws');
const WsSyncReq = require('ws-sync-request');

// init client
var WSR_instance = null;
function init_client() {
    const ws_client = new WebSocket('ws://127.0.0.1:9999');
    ws_client.on('open', ()=> {
        WSR_instance = new WsSyncReq(ws_client);
        // ...
        // then anywhere you can use
        sampleCall();
    }); 
}
async function sampleCall() {
    // timeout i.e. 5000 MS
    const response = await WSR_instance.fetchSync({"hello":"world"}, 5000, null); 
    //  or instead of 'null' you can add 3rd argument to force match with received object values, i.e.  {name: 'Nicolas'}
    console.log ('>>> After waiting synchronously, client got response:', response);
    process.exit();
}

// init example dummy server
function init_server()
{
    const ws_server = new WebSocket.Server({port: 9999} );
    ws_server.on('connection', function(WSS) {
        WSS.on('message', function(message) {
            let object = JSON.parse(message);
            console.log ('>>> server received:', object);
            // ########################################
            // make any dummy asynchronous action in backend and response back
            if (object['hello'] === 'world') {
                setTimeout(() => {
                    const response = JSON.stringify({name: 'Nicolas', 'age': 43, ws_response_uniq_id: object.ws_request_uniq_id});
                    console.log ('>>> server sends:', response);
                    WSS.send(response);
                }, 2000);
            }
        });
    });
}

init_server();
init_client();
```
The data, that is being sent to server, automatically includes the generated unique ID (there will be additional key `ws_request_uniq_id`) in the sent object, so it will look like:
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


## links
- https://github.com/Puvox/synchronous-websocket-request-js
- https://www.npmjs.com/package/ws-sync-request