const crypto = require('crypto').webcrypto;

class ws_sync {
    waitedSyncCallbacks = {};
    waitedSyncCallbacks_keys = {};
    waiterPrefix = "id";
    waiterKey = "ws_awaited_client_call_uniq_id";
    loopPauseWaitIntervalMS = 500;

    wsc = null;

    constructor (ws_connection) {
        this.wsc = ws_connection;
        this.wsc.on('message', (payload)=>{
            this.receivedMessage(payload);
        })
    }

    // some random UUID like generator
    uuidv4() {
        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
          (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    }

	sleep(ms) {
		return new Promise(resolve => this.setTimeout_safe(resolve, ms));
	}
	// immitating ccxt's setTimeout
	setTimeout_safe (done, ms) {
		const self = this; const targetTime = Date.now() + ms; if (ms >= 2147483647) { throw new Error ('setTimeout() function was called with unrealistic value of ' + ms.toString ()); }  let clearInnerTimeout = () => {}; let active = true; const id = setTimeout (() => { active = true; const rest = targetTime - Date.now (); if (rest > 0) { clearInnerTimeout = self.setTimeout_safe (done, rest, setTimeout, targetTime); } else { done (); } }, ms); return function clear () { if (active) { active = false; clearTimeout (id); } clearInnerTimeout (); };
	}

	// https://stackoverflow.com/a/44782052/2377343
    cloneObjectDestructuve(orig){
        return Object.assign(Object.create(Object.getPrototypeOf(orig)), orig);
    }

    send(data)
    {
        if (!this.checkIfWsLive()) return false;
        this.wsc.send(JSON.stringify(data));
        return true;
    }

    checkIfWsLive() {
        return this.wsc !== null && this.wsc.readyState === 1;
    }

    async fetchSync(dataToSend = {}, timeoutMs = 10000, expectedKey = 'ws_reponse_key', expectedValue = null)
    {
        const uniqueId = this.waiterPrefix + '_' + this.uuidv4();
        if (uniqueId in this.waitedSyncCallbacks) {
            throw new Error("WS FETCH: uniqueId already exists - "+ uniqueId + "; Please use an unique on");
        }
        this.waitedSyncCallbacks_keys[uniqueId] = {k:expectedKey, v:expectedValue};
        const data_new = this.cloneObjectDestructuve (dataToSend);
        data_new[this.waiterKey] = uniqueId;
        this.waitedSyncCallbacks[uniqueId] = null;
    
        if (this.send(data_new))
        {
            let start = Date.now();
            while (true)
            {
                if (!this.checkIfWsLive()) return null;
                if ((Date.now() - start) > timeoutMs)
                {
                    return { error : "Request lasted more that timeout ms: " + timeoutMs + " [ "+ uniqueId +"]" +  dataToSend, result : null};
                }
                await this.sleep(this.loopPauseWaitIntervalMS);
                if (uniqueId in this.waitedSyncCallbacks)
                {
                    const value = this.waitedSyncCallbacks[uniqueId];
                    if (value != null)
                    {
                        delete this.waitedSyncCallbacks[uniqueId];
                        return value;
                    }
                } 
                else
                {
                    var msg = "Strange. The unique id " + uniqueId + " doesn't exist in dict. this should be impossible. " + data;
                    return { error : msg, result : null };
                }
            }
        } 
        else
        {
            return null;
        }
    }

    receivedMessage(fullPayload)
    {
        let response = null;
        try {
            response = JSON.parse(fullPayload);
        } 
        catch(exc)  {
            throw new Error("WS. Could not parse JSON: " + fullPayload + " | EXCEPTION:" + exc.toString() );
        }
        let foundResponse = null;
        const entries = Object.entries(this.waitedSyncCallbacks_keys);
        for (const [uniqId, KeyValuePair] of entries) {
            const uniqIdKeyName = KeyValuePair.k;
            const expectedValue = KeyValuePair.v;
            if (uniqIdKeyName in response) {
                if (response[uniqIdKeyName] === expectedValue || expectedValue === uniqId) {
                    foundResponse = response;
                    // remove if this is the default key
                    // if (uniqIdKeyName === 'ws_reponse_key' && uniqId in this.waitedSyncCallbacks) {
                    //     delete response[uniqIdKeyName];
                    // }
                    this.waitedSyncCallbacks[uniqId] = { error: null, result: foundResponse };
                }
            }
        }
    }
}

module.exports = ws_sync;