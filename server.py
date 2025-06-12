from gevent import monkey
monkey.patch_all()
from backend import backend_bp
from frontend import frontend_bp
from models import db
from flask import Flask
import os

app = Flask(__name__, static_folder="static", static_url_path="/static")

# Database setup
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("PROJ_DATABASE_URI")
db.init_app(app)

# Registering blueprints
app.register_blueprint(backend_bp)
app.register_blueprint(frontend_bp)

