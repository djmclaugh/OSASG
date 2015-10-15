var assert = require("assert");
var SocketServer = require("../modules/socket_server");
var net = require("net");

const PORT = 12345;

describe("Socket Server", function() {
  var server;
  
  beforeEach(function() {
    server = new SocketServer(PORT);
  });
  
  afterEach(function(done) {
    server.close(done);
  });
  
  it("should create a TCP server and listen on the specified port", function(done) {
    var client = new net.Socket();
    client.connect(PORT, "localhost", done);
  });
  
  it("should notify its listeners when a new connection has been authenticated", function(done) {
    server.onConnection(function(socket) {
      assert.equal(socket.session.username, "username");
      done();
    });
    var client = new net.Socket();
    client.connect(PORT, "localhost", function() {
      var message = {
        type: "authorization",
        name: "username",
        passsword: "not yet implemented"
      };
      client.write(JSON.stringify(message) + "\n");
    });
  });
  
  describe("Parsing", function() {
    var clientSocket;
    var serverSocket;
    
    beforeEach(function(done) {
      server.onConnection(function(socket) {
        serverSocket = socket;
        done();
      });
      
      clientSocket = new net.Socket();
      clientSocket.connect(PORT, "localhost", function() {
        var message = {
          type: "authorization",
          name: "username",
          passsword: "not yet implemented"
        };
        clientSocket.write(JSON.stringify(message) + "\n");
      });
    });
      
    it("should be able to parse simple client messages", function(done) {
      var toSend = [
        '{"type":"test", "string":"abc"}\n',
        '{"type":"test", "number":1}\n',
        '{"type":"test", "decimal":3.14159}\n',
        '{"type":"test", "true":true}\n',
        '{"type":"test", "false":false}\n',
        '{"type":"test", "null":null}\n',
        '{"type":"test", "string":"abc", "number":1, "decimal":3.14159, "true":true, "false": false, "null":null}\n'
      ];
      var toExpect = [
        {string: "abc"},
        {number: 1},
        {decimal: 3.14159},
        {true: true},
        {false: false},
        {null: null},
        {string: "abc", number: 1, decimal: 3.14159, true: true, false: false, null: null}
      ];
      var counter = 0;
      serverSocket.on("test", function(data) {
        assert.deepEqual(data, toExpect[counter++]);
        if (counter == toSend.length) {
          done();
        } else {
          clientSocket.write(toSend[counter]);
        }
      });
      clientSocket.write(toSend[0]);
    });
    
    it("should be able to send simple messages to the client", function(done) {
      var toExpect = [
        '{"string":"abc","type":"test"}\n',
        '{"number":1,"type":"test"}\n',
        '{"decimal":3.14159,"type":"test"}\n',
        '{"true":true,"type":"test"}\n',
        '{"false":false,"type":"test"}\n',
        '{"null":null,"type":"test"}\n',
        '{"string":"abc","number":1,"decimal":3.14159,"true":true,"false":false,"null":null,"type":"test"}\n'
      ];
      var toSend = [
        {string: "abc"},
        {number: 1},
        {decimal: 3.14159},
        {true: true},
        {false: false},
        {null: null},
        {string: "abc", number: 1, decimal: 3.14159, true: true, false: false, null: null}
      ];
      var counter = 0;
      clientSocket.on("data", function(data) {
        assert.equal(data, toExpect[counter++]);
        if (counter == toSend.length) {
          done();
        } else {
          serverSocket.emit("test", toSend[counter]);
        }
      });
      serverSocket.emit("test", toSend[0]);
    });
  
    it("should be able to parse client messages with arrays and objects");
    it("should be able to send messages with arrays and objects to the client");
    it("should detect when it only receives part of a message and wait for the full message to parse it");
    
  });  // end of describe("Parsing")
});
