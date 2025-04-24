import threading
import time
from backend import backend_bp
from models import db
from flask import Flask, render_template

app = Flask(__name__)

# Developer db setup
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///PROJ.db"
db.init_app(app)

# Schema creation
with app.app_context():
    db.create_all()

# Registering blueprint
app.register_blueprint(backend_bp)


# Adding routes
@app.route('/')
def index():
    return render_template('index.html')


if __name__ == '__main__':
    # Synchronization in another thread
    sync_thread = threading.Thread(target=periodic_sync, daemon=True)
    sync_thread.start()

    # Turn on server
    app.run(host='0.0.0.0', port=5000)