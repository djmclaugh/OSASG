"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const socket_authenticator_1 = require("../../modules/sockets/socket_authenticator");
const chai_1 = require("chai");
const http_1 = require("http");
require("mocha");
const socket_protocol_1 = require("../../../shared/socket_protocol");
const fake_web_socket_1 = require("../mock/fake_web_socket");
describe("SocketAuthenticator", () => {
    let defaultAuthenticator;
    beforeEach(() => {
        let defaultCredentialAuthenticator = (credentials, callback) => {
            if (credentials.identifier == "identifier" && credentials.password == "password") {
                callback(null, { identifier: credentials.identifier, username: "username" });
            }
            else {
                callback(null, null);
            }
        };
        let defaultRequestAuthenticator = (request, callback) => {
            if (request.headers.cookie == "valid_cookie") {
                callback(null, { identifier: "identifier", username: "username" });
            }
            else {
                callback(null, null);
            }
        };
        defaultAuthenticator =
            new socket_authenticator_1.SocketAuthenticator(defaultRequestAuthenticator, defaultCredentialAuthenticator, 30);
    });
    it("Should close the connection if the socket uses an invalid subprotocol", (done) => {
        let mockSocket = new fake_web_socket_1.FakeWebSocket();
        mockSocket.protocol = "SOME_INVALID_SUBPROTOCOL";
        mockSocket.closeResponse = (code, reason) => {
            chai_1.assert.equal(code, 1002);
            chai_1.assert.include(reason, "Unknown subprotocol:");
            done();
        };
        defaultAuthenticator.authenticate(mockSocket, null);
    });
    describe("Credentials Subprotocol", () => {
        it("Should close the connection if the socket uses an unknown identifier", (done) => {
            let mockSocket = new fake_web_socket_1.FakeWebSocket();
            mockSocket.protocol = socket_protocol_1.CREDENTIALS_AUTHENTICATION_SUBPROTOCOL;
            mockSocket.closeResponse = (code, reason) => {
                chai_1.assert.equal(code, 1011);
                chai_1.assert.equal(reason, "Invalid authentication info.");
                done();
            };
            defaultAuthenticator.authenticate(mockSocket, null);
            mockSocket.simulateJSONDataReceived({
                type: socket_protocol_1.AUTHENTICATION_TYPE,
                identifier: "invalid_identifier",
                password: "password"
            });
        });
        it("Should close the connection if the socket uses the wrong password", (done) => {
            let mockSocket = new fake_web_socket_1.FakeWebSocket();
            mockSocket.protocol = socket_protocol_1.CREDENTIALS_AUTHENTICATION_SUBPROTOCOL;
            mockSocket.closeResponse = (code, reason) => {
                chai_1.assert.equal(code, 1011);
                chai_1.assert.equal(reason, "Invalid authentication info.");
                done();
            };
            defaultAuthenticator.authenticate(mockSocket, null);
            mockSocket.simulateJSONDataReceived({
                type: socket_protocol_1.AUTHENTICATION_TYPE,
                identifier: "identifier",
                password: "wrong_password"
            });
        });
        it("Should close the connection if the socket sends a message of the wrong type", (done) => {
            let mockSocket = new fake_web_socket_1.FakeWebSocket();
            mockSocket.protocol = socket_protocol_1.CREDENTIALS_AUTHENTICATION_SUBPROTOCOL;
            mockSocket.closeResponse = (code, reason) => {
                chai_1.assert.equal(code, 1002);
                chai_1.assert.equal(reason, "Expected first message to be authentication info.");
                done();
            };
            defaultAuthenticator.authenticate(mockSocket, null);
            mockSocket.simulateJSONDataReceived({
                type: "wrong_type",
                identifier: "identifier",
                password: "password"
            });
        });
        it("Should close the connection if the socket takes too long to send credentials", (done) => {
            let mockSocket = new fake_web_socket_1.FakeWebSocket();
            mockSocket.protocol = socket_protocol_1.CREDENTIALS_AUTHENTICATION_SUBPROTOCOL;
            mockSocket.closeResponse = (code, reason) => {
                chai_1.assert.equal(code, 1002);
                chai_1.assert.equal(reason, "Expected authentication info within 0.03 seconds of connection.");
                done();
            };
            defaultAuthenticator.authenticate(mockSocket, null);
        }).timeout(40);
        it("Should send the socket a player info message when the correct credentials are given", (done) => {
            let mockSocket = new fake_web_socket_1.FakeWebSocket();
            mockSocket.protocol = socket_protocol_1.CREDENTIALS_AUTHENTICATION_SUBPROTOCOL;
            mockSocket.addOneTimeMessageResponse((message) => {
                let json = JSON.parse(message);
                if (socket_protocol_1.isPlayerInfoMessage(json)) {
                    chai_1.assert.equal(json.playerInfo.identifier, "identifier");
                    chai_1.assert.equal(json.playerInfo.username, "username");
                    done();
                }
                else {
                    chai_1.assert.fail(json.type, socket_protocol_1.PLAYER_INFO_TYPE, "Expected a player info message");
                }
            });
            defaultAuthenticator.authenticate(mockSocket, null);
            defaultAuthenticator.onAuthentication = () => { };
            mockSocket.simulateJSONDataReceived({
                type: socket_protocol_1.AUTHENTICATION_TYPE,
                identifier: "identifier",
                password: "password"
            });
        });
        it("Should call 'onAuthentication' when a socket successfully authenticates", (done) => {
            let mockSocket = new fake_web_socket_1.FakeWebSocket();
            mockSocket.protocol = socket_protocol_1.CREDENTIALS_AUTHENTICATION_SUBPROTOCOL;
            mockSocket.addOneTimeMessageResponse(() => { });
            defaultAuthenticator.authenticate(mockSocket, null);
            defaultAuthenticator.onAuthentication = (playerSocket) => {
                chai_1.assert.equal(playerSocket.playerInfo.identifier, "identifier");
                chai_1.assert.equal(playerSocket.playerInfo.username, "username");
                chai_1.assert.equal(playerSocket.socket, mockSocket);
                done();
            };
            mockSocket.simulateJSONDataReceived({
                type: socket_protocol_1.AUTHENTICATION_TYPE,
                identifier: "identifier",
                password: "password"
            });
        });
    });
    describe("Cookie Subprotocol", () => {
        it("Should close the connection if no player info is related to the request", (done) => {
            let mockSocket = new fake_web_socket_1.FakeWebSocket();
            mockSocket.protocol = socket_protocol_1.COOKIE_AUTHENTICATION_SUBPROTOCOL;
            mockSocket.closeResponse = (code, reason) => {
                chai_1.assert.equal(code, 1011);
                chai_1.assert.equal(reason, "Player info not found. Invalid or expired cookie.");
                done();
            };
            let request = new http_1.IncomingMessage(null);
            request.headers.cookie = "invalid_cookie";
            defaultAuthenticator.authenticate(mockSocket, request);
        });
        it("Should send the socket a player info message when the correct cookies are given", (done) => {
            let mockSocket = new fake_web_socket_1.FakeWebSocket();
            mockSocket.protocol = socket_protocol_1.COOKIE_AUTHENTICATION_SUBPROTOCOL;
            mockSocket.addOneTimeMessageResponse((message) => {
                let json = JSON.parse(message);
                if (socket_protocol_1.isPlayerInfoMessage(json)) {
                    chai_1.assert.equal(json.playerInfo.identifier, "identifier");
                    chai_1.assert.equal(json.playerInfo.username, "username");
                    done();
                }
                else {
                    chai_1.assert.fail(json.type, socket_protocol_1.PLAYER_INFO_TYPE, "Expected a player info message");
                }
            });
            let request = new http_1.IncomingMessage(null);
            request.headers.cookie = "valid_cookie";
            defaultAuthenticator.onAuthentication = () => { };
            defaultAuthenticator.authenticate(mockSocket, request);
        });
        it("Should call 'onAuthentication' when a socket successfully authenticates", (done) => {
            let mockSocket = new fake_web_socket_1.FakeWebSocket();
            mockSocket.protocol = socket_protocol_1.COOKIE_AUTHENTICATION_SUBPROTOCOL;
            mockSocket.addOneTimeMessageResponse(() => { });
            let request = new http_1.IncomingMessage(null);
            request.headers.cookie = "valid_cookie";
            defaultAuthenticator.onAuthentication = (playerSocket) => {
                chai_1.assert.equal(playerSocket.playerInfo.identifier, "identifier");
                chai_1.assert.equal(playerSocket.playerInfo.username, "username");
                chai_1.assert.equal(playerSocket.socket, mockSocket);
                done();
            };
            defaultAuthenticator.authenticate(mockSocket, request);
        });
    });
});
