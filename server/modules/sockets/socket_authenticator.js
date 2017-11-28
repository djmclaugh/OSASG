"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const socket_protocol_1 = require("../../../shared/socket_protocol");
const player_socket_1 = require("./player_socket");
// https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent#Status_codes
// The endpoint is terminating the connection due to a protocol error.
const PROTOCOL_ERROR = 1002;
// The server is terminating the connection because it encountered an unexpected condition that
// prevented it from fulfilling the request.
const INTERNAL_ERROR = 1011;
/**
 * Class that combines the different authentication strategies for WebSockets.
 * Given a WebSocket to authenticate via the "authenticate" method, it will either return a
 * PlayerSocket with the appropriate PlayerInfo (via the "onAuthentication" method) or close the the
 * connection with the socket if it fails to authenticate.
 */
class SocketAuthenticator {
    constructor(requestAuthentication, credentialAuthentication, authenticationTimeout) {
        this.requestAuthentication = requestAuthentication;
        this.credentialAuthentication = credentialAuthentication;
        this.authenticationTimeout = authenticationTimeout;
    }
    /**
     * This asynchronous method either authenticates the socket and calls "onAuthentication" with the
     * appropriate PlayerSocket or closes the connection with "ws".
     */
    authenticate(ws, request) {
        if (ws.protocol == socket_protocol_1.CREDENTIALS_AUTHENTICATION_SUBPROTOCOL) {
            this.authenticateWithCredentials(ws);
        }
        else if (ws.protocol == socket_protocol_1.COOKIE_AUTHENTICATION_SUBPROTOCOL) {
            this.authenticateWithCookie(ws, request);
        }
        else {
            ws.close(PROTOCOL_ERROR, "Unknown subprotocol: " + ws.protocol);
        }
    }
    authenticateWithCookie(ws, request) {
        this.requestAuthentication(request, (error, playerInfo) => {
            if (error) {
                console.log(error);
                ws.close(INTERNAL_ERROR, error.message);
            }
            else if (playerInfo) {
                this.onPlayerInfoFound(ws, playerInfo);
            }
            else {
                ws.close(INTERNAL_ERROR, "Player info not found. Invalid or expired cookie.");
            }
        });
    }
    authenticateWithCredentials(ws) {
        let seconds = this.authenticationTimeout / 1000;
        let timer = setTimeout(() => {
            ws.close(PROTOCOL_ERROR, "Expected authentication info within " + seconds + " seconds of connection.");
        }, this.authenticationTimeout);
        ws.onmessage = (ev) => {
            clearTimeout(timer);
            // Only listen to one message.
            ws.onmessage = null;
            let message = JSON.parse(ev.data);
            if (socket_protocol_1.isAuthenticationMessage(message)) {
                this.validateAuthenticationCredentials(ws, message);
            }
            else {
                ws.close(PROTOCOL_ERROR, "Expected first message to be authentication info.");
            }
        };
    }
    validateAuthenticationCredentials(ws, authenticationCredentials) {
        this.credentialAuthentication(authenticationCredentials, (error, playerInfo) => {
            if (error) {
                console.log(error);
                ws.close(INTERNAL_ERROR, error.message);
            }
            else if (playerInfo) {
                this.onPlayerInfoFound(ws, playerInfo);
            }
            else {
                ws.close(INTERNAL_ERROR, "Invalid authentication info.");
            }
        });
    }
    onPlayerInfoFound(ws, info) {
        ws.send(JSON.stringify(socket_protocol_1.newPlayerInfoMessage(info)));
        this.onAuthentication(new player_socket_1.PlayerSocket(info, ws));
    }
}
exports.SocketAuthenticator = SocketAuthenticator;
