# How to write a Bot #
### Basics ###
User submited bots is one of the main reasons I wanted to make this website and I want the experience to be as seamless as possible (if you have any suggestions on how to make this better, I would be happy to hear them).
I want users to have as much freedom as possible, so bots run on your own hardware!
You can write your bot in any language you want (but a language that easily supports JSON and WebSockets is recommended).

Since you run the bot on your own computer, there is nothing stopping you from using code written by other people or "cheating".
Please be considerate and don't plagiarize. Only use someone else's code if you have their permision and even then, please mention any relevant ideas or tools that you used. 
I also strongly encourage you to make your source code publicly available.

### Messaging Protocol ###
Communication between the game server and the bot is done via WebSocket.
Each message (received and sent) will be a JSON string.
Each message has a "type" property describing its purpose and other properties.
You can find the list of message types and what they are used for [here](https://github.com/djmclaugh/OSASG/blob/master/shared/socket_protocol.ts).

### Authentication ###
Before you can use a bot, you need valid bot credentials.
Simply log in the web client, go to your account settings, and select "Add a Bot".
You can then access your bot's page where you can rename it and see what password it should use to connect to the server.

When creating the WebSocket connection, you have two authentication options.

Cookie Authentication: Used by the web client, not recommended for bots.

Credential Authentication: 
1. Connect to the game server via WebSocket (note: the game server might not be the same URL/port as the web client).
2. Send a message of type `AUTHENTICATION` with the identifier (not username) and password for the bot.
3. If the credentials provided are valid, you'll receive a message of type `PLAYER_INFO` (this means that you have successfully logged in as that bot and can start sending other messages). Otherwise, the server will close the connection.

### Example Flow ###
Here is an example communication between a bot and the server.

~~~ BOT establishes a WebSocket connection to the server ~~~

BOT: ```{
  type: "AUTHENTICATION",
  identifier: "a64b234c123",
  password: "qewrty"
}```

SERVER: ```{
  type: "PLAYER_INFO",
  playerInfo: {
    identifier: "a64b234c123",
    username: "example[bot]"
  }
}```

BOT: ```{
  type: "PREFERENCES",
  profile: {
    canPlay: ["Tictactoe", "Connect6"]
  }
}```

~~~ some amout of time ~~~

SERVER: ```{
  type: "INVITE",
  matchSummary: {
    identifier: "tictactoe_43"
    settings: {
      gameName: "Tictactoe",
      gameOptions: null,
    },
    players: [{identifier: "1a2d3f4c5b", username: "some_player"}, null]
  },
  sender: "some_player",
  receiver: "example[bot]",
  seat: 1
}```

BOT: ```{
  type: "JOIN_MATCH",
  matchID: "tictactoe_43",
  seat: 1
}```

SERVER: ```{
  type: "MATCH_UPDATE",
  matchID: "tictactoe_43",
  matchInfo: {
    settings: ~same as before,
    players: [{identifier: "1a2d3f4c5b", username: "some_player"}, {identifier: "a64b234c123", username: "example[bot]"}],
    updates: [{
      publicInfo: null
      toPlay: [0]
    }]
  }
}```

~~~ some amount of time ~~~

SERVER: ```{
  type: "MATCH_UPDATE",
  matchID: "tictactoe_43",
  update: {
    publicInfo: {x: 1, y: 1},
    toPlay: [1]
  }
}```

BOT: ```{
  type: "PLAY",
  matchID: "tictactoe_43",
  move: {x: 0, y: 0}
}```

SERVER: ```{
  type: "MATCH_UPDATE",
  matchID: "tictactoe_43",
  update: {
    publicInfo: {x: 0, y: 0},
    toPlay: [0]
  }
}```

~~~ repeat this a few times until "some_player" makes a vertical 3 and wins the game ~~~

SERVER: ```{
  type: "MATCH_UPDATE",
  matchID: "tictactoe_43",
  update: {
    publicInfo: {x: 1, y: 0},
    toPlay: []
    winners: [0]
  }
}```

~~~ wait until you receive another invite and repeat ~~~

### Questions? ###
Please look at the [socket_protocol](https://github.com/djmclaugh/OSASG/blob/master/shared/socket_protocol.ts) if you want to know what each type of message does.

Please look at [bot.ts](https://github.com/djmclaugh/OSASG/blob/master/ai/bot.ts) to see a Typescript implementation of the networking portion of a bot.

Please contact me if you still have any questions!
