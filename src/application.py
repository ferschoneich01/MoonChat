import os
import time
import datetime

from flask import Flask, render_template, url_for, request, flash, redirect, session, make_response
from flask_socketio import SocketIO, emit, leave_room, join_room
from flask_session import Session

from sqlalchemy import create_engine, text
from sqlalchemy.orm import scoped_session, sessionmaker

from funciones import *
from werkzeug.security import check_password_hash, generate_password_hash

app = Flask(__name__)

# =========================
# CONFIGURACIÓN
# =========================
if not os.getenv("DATABASE_URL"):
    raise RuntimeError("DATABASE_URL is not set")
if not os.getenv("SECRET_KEY"):
    raise RuntimeError("SECRET_KEY is not set")

app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
app.config["SESSION_TYPE"] = "filesystem"
app.config["SESSION_PERMANENT"] = True

Session(app)
socketio = SocketIO(app, manage_session=False)

# =========================
# DATABASE
# =========================
engine = create_engine(os.getenv("DATABASE_URL"))
db = scoped_session(sessionmaker(bind=engine))

# =========================
# SOCKET EVENTS
# =========================
@socketio.on("incoming-msg")
def on_message(data):
    time_stamp = time.strftime("%b-%d %I:%M%p", time.localtime())
    emit(
        "incoming-msg",
        {
            "username": data["username"],
            "msg": data["msg"],
            "time_stamp": time_stamp,
            "room": data["room"]
        },
        room=data["room"]
    )


@socketio.on("join")
def on_join(data):
    join_room(data["room"])
    emit("incoming-log-join", f"{data['username']} esta en linea.", to=data["room"])


@socketio.on("leave")
def on_leave(data):
    leave_room(data["room"])
    emit("incoming-log-leave", f"{data['username']} esta desconectado.", to=data["room"])


# =========================
# ROUTES
# =========================
@app.route("/")
@login_required
def index():
    user = db.execute(
    text("SELECT * FROM public.users WHERE id_user = :id"),
    {"id": session["id_user"]}
    ).mappings().fetchone()


    groups = db.execute(
        text("""
            SELECT g.photo, g.name
            FROM public.user_group ug
            INNER JOIN public."group" g ON g.id_group = ug.id_group
            WHERE ug.id_user = :id
        """),
        {"id": session["id_user"]}
    ).mappings().fetchall()


    friends = [[g["photo"], g["name"]] for g in groups]

    return render_template(
        "index.html",
        friends=friends,
        username=user["username"],
        photo=user["image"]
    )


@app.route("/join-group", methods=["POST"])
@login_required
def joingroup():
    group_name = request.form.get("searchgroup")

    if not group_name:
        flash("Debe ingresar un nombre de grupo")
        return redirect("/")

    group = db.execute(
        text('SELECT id_group FROM public."group" WHERE name = :name'),
        {"name": group_name}
    ).mappings().fetchone()

    if not group:
        flash("El grupo no existe")
        return redirect("/")

    # Evitar que se una dos veces
    already_joined = db.execute(
        text("""
            SELECT 1
            FROM public.user_group
            WHERE id_user = :user AND id_group = :group
        """),
        {"user": session["id_user"], "group": group["id_group"]}
    ).fetchone()

    if already_joined:
        flash("Ya perteneces a este grupo")
        return redirect("/")

    db.execute(
        text("""
            INSERT INTO public.user_group (id_user, id_group)
            VALUES (:user, :group)
        """),
        {"user": session["id_user"], "group": group["id_group"]}
    )
    db.commit()

    flash("Te uniste al grupo correctamente")
    return redirect("/")


@app.route("/create-group", methods=["POST"])
@login_required
def createGroup():
    group_name = request.form.get("groupName")
    photo_group = request.form.get("photo")

    if not group_name or not photo_group:
        flash("Datos incompletos")
        return redirect("/")

    # 🔍 Verificar si el grupo ya existe
    existing_group = db.execute(
        text('SELECT id_group FROM public."group" WHERE name = :name'),
        {"name": group_name}
    ).mappings().fetchone()

    if existing_group:
        flash("El grupo ya existe")
        return redirect("/")

    # ✅ Crear grupo
    db.execute(
        text('INSERT INTO public."group" (name, photo) VALUES (:name, :photo)'),
        {"name": group_name, "photo": photo_group}
    )
    db.commit()

    # Obtener id del grupo creado
    group = db.execute(
        text('SELECT id_group FROM public."group" WHERE name = :name'),
        {"name": group_name}
    ).mappings().fetchone()

    # Asociar usuario al grupo
    db.execute(
        text("INSERT INTO public.user_group (id_user, id_group) VALUES (:user, :group)"),
        {"user": session["id_user"], "group": group["id_group"]}
    )
    db.commit()

    flash("Grupo creado correctamente")
    return redirect("/")



@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")

        if not username or not password:
            flash("Datos incompletos")
            return redirect("/login")

        user = db.execute(
            text("SELECT * FROM public.users WHERE username = :username"),
            {"username": username}
        ).mappings().fetchone()

        if not user or not check_password_hash(user["password"], password):
            flash("Credenciales incorrectas")
            return redirect("/login")


        session["id_user"] = user["id_user"]
        return redirect("/")

    return render_template("login.html")


@app.route("/logout")
def logout():
    session.clear()
    return redirect("/login")


@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        fullname = request.form.get("fullname")
        email = request.form.get("email")
        sex = request.form.get("sex")
        image = request.form.get("image")

        if not all([username, password, fullname, email, sex, image]):
            flash("Complete todos los campos")
            return redirect("/register")

        db.execute(
            text("""
                INSERT INTO public.users
                (username, password, fullname, email, sex, image)
                VALUES (:username, :password, :fullname, :email, :sex, :image)
            """),
            {
                "username": username,
                "password": generate_password_hash(password),
                "fullname": fullname,
                "email": email,
                "sex": sex,
                "image": image
            }
        )
        db.commit()

        return redirect("/login")

    return render_template("register.html")


# =========================
# MAIN
# =========================
if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=8080, debug=True)
