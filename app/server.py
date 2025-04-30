from backend import backend_bp
from frontend import frontend_bp
from models import db
from flask import Flask
import os

app = Flask(__name__, static_folder=None, static_url_path="/static")

# Database setup
app.config["SQLALCHEMY_DATABASE_URI"] = f'postgresql://{os.getenv("POSTGRES_USER")}:{os.getenv("POSTGRES_PASSWORD")}@db:5432/{os.getenv("POSTGRES_DB")}'
db.init_app(app)

# Registering blueprints
app.register_blueprint(backend_bp)
app.register_blueprint(frontend_bp)

# Schema creation
with app.app_context():
    db.create_all()
