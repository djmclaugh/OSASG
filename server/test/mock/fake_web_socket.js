"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class FakeWebSocket {
    constructor() {
        this.responses = [];
        this.closeResponse = () => {
            throw new Error("Unexpected socket close");
        };
    }
    addOneTimeMessageResponse(response) {
        this.responses.push(response);
    }
    simulateJSONDataReceived(object) {
        let messageEvent = {
            data: JSON.stringify(object)
        };
        this.onmessage(messageEvent);
    }
    // Overides
    send(data) {
        if (this.responses.length) {
            let response = this.responses[0];
            this.responses.splice(0, 1);
            response(data);
        }
        else {
            throw new Error("Unexpected message received");
        }
    }
    close(code, reason) {
        this.closeResponse(code, reason);
    }
}
exports.FakeWebSocket = FakeWebSocket;
