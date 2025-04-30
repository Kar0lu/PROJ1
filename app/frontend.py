from flask import Blueprint, render_template

frontend_bp = Blueprint('frontend', __name__)

# Adding routes
@frontend_bp.route('/')
def index():
    return render_template('index.html')