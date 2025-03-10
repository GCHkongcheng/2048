from flask import Flask, render_template, request, jsonify
import os

app = Flask(__name__)

USER_FILE = 'user.txt'
LEADERBOARD_FILE = 'leaderboard.txt'

def read_users():
    users = {}
    if os.path.exists(USER_FILE):
        with open(USER_FILE, 'r', encoding='utf-8') as file:
            for line in file:
                parts = line.strip().split(',')
                if len(parts) == 3:
                    name, scr, time = parts
                    users[name] = (int(scr), int(time))
    return users

def write_users(users):
    with open(USER_FILE, 'w', encoding='utf-8') as file:
        for name, (scr, time) in users.items():
            file.write(f'{name},{scr},{time}\n')

def read_leaderboard():
    leaderboard = []
    if os.path.exists(LEADERBOARD_FILE):
        with open(LEADERBOARD_FILE, 'r', encoding='utf-8') as file:
            for line in file:
                parts = line.strip().split(',')
                if len(parts) == 3:
                    name, scr, time = parts
                    leaderboard.append({'name': name, 'score': int(scr), 'time': int(time)})
    return leaderboard

def write_leaderboard(leaderboard):
    with open(LEADERBOARD_FILE, 'w', encoding='utf-8') as file:
        for entry in leaderboard:
            file.write(f"{entry['name']},{entry['score']},{entry['time']}\n")

@app.route('/')
def index():
    return render_template("index.html")

@app.route('/save_user', methods=['POST'])
def save_user():
    data = request.get_json()
    nickname = data['nickname']
    score = data['score']
    elapsed_time = data['elapsed_time']

    users = read_users()
    users[nickname] = (score, elapsed_time)
    write_users(users)

    leaderboard = read_leaderboard()
    updated = False

    for entry in leaderboard:
        if entry['name'] == nickname:
            if score > entry['score'] or (score == entry['score'] and elapsed_time < entry['time']):
                entry['score'] = score
                entry['time'] = elapsed_time
                updated = True
            break
    else:
        leaderboard.append({'name': nickname, 'score': score, 'time': elapsed_time})
        updated = True

    if updated:
        leaderboard.sort(key=lambda x: (-x['score'], x['time']))
        leaderboard = leaderboard[:10]
        write_leaderboard(leaderboard)

    return jsonify(success=True)

@app.route('/get_leaderboard', methods=['GET'])
def get_leaderboard():
    leaderboard = read_leaderboard()
    return jsonify(leaderboard)

@app.route('/save_username', methods=['POST'])
def save_username():
    data = request.get_json()
    old_username = data['old_username']
    new_username = data['new_username']

    users = read_users()
    if new_username in users:
        return jsonify(success=False, message="该昵称已存在")

    if old_username in users:
        users[new_username] = users.pop(old_username)
        write_users(users)

    leaderboard = read_leaderboard()
    for entry in leaderboard:
        if entry['name'] == old_username:
            entry['name'] = new_username
    write_leaderboard(leaderboard)

    return jsonify(success=True)

if __name__ == '__main__':
    app.run(host='10.152.131.206', debug=True, port=8080)