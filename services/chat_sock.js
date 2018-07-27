(function () {
    const socket = io.connect();
    let saveBtn = document.querySelector(".btn-save");
    let modal = document.querySelector(".modal");
    let nickInput = document.querySelector("input.nick");
    let nameInput = document.querySelector("input.name");
    let sendBtn = document.querySelector(".btn-submit");
    const message = document.querySelector(".msg");
    const messages = document.querySelector(".messages");
    const usersList = document.querySelector("ul.users-list");
    const typing = document.querySelector('.typing');
    const form = document.querySelector('.msg-input form');


    saveBtn.onclick = () => {
      let nick = nickInput.value;
      let name = nameInput.value;
      if (!nick.length | !name.length) {
        alert("You should fill all fields")
      } else {
        if (validateName(nickInput.value)) {
          login();
      }
      }
    };
    function login() {
      let user = {
        name: nameInput.value,
        nick: nickInput.value,
        status: 'just appeared'
      };
      socket.emit('add user', user)
      setUser(user);
      modal.style.display = 'none';
  }

    function sendMessage () {
      let data = {
        nick: nickInput.value,
        text: message.value,
      };
      message.value = '';
      socket.emit('chat message', data);
    }

    // sendBtn.onclick = () => {
    //   let data = {
    //     nick: nickInput.value,
    //     text: message.value,
    //   };
    //   message.value = '';
    //   socket.emit('chat message', data);
    // };

    sendBtn.addEventListener('click', sendMessage);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      sendMessage();
    })


    socket.on('user history', (users) => {
      usersList.innerHTML = '';
      for(let user of users) {
        setUser(user);
      }
    })
    socket.on('chat history', (msgs) => {
      messages.innerHTML = '';
      for(let msg of msgs) {
        createMessage(msg)
    }
  });

  socket.on('chat message', (msg) => {
    if (!msg.text.length) {
      return
    }
    createMessage(msg);
  })

  socket.on('bot message', (msg) => {
    console.log('BOT ANSWER', msg)
    createMessage(msg)
  })

  socket.on('user joined', (data) => {
    addMessageElement(data.name + ' joined');
    setUser(data);
    addParticipantsMessage(data);
  });

  socket.on('update status', (user) => {
    updateStatus(user.nick, user.status)
  })

  message.onkeypress = (e) => {
    socket.emit('userTyping', {nick: nickInput.value})
  }

  socket.on('typing', user => {
    typing.innerHTML = `@${user.nick} is typing...`;
    setTimeout(() => {
      typing.innerHTML = ''
    }, 2000);
  });

  socket.on('disconnect', () => {
    addMessageElement('you have been disconnected', chatMsg=true);
  });

  socket.on('user left', (data) => {
    addMessageElement(data.nick + ' left', chatMsg=true);
    addParticipantsMessage(data);
  });

  function createMessage(msg) {
    let message = `<b>${msg.nick}:</b> ${msg.text}`;
    addMessageElement(message)
  }
  function setUser(user) {
    const li = document.createElement('li');
    li.className = 'user-name';
    li.id = `${user.nick}`
    li.innerHTML = `${user.name} @${user.nick} <label class="${user.status}">${user.status}</label>`
    usersList.appendChild(li)
  }
  function updateStatus(userNick, status) {
    for (let li of usersList.childNodes){
      if (li.textContent.split(' ').includes(`@${userNick}`)) {
        let label = li.querySelector('label');
        label.className = status;
        label.innerText = status;
      }
    }
  }

  function addParticipantsMessage(data) {
    let message = '';
    if (data.numUsers === 1) {
      message += "there's 1 participant";
    } else {
      message += `there are ${data.numUsers} participants`
    }
    addMessageElement(message, chatMsg=true);
  }

  function addMessageElement(message, chatMsg) {
    let el = document.createElement('li');
    if (chatMsg) {
      el.className = "chat-message"
    }
    if (message.split(' ').includes(`@${nickInput.value}`)){
      el.classList.add('message-direct');
  }
    el.innerHTML = message;
    messages.appendChild(el)
    messages.scrollTo(0,messages.scrollHeight)
  }

  function validateName(name) {
    for (let user of usersList.childNodes){
        let nick = user.id
        if (nick === name) {
            alert(`Nickname '${name}' already taken`);
            return false
        }
    }
    return true
}
  })();

