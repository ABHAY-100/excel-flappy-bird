from flask import Flask, render_template, jsonify, request
from flaskwebgui import FlaskUI
from sqlalchemy import create_engine, Column, Integer, String, Float, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import appdirs
import os

app = Flask(__name__, static_url_path="/", static_folder="frontend", template_folder="frontend")

DB_PATH = os.path.join(appdirs.user_data_dir("FlappyBird", "MyApp"), "scores.db")
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

engine = create_engine(f'sqlite:///{DB_PATH}')
Base = declarative_base()

class Score(Base):
    __tablename__ = 'scores'
    id = Column(Integer, primary_key=True)
    name = Column(String(50))
    class_name = Column(String(50))
    score = Column(Integer)

Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)

@app.route('/')
def home():
    return render_template("index.html")

@app.route('/leaderboard')
def leaderboard():
    return render_template("leaderboard/index.html")

@app.route('/api/scores', methods=['GET'])
def get_scores():
    session = Session()
    scores = session.query(Score).order_by(Score.score.desc()).all()
    session.close()
    return jsonify([{
        'name': score.name,
        'class_name': score.class_name,
        'score': score.score
    } for score in scores])

@app.route('/api/scores', methods=['POST'])
def save_score():
    session = Session()
    data = request.get_json()
    
    if not all([data.get('name'), data.get('class_name'), data.get('score') is not None]):
        session.close()
        return jsonify({'status': 'error', 'message': 'Missing required fields'}), 400
    
    if data.get('score') == 0:
        session.close()
        return jsonify({'status': 'error', 'message': 'Score is 0'}), 400

    try:
        # Begin transaction explicitly with proper text() wrapper
        session.execute(text('BEGIN EXCLUSIVE TRANSACTION'))
        
        existing_score = session.query(Score).filter_by(
            name=data.get('name'),
            class_name=data.get('class_name')
        ).first()
        
        if existing_score:
            if data.get('score') > existing_score.score:
                existing_score.score = data.get('score')
        else:
            new_score = Score(
                name=data.get('name'),
                class_name=data.get('class_name'),
                score=data.get('score')
            )
            session.add(new_score)
            
        session.commit()
        return jsonify({'status': 'success'}), 201
        
    except Exception as e:
        session.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500
    finally:
        session.close()

if __name__ == '__main__':
    FlaskUI(app=app, width=1024, height=768, server="flask").run()