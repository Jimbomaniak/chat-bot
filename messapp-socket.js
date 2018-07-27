var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
const bodyParser = require('body-parser');

const bot = require('./services/bot');

let numUsers = 0;
let messages = [];
let users =[];

const isPromise = (obj) => typeof obj.then == 'function';

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index-sock.html')
});
app.get('/services/chat_sock.js', (req, res) => {
  res.sendFile(__dirname + '/services/chat_sock.js')
});

app.get('/style.css', (req, res) => {
  res.sendFile(__dirname + '/public/style.css')
});


app.get('/messages', (req, res) => res.json(messages));

app.post('/messages', (req, res) => messages.push(req.body));

io.on('connection', (socket) => {
  let addedUser = false;

  socket.on('chat message', (msg) => {
    if (messages.length > 100) {
      messages.shift();
      socket.emit('chat history', messages)
    }
    messages.push(msg);
    io.emit('chat message', msg);
    if (bot.textListener(msg.text)) {
        response = bot.communicate(msg);
        if (isPromise(response.text)) {
          response.text.then((data) => {
            let res = 'This city not found'
            if (data.cod === 200) {
              res = `Temperature: ${data.main.temp} News: ${data.weather.map(item => item.description)}`
            }
            return io.emit('bot message', {nick:'Weather BOT', text:res})})
        } else {
          io.emit('bot message', response);
        }
  }
})

  socket.on('add user', (user) => {
    if (addedUser) return;
    ++numUsers
    addedUser = true;
    users.push(user);
    socket.usernick = user.nick;
    socket.username = user.name;
    updateStatus(user);

    socket.broadcast.emit('user joined', {
      name: socket.username,
      nick: socket.usernick,
      status: user.status,
      numUsers: numUsers
    });
  })
  socket.on('userTyping', (user) => {
    io.emit('typing', user)
  })


  socket.on('disconnect', () => {
    if (addedUser) {
      --numUsers;

      users = users.filter(user => user.name !== socket.username);
      let user = {
        name: socket.username,
        nick: socket.usernick,
        status: 'just left',
        numUsers: numUsers
      }
      socket.broadcast.emit('user left', user);
      updateStatus(user, reason='left', 1000)
      updateStatus(user, reason='off')
    }
  });

  socket.emit('chat history', messages);
  socket.emit('user history', users);


  function updateStatus(user, reason='enter', time=60000) {
    setTimeout(() => {
        if (reason === 'enter') {
          user.status = 'online'
        } else if (reason === 'left') {
          user.status = 'just left'
        } else if (reason ==='off') {
          user.status = 'offline'
        }
        io.emit('update status', user)
    }, time)
  }
})

http.listen(3030, () => console.log('Listening on *:3030'));

