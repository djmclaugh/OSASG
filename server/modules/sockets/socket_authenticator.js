"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const socket_protocol_1 = require("../../../shared/socket_protocol");
const player_socket_1 = require("./player_socket");
class SocketAuthenticator {
    constructor(httpServer, requestAuthentication, credentialAuthentication) {
        this.requestAuthentication = requestAuthentication;
        this.credentialAuthentication = credentialAuthentication;
        this.players = new Map();
        this.authenticationCredentials = new Map();
        this.socketServer = new ws_1.Server({
            server: httpServer
        });
        this.socketServer.on("connection", (ws, request) => {
            this.onConnect(ws, request);
        });
    }
    onConnect(ws, request) {
        ws.onmessage = (ev) => {
            // Only listen to one message.
            ws.onmessage = null;
            let message = JSON.parse(ev.data);
            if (socket_protocol_1.isAuthenticationMessage(message)) {
                this.authenticationCredentials.set(ws, message);
            }
            else {
                this.onAuthenticationFailed(ws, "Expected first message to be authentication info.");
            }
        };
        this.requestAuthentication(request, (error, playerInfo) => {
            if (error) {
                console.log(error);
                this.onAuthenticationFailed(ws, error.message);
            }
            else if (playerInfo) {
                this.onPlayerInfoFound(ws, playerInfo);
            }
            else {
                this.onRequestAuthenticationFailed(ws);
            }
        });
    }
    onRequestAuthenticationFailed(ws) {
        // If the credentials have already been sent while the cookies were being looked at, try to
        // validate them.
        if (this.authenticationCredentials.get(ws)) {
            this.validateAuthenticationCredentials(ws, this.authenticationCredentials.get(ws));
            return;
        }
        // Otherwise, give the player 5 seconds to send them.
        let timer = setTimeout(() => {
            this.onAuthenticationFailed(ws, "Expected authentication info within 5 seconds of connection.");
        }, 5000);
        ws.onmessage = (ev) => {
            clearTimeout(timer);
            // Only listen to one message.
            ws.onmessage = null;
            let message = JSON.parse(ev.data);
            if (socket_protocol_1.isAuthenticationMessage(message)) {
                this.validateAuthenticationCredentials(ws, message);
            }
            else {
                this.onAuthenticationFailed(ws, "Expected first message to be authentication info.");
            }
        };
    }
    validateAuthenticationCredentials(ws, authenticationCredentials) {
        this.credentialAuthentication(authenticationCredentials, (error, playerInfo) => {
            if (error) {
                console.log(error);
                this.onAuthenticationFailed(ws, error.message);
            }
            else if (playerInfo) {
                this.onPlayerInfoFound(ws, playerInfo);
            }
            else {
                this.onAuthenticationFailed(ws, "Invalid authentication info.");
            }
        });
    }
    onAuthenticationFailed(ws, reason) {
        this.authenticationCredentials.delete(ws);
        ws.send(JSON.stringify(reason + " Clossing connection."));
        ws.close();
    }
    onPlayerInfoFound(ws, info) {
        this.authenticationCredentials.delete(ws);
        this.addNewPlayerSocket(new player_socket_1.PlayerSocket(info, ws));
    }
    addNewPlayerSocket(playerSocket) {
        let playerWithSameID = this.players.get(playerSocket.playerInfo.identifier);
        if (!playerWithSameID) {
            playerWithSameID = new Set();
            this.players.set(playerSocket.playerInfo.identifier, playerWithSameID);
        }
        playerWithSameID.add(playerSocket);
        playerSocket.send(socket_protocol_1.newPlayerInfoMessage(playerSocket.playerInfo));
        playerSocket.onSubscription((message) => {
            console.log("Oooo yeah");
        });
    }
}
exports.SocketAuthenticator = SocketAuthenticator;
