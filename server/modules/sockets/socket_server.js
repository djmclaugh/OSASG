"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const socket_protocol_1 = require("../../../shared/socket_protocol");
class SocketServer {
    constructor(httpServer, socketAuthenticator) {
        this.socketAuthenticator = socketAuthenticator;
        let serverOptions = {
            server: httpServer,
            handleProtocols: (protocols, request) => {
                return this.selectSubprotocol(protocols);
            }
        };
        this.server = new ws_1.Server(serverOptions);
        this.server.on("connection", (ws, request) => {
            this.onConnection(ws, request);
        });
        this.socketAuthenticator.onAuthentication = (playerSocket) => {
            this.onAuthentication(playerSocket);
        };
    }
    selectSubprotocol(protocols) {
        if (protocols.length == 0 || protocols.indexOf(socket_protocol_1.CREDENTIALS_AUTHENTICATION_SUBPROTOCOL) != -1) {
            return socket_protocol_1.CREDENTIALS_AUTHENTICATION_SUBPROTOCOL;
        }
        else if (protocols.indexOf(socket_protocol_1.COOKIE_AUTHENTICATION_SUBPROTOCOL) != -1) {
            return socket_protocol_1.COOKIE_AUTHENTICATION_SUBPROTOCOL;
        }
        return false;
    }
    onConnection(ws, request) {
        this.socketAuthenticator.authenticate(ws, request);
    }
    onAuthentication(playerSocket) {
    }
}
exports.SocketServer = SocketServer;
