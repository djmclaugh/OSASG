# How to write a Bot #
### Basics ###
User submited bots is one of the main reasons I wanted to make this website and I want the experience to be as seamless as possible (if you have any suggestions on how to make this better, I would be happy to hear them).
I want users to have as much freedom as possible. That's why I decided to let users run their bots on their own hardware and then relay the moves via TCP.

You can write a bot in ANY language that you want as long as it supports TCP sockets.
The server will be listening for TCP connections on port 8882.
All communication will be made using [Line Delimited JSON](https://en.wikipedia.org/wiki/Line_Delimited_JSON).

Since you run the bot on your own computer, there is nothing stopping you from using code written by other people.
Please be considerate and don't plagiarize. Only use someone else's ai if you have their permision and even then, please mention any relevant ideas or tools that you used. 
I also strongly encourage you to make your source code publicly available.

### Authentication (not yet implemented) ###
Before you can use a bot, you need valid bot credentials.
Simply log in, go to your account settings, and select "Add a Bot".
You can then access your bot's page where you can rename it and see what password it should use to connect to the server.
Since this is not implemented yet, the server will always believe that you are who you the bot you claim to be (regardless of password).

### Events ###
Here are the messages that the server can send to your bot:
* `{type: "join", matchId: string}`: The server wants you to join the match 'matchId'. (Note: You haven't joined the match yet. You can always ignore this message. This is usefull if your bot can only handle so many games at a time.)
* `{type: "update", matchId: string, p1: string, p2: string, gameData: Object}`: A complete update on the current state of match 'matchId'. 
* `{type: "play", matchId: string, move: object}`: The server is letting you know that the move 'move' has been received and accepted for the match 'matchId'. Note that the move format is different for every game and can be found at the top of the appropriate .js file in the /modules/games folder.
* `{type: "error-message", error: string}`: An non-fatal error (like playing out of turn) has occured and the server is letting you know.

Here are the messages that the server can understand:
* `{type: "authentication", name: string, password: string}`: Send this as soon a you connect so that the server can know who you are.
* `{type: "join", matchId: string}`: Join the match 'matchId'.
* `{type: "play", matchId: string, move: object}`: Tell the server that you want to play 'move' in 'matchId".

### Flow ###
Here is the intended flow of messages after connection has been established:

BOT: authentication testBot password (Hey, I'm testBot).  
SERVER: (closes socket if authentication fails or silently accepts.)  

~~~ some amout of time ~~~

SERVER: `join tictactoe_123` (Hey, join this match!)  
BOT: `join tictactoe_123` (Sure, I'll join tictactoe\_123)  
SERVER: `update tictactoe_123` testBot proBot *gameData* (Here's the match information so far. You can see that you have joined this match as P1. You can also see that P2 has joined as well, so the game has started and you should make your move.)  
BOT: `play tictactoe_123` {x: 1, y: 1} (I want to play in the center.)  
SERVER: `play tictactoe_123` {x: 1, y: 1} (The move {x: 1, y: 1} has been accepted.)  

~~~ some amount of time ~~~

SERVER: `play tictactoe_123 {x: 0, y: 0}` (The move {x: 0, y: 0} has been accepted.)  
BOT: `play tictactoe_123 {x: 0, y: 2}` (Ok, if my opponent plays in the corner, I'll also play in a corner.)  
SERVER: `play tictactoe_123 {x: 0, y: 2}` (The move {x: 0, y: 2} has been accepted.)  

~~~ some amount of time ~~~

SERVER: `join tictactoe_456` (Hey, join this match!)  
BOT: `join tictactoe_456` (Sure, I'll join tictactoe\_456)  
SERVER: `update tictactoe_456 null testBot *gameData*` (Here's the match information so far. You can see that you have joined this match as P2. P1 hasn't joined yet so the game hasn't started.)  

~~~ some amount of time ~~~

SERVER: `update tictactoe_456 otherBot testBot *gameData*` (P1 has joined so the match has started, but it's not your turn yet since you are P2.)  

~~~ some amount of time ~~~

SERVER: `play tictactoe_123 {x: 2, y: 0}` (The move {x: 2, y: 0} has been accepted.)  
BOT: `play tictactoe_123 {x: 1, y: 0}` (Ok, I have to block the y = 0 line.)  
SERVER: `play tictactoe_123 {x: 1, y: 0}` (The move {x: 1, y: 0} has been accepted.)  

~~~ some amount of time ~~~

SERVER: `play tictactoe_456 {x: 1, y: 1}` (The move {x: 1, y: 1} has been accepted.)  
BOT: `play tictactoe_456 {x: 2, y: 2}` (Oh, this game. I'll play in the corner)  
SERVER: `play tictactoe_456 {x: 2, y: 2}` (The move {x: 2, y: 2} has been accepted.)  

~~~ some amount of time ~~~

SERVER: `join tictactoe_789 2` (Hey, join this match as player 2!)  
BOT: (I'm already playing two games, I'll just ignore that one.)  

and so on...
