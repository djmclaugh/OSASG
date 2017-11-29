import { Socket, SocketConstructorOpts } from "net";
import { Duplex } from "stream";
import { EventEmitter } from "events";
let makeFrame: any = require("ws").Sender.frame;
let receiver: any = new (require("ws").Receiver)();

export class FakeNetSocket extends Duplex implements Socket {
  eventEmitter: EventEmitter = new EventEmitter();
  writeResponses: Array<(data: any, encoding?: any) => void> = [];
  destroyResponse: (err?: any) => void;
  addWriteWebSocketStringResponse(response: (message: string) => void, expectClose?: boolean) {
    this.writeResponses.push((data: Buffer) => {
      if (expectClose) {
        receiver.onmessage = () => {
          throw new Error("Expected socket closed");
        };
        receiver.onclose = (code: number, message: string) => {
          response(message);
        };
      } else {
        receiver.onmessage = response;
        receiver.onclose = () => {
          throw new Error("Socket closed unexpectedly");
        };
      }
      receiver.add(data);
      /*
      if (data.readUInt8(1) <= 125) {
        response(data.toString("utf8", 2));
      } else if (data.length > 10) {
        response(data.toString("utf8", 4));
      } else {
        // The data will be contained in the next frame, so add another response.
        this.writeResponses.splice(1, 0, (data: any) => {
          response(data.toString("utf8", 0));
        });
      }*/
    });
  }
  emitWebSocketString(message: string) {
    let list: Array<Buffer> = makeFrame(Buffer.from(message), {
      opcode: 1,
      readOnly: false,
      fin: true,
      mask: false,
      rsv1: false
    });
    if (list.length === 2) {
      this.eventEmitter.emit("data", list[0]);
      this.eventEmitter.emit("data", list[1]);
    } else {
      this.eventEmitter.emit("data", list[0]);
    }
  }

  bufferSize: number;
  remoteAddress?: string;
  remoteFamily?: string;
  remotePort?: number;
  localAddress: string;
  localPort: number;
  bytesRead: number;
  bytesWritten: number;
  connecting: boolean;
  destroyed: boolean = false;

  constructor(options?: SocketConstructorOpts) {
    super();
  }

  /*
    write(buffer: Buffer): boolean;
    write(buffer: Buffer, cb?: Function): boolean;
    write(str: string, cb?: Function): boolean;
    write(str: string, encoding?: string, cb?: Function): boolean;
    write(str: string, encoding?: string, fd?: string): boolean;
    write(data: any, encoding?: string, callback?: Function): void;
  */
  write(data: any, encoding?: any, callback?: any): any {
    if (this.writeResponses.length == 0) {
      throw new Error("No write calls expected");
    }
    let response = this.writeResponses[0];
    this.writeResponses.splice(0, 1);
    response(data, encoding);
    if (callback) {
      callback();
    }
  }

  /*
    connect(options: SocketConnectOpts, connectionListener?: Function): this;
    connect(port: number, host: string, connectionListener?: Function): this;
    connect(port: number, connectionListener?: Function): this;
    connect(path: string, connectionListener?: Function): this;
  */
  connect(): this { throw Error("Method not implemented") }

  setEncoding(encoding?: string): this { throw Error("Method not implemented") }
  destroy(err?: any): void {
    if (this.destroyResponse) {
      this.destroyResponse(err);
    } else {
      throw new Error("Socket destroyed unexpectedly");
    }
    this.destroyed = true;
  }
  pause(): this { throw Error("Method not implemented") }
  resume(): this { throw Error("Method not implemented") }
  setTimeout(timeout: number, callback?: Function): this {
    // Do nothing.
    return this;
  }
  setNoDelay(noDelay?: boolean): this {
    // Do nothing.
    return this
  }
  setKeepAlive(enable?: boolean, initialDelay?: number): void {
    throw Error("Method not implemented")
  }
  address(): { port: number; family: string; address: string; } {
    throw Error("Method not implemented")
  }
  unref(): void { throw Error("Method not implemented") }
  ref(): void { throw Error("Method not implemented") }

  /*
    end(): void;
    end(buffer: Buffer, cb?: Function): void;
    end(str: string, cb?: Function): void;
    end(str: string, encoding?: string, cb?: Function): void;
    end(data?: any, encoding?: string): void;
  */
  end(): void { throw Error("Method not implemented") }

  /*
   * events.EventEmitter
   *   1. close
   *   2. connect
   *   3. data
   *   4. drain
   *   5. end
   *   6. error
   *   7. lookup
   *   8. timeout

    addListener(event: string, listener: (...args: any[]) => void): this;
    addListener(event: "close", listener: (had_error: boolean) => void): this;
    addListener(event: "connect", listener: () => void): this;
    addListener(event: "data", listener: (data: Buffer) => void): this;
    addListener(event: "drain", listener: () => void): this;
    addListener(event: "end", listener: () => void): this;
    addListener(event: "error", listener: (err: Error) => void): this;
    addListener(event: "lookup", listener: (err: Error, address: string, family: string | number, host: string) => void): this;
    addListener(event: "timeout", listener: () => void): this;
  */
  addListener(event: string, listener: (...args: any[]) => void): this {
    throw Error("Method not implemented");
  }

  /*
    emit(event: string | symbol, ...args: any[]): boolean;
    emit(event: "close", had_error: boolean): boolean;
    emit(event: "connect"): boolean;
    emit(event: "data", data: Buffer): boolean;
    emit(event: "drain"): boolean;
    emit(event: "end"): boolean;
    emit(event: "error", err: Error): boolean;
    emit(event: "lookup", err: Error, address: string, family: string | number, host: string): boolean;
    emit(event: "timeout"): boolean;
  */
  emit(event: string | symbol, ...args: any[]): boolean {
    return this.eventEmitter.emit(event, args);
  }

  /*
    on(event: string, listener: (...args: any[]) => void): this;
    on(event: "close", listener: (had_error: boolean) => void): this;
    on(event: "connect", listener: () => void): this;
    on(event: "data", listener: (data: Buffer) => void): this;
    on(event: "drain", listener: () => void): this;
    on(event: "end", listener: () => void): this;
    on(event: "error", listener: (err: Error) => void): this;
    on(event: "lookup", listener: (err: Error, address: string, family: string | number, host: string) => void): this;
    on(event: "timeout", listener: () => void): this;
  */
  on(event: string, listener: (...args: any[]) => void): this {
    this.eventEmitter.on(event, listener);
    return this;
  }

  /*
    once(event: string, listener: (...args: any[]) => void): this;
    once(event: "close", listener: (had_error: boolean) => void): this;
    once(event: "connect", listener: () => void): this;
    once(event: "data", listener: (data: Buffer) => void): this;
    once(event: "drain", listener: () => void): this;
    once(event: "end", listener: () => void): this;
    once(event: "error", listener: (err: Error) => void): this;
    once(event: "lookup", listener: (err: Error, address: string, family: string | number, host: string) => void): this;
    once(event: "timeout", listener: () => void): this;
  */
  once(event: string, listener: (...args: any[]) => void): this {
    this.removeListener(event, listener);
    return this;
  }

  /*
    prependListener(event: string, listener: (...args: any[]) => void): this;
    prependListener(event: "close", listener: (had_error: boolean) => void): this;
    prependListener(event: "connect", listener: () => void): this;
    prependListener(event: "data", listener: (data: Buffer) => void): this;
    prependListener(event: "drain", listener: () => void): this;
    prependListener(event: "end", listener: () => void): this;
    prependListener(event: "error", listener: (err: Error) => void): this;
    prependListener(event: "lookup", listener: (err: Error, address: string, family: string | number, host: string) => void): this;
    prependListener(event: "timeout", listener: () => void): this;
  */
  prependListener(event: string, listener: (...args: any[]) => void): this {
    throw Error("Method not implemented");
  }

  /*
    prependOnceListener(event: string, listener: (...args: any[]) => void): this;
    prependOnceListener(event: "close", listener: (had_error: boolean) => void): this;
    prependOnceListener(event: "connect", listener: () => void): this;
    prependOnceListener(event: "data", listener: (data: Buffer) => void): this;
    prependOnceListener(event: "drain", listener: () => void): this;
    prependOnceListener(event: "end", listener: () => void): this;
    prependOnceListener(event: "error", listener: (err: Error) => void): this;
    prependOnceListener(event: "lookup", listener: (err: Error, address: string, family: string | number, host: string) => void): this;
    prependOnceListener(event: "timeout", listener: () => void): this;
  */
  prependOnceListener(event: string, listener: (...args: any[]) => void): this {
    throw Error("Method not implemented");
  }
}
