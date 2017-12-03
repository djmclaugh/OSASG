import { SocketServer } from "../../modules/sockets/socket_server";

import { assert } from "chai";
import { IncomingMessage, Server, IncomingHttpHeaders } from "http";
import "mocha";
import { PlayerSocket } from "../../modules/sockets/player_socket";
import {
  CredentialAuthenticator,
  RequestAuthenticator,
  PlayerInfoCallback,
  SocketAuthenticator
} from "../../modules/sockets/socket_authenticator";
import { PlayerInfo } from "../../../shared/player_info";
import {
  AUTHENTICATION_TYPE,
  COOKIE_AUTHENTICATION_SUBPROTOCOL,
  CREDENTIALS_AUTHENTICATION_SUBPROTOCOL,
  PLAYER_INFO_TYPE,
  AuthenticationMessage,
  SocketMessage,
  isPlayerInfoMessage,
} from "../../../shared/socket_protocol";
import { FakeWebSocket } from "../mock/fake_web_socket";
import { FakeNetSocket } from "../mock/fake_net_socket";

let defaultCredentialAuthenticator: CredentialAuthenticator =
    (credentials: AuthenticationMessage, callback: PlayerInfoCallback) => {
  callback(null, {identifier: "identifier", username: "username"});
}
let defaultRequestAuthenticator: RequestAuthenticator =
    (request: IncomingMessage, callback: PlayerInfoCallback) => {
  callback(null, {identifier: "request_identifier", username: "request_username"});
}
let defaultAuthenticator: SocketAuthenticator =
    new SocketAuthenticator(defaultRequestAuthenticator, defaultCredentialAuthenticator, 100);

function generateFakeRequest(): IncomingMessage {
  let fakeRequest: IncomingMessage = new IncomingMessage(null);
  fakeRequest.method = "GET";
  fakeRequest.headers = {
    "upgrade": "websocket",
    "sec-websocket-protocol": "credentials_authentication",
    "sec-websocket-key": "some_key",
    "sec-websocket-version": "13"
  };
  return fakeRequest;
}

describe("SocketServer", () => {
  let httpServer: Server;
  let testedServer: SocketServer;

  beforeEach(() => {
    httpServer = new Server();
    testedServer = new SocketServer(httpServer, defaultAuthenticator);
  });

  describe("Connection", () => {
    it("Should close the socket if an invalid subprotocol is sent", (done: MochaDone) => {
      let didDestroy: boolean;
      let didRespond: boolean;
      let fakeSocket: FakeNetSocket = new FakeNetSocket();
      fakeSocket.writeResponses.push((data: any, encoding: any) => {
        assert.include(data, "HTTP/1.1 401 Unauthorized");
        didRespond = true;
        if (didDestroy) {
          done();
        }
      });
      fakeSocket.destroyResponse = () => {
        didDestroy = true;
        if (didRespond) {
          done();
        }
      };

      let fakeRequest: IncomingMessage = generateFakeRequest();
      fakeRequest.headers["sec-websocket-protocol"] = "invalid_protocol";
      httpServer.emit("upgrade", fakeRequest, fakeSocket, new Buffer(""));
    });

    it("Should upgrade the socket if a valid subprotocol is set", (done: MochaDone) => {
      let fakeSocket: FakeNetSocket = new FakeNetSocket();
      fakeSocket.writeResponses.push((data: any, encoding: any) => {
        assert.include(data, "HTTP/1.1 101 Switching Protocols");
        done();
      });

      let fakeRequest: IncomingMessage = generateFakeRequest();
      httpServer.emit("upgrade", fakeRequest, fakeSocket, new Buffer(""));
    });

    it("Should accept a websocket authentication message", (done: MochaDone) => {
      let fakeSocket: FakeNetSocket = new FakeNetSocket();
      fakeSocket.writeResponses.push((data: any, encoding: any) => {
        assert.include(data, "HTTP/1.1 101 Switching Protocols");
        setTimeout(() => {
          fakeSocket.emitWebSocketString(JSON.stringify({
            type: AUTHENTICATION_TYPE,
            indentifer: "identifier",
            password: "password"
          }))
        }, 10);
      });
      fakeSocket.addWriteWebSocketStringResponse((message: string) => {
        let json: any = JSON.parse(message);
        assert.equal(json.type, PLAYER_INFO_TYPE);
        assert.equal(json.playerInfo.identifier, "identifier");
        assert.equal(json.playerInfo.username, "username");
        done();
      });

      let fakeRequest: IncomingMessage = generateFakeRequest();
      httpServer.emit("upgrade", fakeRequest, fakeSocket, new Buffer(""));
    });
  }); // Connection
});
