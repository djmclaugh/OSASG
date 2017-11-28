import { SocketAuthenticator } from "../../modules/sockets/socket_authenticator";

import { assert } from "chai";
import { IncomingMessage } from "http";
import "mocha";
import { PlayerSocket } from "../../modules/sockets/player_socket";
import {
  CredentialAuthenticator,
  RequestAuthenticator,
  PlayerInfoCallback
} from "../../modules/sockets/socket_authenticator";
import { PlayerInfo } from "../../../shared/player_info";
import {
  AUTHENTICATION_TYPE,
  COOKIE_AUTHENTICATION_SUBPROTOCOL,
  CREDENTIALS_AUTHENTICATION_SUBPROTOCOL,
  PLAYER_INFO_TYPE,
  AuthenticationSocketMessage,
  SocketMessage,
  isPlayerInfoMessage,
} from "../../../shared/socket_protocol";
import { FakeWebSocket } from "../mock/fake_web_socket";

describe("SocketAuthenticator", () => {
  let defaultAuthenticator: SocketAuthenticator;
  beforeEach(() => {
    let defaultCredentialAuthenticator: CredentialAuthenticator =
        (credentials: AuthenticationSocketMessage, callback: PlayerInfoCallback) => {
      if (credentials.identifier == "identifier" && credentials.password == "password") {
        callback(null, {identifier: credentials.identifier, username: "username"});
      } else {
        callback(null, null);
      }
    }
    let defaultRequestAuthenticator: RequestAuthenticator =
        (request: IncomingMessage, callback: PlayerInfoCallback) => {
      if (request.headers.cookie == "valid_cookie") {
        callback(null, {identifier: "identifier", username: "username"})
      } else {
        callback(null, null);
      }
    }
    defaultAuthenticator =
        new SocketAuthenticator(defaultRequestAuthenticator, defaultCredentialAuthenticator, 30);
  });

  it("Should close the connection if the socket uses an invalid subprotocol", (done: MochaDone) => {
    let mockSocket: FakeWebSocket = new FakeWebSocket();
    mockSocket.protocol = "SOME_INVALID_SUBPROTOCOL";
    mockSocket.closeResponse = (code: number, reason: string) => {
      assert.equal(code, 1002);
      assert.include(reason, "Unknown subprotocol:");
      done();
    };

    defaultAuthenticator.authenticate(mockSocket, null);
  });

  describe("Credentials Subprotocol", () => {
    it("Should close the connection if the socket uses an unknown identifier", (done: MochaDone) => {
      let mockSocket: FakeWebSocket = new FakeWebSocket();
      mockSocket.protocol = CREDENTIALS_AUTHENTICATION_SUBPROTOCOL;
      mockSocket.closeResponse = (code: number, reason: string) => {
        assert.equal(code, 1011);
        assert.equal(reason, "Invalid authentication info.");
        done();
      };
      defaultAuthenticator.authenticate(mockSocket, null);
      mockSocket.simulateJSONDataReceived({
        type: AUTHENTICATION_TYPE,
        identifier: "invalid_identifier",
        password: "password"
      });
    });

    it("Should close the connection if the socket uses the wrong password", (done: MochaDone) => {
      let mockSocket: FakeWebSocket = new FakeWebSocket();
      mockSocket.protocol = CREDENTIALS_AUTHENTICATION_SUBPROTOCOL;
      mockSocket.closeResponse = (code: number, reason: string) => {
        assert.equal(code, 1011);
        assert.equal(reason, "Invalid authentication info.");
        done();
      };
      defaultAuthenticator.authenticate(mockSocket, null);
      mockSocket.simulateJSONDataReceived({
        type: AUTHENTICATION_TYPE,
        identifier: "identifier",
        password: "wrong_password"
      });
    });

    it("Should close the connection if the socket sends a message of the wrong type", (done: MochaDone) => {
      let mockSocket: FakeWebSocket = new FakeWebSocket();
      mockSocket.protocol = CREDENTIALS_AUTHENTICATION_SUBPROTOCOL;
      mockSocket.closeResponse = (code: number, reason: string) => {
        assert.equal(code, 1002);
        assert.equal(reason, "Expected first message to be authentication info.");
        done();
      };
      defaultAuthenticator.authenticate(mockSocket, null);
      mockSocket.simulateJSONDataReceived({
        type: "wrong_type",
        identifier: "identifier",
        password: "password"
      });
    });

    it("Should close the connection if the socket takes too long to send credentials", (done: MochaDone) => {
      let mockSocket: FakeWebSocket = new FakeWebSocket();
      mockSocket.protocol = CREDENTIALS_AUTHENTICATION_SUBPROTOCOL;
      mockSocket.closeResponse = (code: number, reason: string) => {
        assert.equal(code, 1002);
        assert.equal(reason, "Expected authentication info within 0.03 seconds of connection.");
        done();
      };
      defaultAuthenticator.authenticate(mockSocket, null);
    }).timeout(40);

    it("Should send the socket a player info message when the correct credentials are given", (done: MochaDone) => {
      let mockSocket: FakeWebSocket = new FakeWebSocket();
      mockSocket.protocol = CREDENTIALS_AUTHENTICATION_SUBPROTOCOL;
      mockSocket.addOneTimeMessageResponse((message: string) => {
        let json: SocketMessage = JSON.parse(message);
        if (isPlayerInfoMessage(json)) {
          assert.equal(json.playerInfo.identifier, "identifier");
          assert.equal(json.playerInfo.username, "username");
          done();
        } else {
          assert.fail(json.type, PLAYER_INFO_TYPE, "Expected a player info message");
        }
      });

      defaultAuthenticator.authenticate(mockSocket, null);
      defaultAuthenticator.onAuthentication = () => {};
      mockSocket.simulateJSONDataReceived({
        type: AUTHENTICATION_TYPE,
        identifier: "identifier",
        password: "password"
      });
    });

    it("Should call 'onAuthentication' when a socket successfully authenticates", (done: MochaDone) => {
      let mockSocket: FakeWebSocket = new FakeWebSocket();
      mockSocket.protocol = CREDENTIALS_AUTHENTICATION_SUBPROTOCOL;
      mockSocket.addOneTimeMessageResponse(() => {});

      defaultAuthenticator.authenticate(mockSocket, null);
      defaultAuthenticator.onAuthentication = (playerSocket: PlayerSocket) => {
        assert.equal(playerSocket.playerInfo.identifier, "identifier");
        assert.equal(playerSocket.playerInfo.username, "username");
        assert.equal(playerSocket.socket, mockSocket);
        done();
      };
      mockSocket.simulateJSONDataReceived({
        type: AUTHENTICATION_TYPE,
        identifier: "identifier",
        password: "password"
      });
    });
  });

  describe("Cookie Subprotocol", () => {
    it("Should close the connection if no player info is related to the request", (done: MochaDone) => {
      let mockSocket: FakeWebSocket = new FakeWebSocket();
      mockSocket.protocol = COOKIE_AUTHENTICATION_SUBPROTOCOL;
      mockSocket.closeResponse = (code: number, reason: string) => {
        assert.equal(code, 1011);
        assert.equal(reason, "Player info not found. Invalid or expired cookie.");
        done();
      };

      let request: IncomingMessage = new IncomingMessage(null);
      request.headers.cookie = "invalid_cookie";

      defaultAuthenticator.authenticate(mockSocket, request);
    });

    it("Should send the socket a player info message when the correct cookies are given", (done: MochaDone) => {
      let mockSocket: FakeWebSocket = new FakeWebSocket();
      mockSocket.protocol = COOKIE_AUTHENTICATION_SUBPROTOCOL;
      mockSocket.addOneTimeMessageResponse((message: string) => {
        let json: SocketMessage = JSON.parse(message);
        if (isPlayerInfoMessage(json)) {
          assert.equal(json.playerInfo.identifier, "identifier");
          assert.equal(json.playerInfo.username, "username");
          done();
        } else {
          assert.fail(json.type, PLAYER_INFO_TYPE, "Expected a player info message");
        }
      });

      let request: IncomingMessage = new IncomingMessage(null);
      request.headers.cookie = "valid_cookie";

      defaultAuthenticator.onAuthentication = () => {};
      defaultAuthenticator.authenticate(mockSocket, request);
    });

    it("Should call 'onAuthentication' when a socket successfully authenticates", (done: MochaDone) => {
      let mockSocket: FakeWebSocket = new FakeWebSocket();
      mockSocket.protocol = COOKIE_AUTHENTICATION_SUBPROTOCOL;
      mockSocket.addOneTimeMessageResponse(() => {});

      let request: IncomingMessage = new IncomingMessage(null);
      request.headers.cookie = "valid_cookie";

      defaultAuthenticator.onAuthentication = (playerSocket: PlayerSocket) => {
        assert.equal(playerSocket.playerInfo.identifier, "identifier");
        assert.equal(playerSocket.playerInfo.username, "username");
        assert.equal(playerSocket.socket, mockSocket);
        done();
      };
      defaultAuthenticator.authenticate(mockSocket, request);
    });
  });
});
