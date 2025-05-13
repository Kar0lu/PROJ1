from gevent import monkey
monkey.patch_all()
from backend import backend_bp
from flask_cors import CORS
from frontend import frontend_bp
from models import db
from flask import Flask
import os

app = Flask(__name__, static_folder=None, static_url_path="/static")
CORS(app, origins="https://www.proj.top")

# Database setup
app.config["SQLALCHEMY_DATABASE_URI"] = f'postgresql://{os.getenv("POSTGRES_USER")}:{os.getenv("POSTGRES_PASSWORD")}@db:5432/{os.getenv("POSTGRES_DB")}'
db.init_app(app)

# Registering blueprints
app.register_blueprint(backend_bp)
app.register_blueprint(frontend_bp)

