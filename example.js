
const WebSocket = require('ws');
const WsSyncReq = require('./websocket-synchronous-request.js');
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


const port = 9999;
function init_server()
{
    const ws_server = new WebSocket.Server({port: port} );
    ws_server.on('connection', function(WSS) {
        WSS.on('message', function(message) {
            let object = JSON.parse(message);
            console.log ('>>> server received:', object);
            const uniqId = object.ws_request_uniq_id;
            // ########################################
            // make any dummy asynchronous action in backend and response back
            sleep(2000).then(() => {
                WSS.send(JSON.stringify({name: 'Nicolas', 'age': 43, ws_response_uniq_id:uniqId}));
            });
        });
        
        WSS.on('close', function close() {
            console.log('server closed')
        });
    });
}

var WSR_instance = null;
function init_client() {
    const ws_client = new WebSocket('ws://127.0.0.1:' + port);
    ws_client.on('open', ()=> {
        WSR_instance = new WsSyncReq(ws_client);
        sampleCall();
    }); 
}
async function sampleCall() {
    const response = await WSR_instance.fetchSync({"mykey": "myValue"}, 5000); // timeout 5000 MS
    console.log ('>>> After waiting synchronously, client got response:', response);
    process.exit();
}


 
// init
init_server();
init_client();



