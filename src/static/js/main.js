let socket;
let MsgList = [];
let groupList = [];

const isMobile = () => window.innerWidth < 768;

const getMessageContainer = () =>
  isMobile() ? $("#texto-msj2") : $("#texto-msj");

/* =========================
   SOCKET
========================= */

document.addEventListener("DOMContentLoaded", () => {
  socket = io();

  socket.on("incoming-msg", data => {
    renderMessage(data.username, data.msg, data.time_stamp);
    saveMessage(data);
  });

  socket.on("incoming-log-join", msg => {
    appendSystemMessage(msg);
  });

  socket.on("incoming-log-leave", msg => {
    appendSystemMessage(msg);
  });

  $("#Enviar, #Enviar2").on("click", sendMessage);
});

/* =========================
   MENSAJES
========================= */

$("#message").removeClass("chat-hidden");


function renderMessage(username, msg, time) {
  const isMe = localStorage.getItem("username") === username;
  const container = getMessageContainer();

  const messageHTML = `
    <div class="message ${isMe ? "me" : "other"}">
        <div class="author">${isMe ? "You" : username}</div>
        <div class="text">${msg}</div>
        <div class="time">${time}</div>
    </div>
  `;

  container.append(messageHTML);
  scrollToBottom();

  container.scrollTop(container[0].scrollHeight);

}

function appendSystemMessage(msg) {
  getMessageContainer().append(
    `<div class="system-msg">${msg}</div>`
  );
}

/* =========================
   ENVIAR
========================= */

function sendMessage() {
  const input = isMobile() ? $("#mi-msj2") : $("#mi-msj");
  const room = isMobile() ? $("#groupNameMsg2").val() : $("#groupNameMsg").val();

  if (!input.val()) return;

  socket.emit("incoming-msg", {
    msg: input.val(),
    username: $("#username").val(),
    room: room
  });

  input.val("");
}

/* =========================
   SALAS
========================= */

function MostrarChat(username, img, group) {
  cerrarMessages();
  joinRoom(username, group);

  if (isMobile()) {
    $("#groupNameMsg2").val(group);
    $("#img-message2").attr("src", img);
    $("#chatModal").modal("show");
  } else {
    $("#groupNameMsg").val(group);
    $("#img-message").attr("src", img);
    $("#message").show();
  }

  loadMessages(username, group);
}

function cerrarMessages() {
  leaveRoom($("#username").val(),
    isMobile() ? $("#groupNameMsg2").val() : $("#groupNameMsg").val()
  );

  $("#texto-msj, #texto-msj2").empty();
}

/* =========================
   STORAGE
========================= */

function saveMessage(data) {
  MsgList.push({
    username: data.username,
    msg: data.msg,
    group: data.room,
    hour: data.time_stamp
  });

  localStorage.setItem("MessageList", JSON.stringify(MsgList));
}

function loadMessages(username, group) {
  MsgList = JSON.parse(localStorage.getItem("MessageList")) || [];

  MsgList.forEach(m => {
    if (m.group === group) {
      renderMessage(m.username, m.msg, m.hour);
    }
  });
}

/* =========================
   SOCKET HELPERS
========================= */

function joinRoom(username, room) {
  socket.emit("join", { username, room });
}

function leaveRoom(username, room) {
  socket.emit("leave", { username, room });
}

/* =========================
   USER
========================= */

function setUsername(user) {
  localStorage.setItem("username", user);
}


$("#Salir").on("click", () => {
  handleExitChat();
});


function handleExitChat() {
  const username = $("#username").val();
  const room = $("#groupNameMsg").val();

  if (room) {
    leaveRoom(username, room);
  }

  // Limpiar mensajes
  $("#texto-msj, #texto-msj2").empty();
  $("#groupNameMsg").val("");
  $("#img-message").attr("src", "");

  if (isMobile()) {
    $("#chatModal").modal("hide");
  } else {
    // 🔥 CLAVE: ocultar TODO el panel de chat
    $("#message").addClass("chat-hidden");
  }
}


function scrollToBottom() {
  const container = isMobile() ? $("#texto-msj2") : $("#texto-msj");
  container.scrollTop(container[0].scrollHeight);
}
