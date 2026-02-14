/* =====================================================
   VARIABLES GLOBALES
===================================================== */

let socket;

const isMobile = () => window.innerWidth < 768;

const getMessageContainer = () =>
  isMobile() ? $("#texto-msj2") : $("#texto-msj");

/* =====================================================
   INIT
===================================================== */


document.addEventListener("DOMContentLoaded", () => {
  socket = io();

  // 🔥 OCULTAR CHAT AL INICIAR
  $("#message").addClass("chat-hidden");
  
  const myUsername = $("#username").val();

  /* 🔥 AUTO-JOIN A TODOS LOS GRUPOS */
  fetch("/api/my-groups")
    .then(res => res.json())
    .then(data => {
      data.groups.forEach(group => {
        joinRoom(myUsername, group);
      });
    })
    .catch(err => console.error("Error loading groups", err));

  /* =========================
     SOCKET LISTENERS
  ========================= */

  socket.on("incoming-msg", data => {
    // ❌ Evitar duplicar mis propios mensajes
    if (data.username === myUsername) return;

    renderMessage(data.username, data.msg, data.time_stamp);
    scrollToBottom();
  });

  socket.on("incoming-log-join", msg => appendSystemMessage(msg));
  socket.on("incoming-log-leave", msg => appendSystemMessage(msg));

  $("#Enviar, #Enviar2").on("click", sendMessage);
});

/* =====================================================
   MENSAJES
===================================================== */

function renderMessage(username, msg, time) {
  const myUsername = $("#username").val();
  const isMe = myUsername === username;
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
}

function appendSystemMessage(msg) {
  getMessageContainer().append(
    `<div class="system-msg">${msg}</div>`
  );
}

/* =====================================================
   ENVIAR MENSAJE (OPTIMISTIC UI)
===================================================== */

function sendMessage() {
  const input = isMobile() ? $("#mi-msj2") : $("#mi-msj");
  const room = isMobile()
    ? $("#groupNameMsg2").val()
    : $("#groupNameMsg").val();

  const username = $("#username").val();
  const message = input.val().trim();

  if (!message || !room) return;

  // 🔥 Mostrar inmediatamente
  renderMessage(username, message, "now");

  socket.emit("incoming-msg", {
    msg: message,
    username: username,
    room: room
  });

  input.val("");
  scrollToBottom();
}

/* =====================================================
   CHATS / SALAS
===================================================== */

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

    // 🔥 CLAVE: volver a mostrar el chat
    $("#message").removeClass("chat-hidden");
  }

  loadMessagesFromServer(group);
}

function cerrarMessages() {
  $("#texto-msj, #texto-msj2").empty();
}

/* =====================================================
   HISTORIAL DESDE SERVIDOR
===================================================== */

function loadMessagesFromServer(group) {
  const container = getMessageContainer();
  container.empty();

  fetch(`/api/messages/${encodeURIComponent(group)}`)
    .then(res => res.json())
    .then(data => {
      data.messages.forEach(m => {
        renderMessage(m.username, m.message, m.created_at);
      });
      scrollToBottom();
    })
    .catch(err => console.error("Error loading messages", err));
}

/* =====================================================
   SOCKET HELPERS
===================================================== */

function joinRoom(username, room) {
  socket.emit("join", { username, room });
}

function leaveRoom(username, room) {
  socket.emit("leave", { username, room });
}

/* =====================================================
   SALIR DEL CHAT
===================================================== */

$("#Salir").on("click", handleExitChat);

function handleExitChat() {
  $("#texto-msj, #texto-msj2").empty();
  $("#groupNameMsg, #groupNameMsg2").val("");
  $("#img-message, #img-message2").attr("src", "");

  if (isMobile()) {
    $("#chatModal").modal("hide");
  } else {
    $("#message").addClass("chat-hidden");
  }
}

/* =====================================================
   SCROLL
===================================================== */

function scrollToBottom() {
  const container = getMessageContainer();
  container.scrollTop(container[0].scrollHeight);
}

/* =====================================================
   SEARCH GROUP (DYNAMIC)
===================================================== */

let searchTimeout = null;

$(document).on("keydown", "#searchGroupInput", e => {
  if (e.key === "Enter") e.preventDefault();
});

$(document).on("input", "#searchGroupInput", function () {
  const query = $(this).val().trim();
  clearTimeout(searchTimeout);

  if (query.length < 2) {
    $("#groupResults").empty();
    $("#searchFeedback").text("Type at least 2 characters");
    return;
  }

  $("#searchFeedback").text("Searching...");

  searchTimeout = setTimeout(() => {
    fetch(`/api/groups/search?q=${encodeURIComponent(query)}`)
      .then(res => res.json())
      .then(data => renderGroupResults(data.groups))
      .catch(() => $("#searchFeedback").text("Error searching groups"));
  }, 300);
});

function renderGroupResults(groups) {
  const list = $("#groupResults");
  list.empty();

  if (!groups.length) {
    $("#searchFeedback").text("No groups found");
    return;
  }

  $("#searchFeedback").text(`${groups.length} result(s)`);

  groups.forEach(g => {
    list.append(`
      <li class="list-group-item d-flex align-items-center justify-content-between">
        <div class="d-flex align-items-center">
          <img src="${g.photo}" class="UserIcon me-2">
          <strong>${g.name}</strong>
        </div>
        <button class="btn btn-sm btn-success"
          onclick="joinGroup(${g.id_group}, '${g.name.replace(/'/g, "\\'")}')">
          Join
        </button>
      </li>
    `);
  });
}

function joinGroup(groupId) {
  fetch("/join-group", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `group_id=${groupId}`
  })
    .then(() => location.reload())
    .catch(() => alert("Could not join group"));
}

$("#Modal2").on("shown.bs.modal", () => {
  $("#searchGroupInput").val("").focus();
  $("#groupResults").empty();
  $("#searchFeedback").text("Type at least 2 characters");
});
