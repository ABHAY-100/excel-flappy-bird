from flask import Flask, render_template
from flaskwebgui import FlaskUI

app = Flask(__name__, static_url_path="/", static_folder="frontend", template_folder="frontend")


@app.route('/')
def home():
    return render_template("index.html")

@app.route('/leaderboard')
def leaderboard():
    return render_template("leaderboard/index.html")

if __name__ == '__main__':
    FlaskUI(app=app, width=1024, height=768, server="flask").run()