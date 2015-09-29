var serverIO = require("socket.io");
var clientIO = require("socket.io/node_modules/socket.io-client");

const MOCK_SERVER_URL = "http://localhost:5000";

// Create a mock server that accepts the client sockets and mocks their session data.
var server = serverIO.listen(5000);
var serverSockets = [];
server.sockets.on("connect", function(socket) {
  socket.on("mock-session", function(session) {
    if (serverSocket(session.username) != null) {
      throw new Error("Socket with username '" + session.username + "' already exists.");
    }
    socket.removeAllListeners("mock-session");
    socket.session = session;
    serverSockets.push(socket);
    socket.emit("done");
  });
  socket.on("disconnect", function() {
    var index = serverSockets.indexOf(socket);
    if (index != -1) {
      serverSockets.splice(index, 1);
    }
  });
  socket.on("error", function(error) {
    throw error;
  });
});

function serverSocket(username) {
  for (var i = 0; i < serverSockets.length; ++i) {
    if (serverSockets[i].session.username == username) {
      return serverSockets[i];
    }
  }
  return null;
}

// Create mock clients.
var clientSockets = [];

var mockServer = {};
mockServer.addClient = function(username, callback) {
  var clientSocket = clientIO(MOCK_SERVER_URL, {forceNew: true});
  clientSockets.push(clientSocket);
  clientSocket.on("connect", function() {
    clientSocket.emit("mock-session", {username: username});
  });
  clientSocket.on("done", function() {
    clientSocket.removeAllListeners("done");
    callback(clientSocket, serverSocket(username));
  });
};

mockServer.removeAllSockets = function() {
  for (var i = 0; i < clientSockets.length; ++i) {
    clientSockets[i].disconnect();
  }
  clientSockets = [];
  serverSockets = [];
};

exports.mockServer = mockServer;