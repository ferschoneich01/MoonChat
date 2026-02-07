var socket;
let hoy = new Date();
var flag = false;

document.addEventListener("DOMContentLoaded", () => {
  socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
  socket.on("connect", () => {
    socket.on("incoming-msg", function (data) {
      //la conexion del cliente a servidor.
      var ancho = window.innerWidth;

      if (ancho < 600) {
        if (localStorage.getItem("username") == data.username) {
          console.log("" + data.username);
          $("#texto-msj2").append(
            '<li style="list-style:none; widht:100%; margin:5px; height:auto;"><div style="float:right; max-width:95%; min-width:15%;  padding-left:5px; padding-right:5px; font-family: Arial, Helvetica, sans-serif; background:#ffff;  height:auto; border-radius:5px;">' +
            '<div style="color:green;">' +
            "You" +
            '</div> <div style="margin-right:5px;">' +
            data.msg +
            '</div><div style="float:right; color:gray; font-size:10px; margin-top:5px; margin-right:5px;">' +
            data.time_stamp +
            "</div></div></li>"
          ); // insertamos el contenido de a la lista, es decir el texto-msj.
        } else {
          $("#texto-msj2").append(
            '<li style="list-style:none; margin:5px; widht:100%; height:auto;"><div style="float:left; max-width:95%; min-width:15%; padding-left:5px; padding-right:5px; font-family: Arial, Helvetica, sans-serif; background:#ffff; height:auto; border-radius:5px;">' +
            '<div style="color:blue;">' +
            data.username +
            '</div> <div style="margin-right:5px;">' +
            data.msg +
            '</div><div style="float:right; color:gray; font-size:10px; margin-top:5px; margin-right:5px;">' +
            data.time_stamp +
            "</div></div></li>"
          ); // insertamos el contenido de a la lista, es decir el texto-msj.
        }
        //Guardar Mensaje
        var newMessage = {
          username: data.username,
          msg: data.msg,
          group: data.room,
          hour: data.time_stamp,
        };

        MsgList.push(newMessage);
        setMessage(MsgList);


      } else {
        if (localStorage.getItem("username") == data.username) {
          $("#texto-msj").append(
            '<li style="list-style:none; widht:100%; margin:5px; height:auto;"><div style="float:right; max-width:95%; min-width:15%;  padding-left:5px; padding-right:5px; font-family: Arial, Helvetica, sans-serif; background:#ffff;  height:auto; border-radius:5px;">' +
            '<div style="color:green;">' +
            "You" +
            '</div> <div style="margin-right:5px;">' +
            data.msg +
            '</div><div style="float:right; color:gray; font-size:10px; margin-top:5px; margin-right:5px;">' +
            data.time_stamp +
            "</div></div></li>"
          ); // insertamos el contenido de a la lista, es decir el texto-msj.
        } else {
          $("#texto-msj").append(
            '<li style="list-style:none; margin:5px; widht:100%; height:auto;"><div style="float:left; max-width:95%; min-width:15%; padding-left:5px; padding-right:5px; font-family: Arial, Helvetica, sans-serif; background:#ffff; height:auto; border-radius:5px;">' +
            '<div style="color:blue;">' +
            data.username +
            '</div> <div style="margin-right:5px;">' +
            data.msg +
            '</div><div style="float:right; color:gray; font-size:10px; margin-top:5px; margin-right:5px;">' +
            data.time_stamp +
            "</div></div></li>"
          ); // insertamos el contenido de a la lista, es decir el texto-msj.
        }
        //Guardar Mensaje
        var newMessage = {
          username: data.username,
          msg: data.msg,
          group: data.room,
          hour: data.time_stamp,
        };

        MsgList.push(newMessage);
        setMessage(MsgList);
      }
    });

    socket.on("incoming-log-join", function (data) {
      //la conexion del cliente a servidor.
      var ancho = window.innerWidth;
      if (ancho < 600) {
        $("#texto-msj2").append(
          '<li style="list-style:none;">' + data + "</li>"
        );
      } else {
        $("#texto-msj").append(
          '<li style="list-style:none;">' + data + "</li>"
        );
      }
    });

    socket.on("incoming-log-leave", function (data) {
      //la conexion del cliente a servidor.
      if (ancho < 600) {
        $("#texto-msj2").append(
          '<li style="list-style:none;">' + data + "</li>"
        );
      } else {
        $("#texto-msj").append(
          '<li style="list-style:none;">' + data + "</li>"
        );
      }
    });

    $("#Enviar").on("click", function () {
      //nuestro boton tendra la funcion al momento de clikear de mandar ese contenido a texto-msj
      socket.emit("incoming-msg", {
        msg: $("#mi-msj").val(),
        username: $("#username").val(),
        room: $("#group-name").val(),
      });
      $("#mi-msj").val("");
    });

    $("#Enviar2").on("click", function () {
      //nuestro boton tendra la funcion al momento de clikear de mandar ese contenido a texto-msj
      socket.emit("incoming-msg", {
        msg: $("#mi-msj2").val(),
        username: $("#username").val(),
        room: $("#groupNameMsg2").val(),
      });
      $("#mi-msj2").val("");
    });

    $("#btn-room").on("click", function () {
      var newGroup = {
        group: $("#groupName").val(),
        creator: $("#username").val(),
      };

      groupList.push(newGroup);
      setGroup(groupList);
    });

    $("#Salir").on("click", function () {
      //localStorage.removeItem("groupList");
      //localStorage.removeItem("MessageList");

      leaveRoom($("#username").val(), $("#groupNameMsg").val());
      cerrarMessages();
    });

    $("#btn-room").on("click", function () {
      if ($("#groupName").val() == "" || $("#photo").val() == "") {
        alert("Porfavor rellene todos los campos.");
      }
    });

    $("#btn-close").on("click", function () {
      cerrarMessages();
    });
  });

  $("#searchgroup")
    .on("keyup", function () {
      if ($("#searchgroup").val() != "") {
        var g = getGroup();
        console.log(g);

        for (var i = 0; i < g.length; i++) {
          if (
            $("#searchgroup").val() == g[i].group &&
            $("#username").val() != g[i].creator
          ) {
            $("#tableresult").children().hide();
            $("#tableresult").append(
              "<tr><td>" +
              g[i].group +
              '<button type="submit" class="btn button btn-success" style="margin-left:5px; border-radius:25px;">+</button></td></tr>'
            );
          } else {
            $("#tableresult").children().hide();
            $("#tableresult").append("<tr><td>No hay resultados.</td></tr>");
          }
        }
      }
    })
    .keyup();
});

function getGroup() {
  var storedList = localStorage.getItem("groupList");
  if (storedList == null) {
    groupList = [];
  } else {
    groupList = JSON.parse(storedList);
  }
  return groupList;
}

function setGroup(newGroup) {
  localStorage.setItem("groupList", JSON.stringify(newGroup));
}

function setUsername(user) {
  localStorage.setItem("username", user);
}

function getMessage() {
  var storedList = localStorage.getItem("MessageList");
  if (storedList == null) {
    MsgList = [];
  } else {
    MsgList = JSON.parse(storedList);
  }
  return MsgList;
}

function setMessage(newMessage) {
  localStorage.setItem("MessageList", JSON.stringify(newMessage));
}

function MostrarChat(name, img, group) {
  var ancho = window.innerWidth;
  if (ancho < 600) {
    joinRoom(name, group);
    $("#Username-message2").text(group);
    $("#group-name2").val(group);
    $("#groupNameMsg2").val(group);
    $("#img-message2").attr("src", img);
    var list = getMessage();
    for (var i = 0; i < list.length; i++) {
      //console.log(list[i].username+"-"+list[i].group+"-"+list[i].msg);

      if (list[i].username == name && list[i].group == group) {
        $("#texto-msj2").append(
          '<li style="list-style:none; widht:100%; margin:5px; height:auto;"><div style="float:right; max-width:95%; min-width:15%;  padding-left:5px; padding-right:5px; font-family: Arial, Helvetica, sans-serif; background:#ffff;  height:auto; border-radius:5px;">' +
          '<div style="color:green;">' +
          "You" +
          '</div> <div style="margin-right:5px;">' +
          list[i].msg +
          '</div><div style="float:right; color:gray; font-size:10px; margin-top:5px; margin-right:5px;">' +
          list[i].hour +
          "</div></div></li>"
        ); // insertamos el contenido de a la lista, es decir el texto-msj.
      } else if (list[i].username != name && list[i].group == group) {
        $("#texto-msj2").append(
          '<li style="list-style:none; margin:5px; widht:100%; height:auto;"><div style="float:left; max-width:95%; min-width:15%; padding-left:5px; padding-right:5px; font-family: Arial, Helvetica, sans-serif; background:#ffff; height:auto; border-radius:5px;">' +
          '<div style="color:blue;">' +
          list[i].username +
          '</div> <div style="margin-right:5px;">' +
          list[i].msg +
          '</div><div style="float:right; color:gray; font-size:10px; margin-top:5px; margin-right:5px;">' +
          list[i].hour +
          "</div></div></li>"
        ); // insertamos el contenido de a la lista, es decir el texto-msj.
      }
    }
    $("#chatModal").show();
  } else {
    cerrarMessages();
    joinRoom(name, group);
    $("#Username-message").text(group);
    $("#group-name").val(group);
    $("#grupoNomb").val(group);
    $("#groupNameMsg").val(group);
    $("#img-message").attr("src", img);
    var list = getMessage();
    for (var i = 0; i < list.length; i++) {
      //console.log(list[i].username+"-"+list[i].group+"-"+list[i].msg);

      if (list[i].username == name && list[i].group == group) {
        $("#texto-msj").append(
          '<li style="list-style:none; widht:100%; margin:5px; height:auto;"><div style="float:right; max-width:95%; min-width:15%;  padding-left:5px; padding-right:5px; font-family: Arial, Helvetica, sans-serif; background:#ffff;  height:auto; border-radius:5px;">' +
          '<div style="color:green;">' +
          "You" +
          '</div> <div style="margin-right:5px;">' +
          list[i].msg +
          '</div><div style="float:right; color:gray; font-size:10px; margin-top:5px; margin-right:5px;">' +
          list[i].hour +
          "</div></div></li>"
        ); // insertamos el contenido de a la lista, es decir el texto-msj.
      } else if (list[i].username != name && list[i].group == group) {
        $("#texto-msj").append(
          '<li style="list-style:none; margin:5px; widht:100%; height:auto;"><div style="float:left; max-width:95%; min-width:15%; padding-left:5px; padding-right:5px; font-family: Arial, Helvetica, sans-serif; background:#ffff; height:auto; border-radius:5px;">' +
          '<div style="color:blue;">' +
          list[i].username +
          '</div> <div style="margin-right:5px;">' +
          list[i].msg +
          '</div><div style="float:right; color:gray; font-size:10px; margin-top:5px; margin-right:5px;">' +
          list[i].hour +
          "</div></div></li>"
        ); // insertamos el contenido de a la lista, es decir el texto-msj.
      }
    }
    $("#message").children().show();
  }
}

window.onpageshow = function () {
  cerrarMessages();
};

function cerrarMessages() {
  //flag = false;
  var ancho = window.innerWidth;
  // leaveRoom($("#username").val(),$("#group-name").val());
  if (ancho < 600) {
    leaveRoom($("username").val(), $("groupNameMsg2").val());
    $("#message").hide();
    $("#texto-msj2").children().hide();
    $("#chatModal").hide();
  } else {
    leaveRoom($("username").val(), $("groupNameMsg").val());
    $("#message").children().hide();
    $("#texto-msj").children().hide();
  }
}

function joinRoom(username, room) {
  // Join room
  socket.emit("join", { username: username, room: room });
}

function leaveRoom(username, room) {
  socket.emit("leave", { username: username, room: room });
}
