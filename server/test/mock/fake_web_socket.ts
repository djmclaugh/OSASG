export class FakeWebSocket implements WebSocket {
  public binaryType: string;
  public bufferedAmount: number;
  public extensions: string;
  public onclose: (this: WebSocket, ev:CloseEvent) => any;
  public onerror: (this: WebSocket, ev:Event) => any;
  public onmessage: (this: WebSocket, ev:MessageEvent) => any;
  public onopen: (this: WebSocket, ev:Event) => any;
  public readyState: number;
  public url: string;
  public CLOSED: number;
  public CLOSING: number;
  public CONNECTING: number;
  public OPEN: number;
  public addEventListener: any;
  public removeEventListener: any;
  public dispatchEvent: any;

  private responses: Array<(message: string) => void> = [];
  public closeResponse: (code?: number, reason?: string) => void = () => {
    throw new Error("Unexpected socket close");
  };

  public protocol: string;

  public addOneTimeMessageResponse(response: (message: string) => void) {
    this.responses.push(response);
  }

  public simulateJSONDataReceived(object: any) {
    let messageEvent: MessageEvent = <MessageEvent>{
      data: JSON.stringify(object)
    };
    this.onmessage(messageEvent);
  }

  // Overides
  public send(data: any) {
    if (this.responses.length) {
      let response: (message: string) => void = this.responses[0];
      this.responses.splice(0, 1);
      response(data);
    } else {
      throw new Error("Unexpected message received");
    }
  }

  public close(code?: number, reason?: string) {
    this.closeResponse(code, reason);
  }
}
