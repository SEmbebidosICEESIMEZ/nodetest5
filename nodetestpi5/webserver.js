"use strict";
var http = require('http').createServer(handler); //require http server, and create server with function handler()
var fs = require('fs'); //require filesystem module
var io = require('socket.io')(http) //require socket.io module and pass the http object (server)
const gpio = require("@iiot2k/gpiox");

const INPUT_PIN = 15;
const OUTPUT_PIN = 25;
const DEBOUNCE_US = 1000; // us
//const GPIO_MODE_INPUT_PULLDOWN = 
const BLINK_TIME_MS = 1500; // ms
const GPIO_EDGE_BOTH = 2;
gpio.init_gpio(OUTPUT_PIN, gpio.GPIO_MODE_OUTPUT, 0);

http.listen(8080); //listen to port 8080

function handler (req, res) { //create server
  fs.readFile(__dirname + '/public/index.html', function(err, data) { //read file index.html in public folder
    if (err) {
      res.writeHead(404, {'Content-Type': 'text/html'}); //display 404 on error
      return res.end("404 Not Found");
    }
    res.writeHead(200, {'Content-Type': 'text/html'}); //write HTML
    res.write(data); //write data from index.html
    return res.end();
  });
}

io.sockets.on('connection', function (socket) { // WebSocket Connection
  var lightvalue = 0; //static variable for current status
  console.log("conectado");
  var state = gpio.watch_gpio(INPUT_PIN, gpio.GPIO_MODE_INPUT_PULLDOWN, DEBOUNCE_US, gpio.GPIO_EDGE_BOTH,
    (state, edge) => {
        console.log("port", INPUT_PIN, "state", state, "edge", edge);
        socket.emit('light', state); //send button status to client
});

  socket.on('light', function(data) { //get light switch status from client
    gpio.toggle_gpio(OUTPUT_PIN);
  });
});

process.on('SIGINT', function () { //on ctrl+c
gpio.set_gpio(25, 0);
gpio.deinit_gpio(25);
gpio.deinit_gpio(INPUT_PIN);
  process.exit(); //exit completely
});
