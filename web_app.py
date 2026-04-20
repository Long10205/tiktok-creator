import os
from flask import Flask, render_template, jsonify
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')

# 👉 Trang chính
@app.route('/')
def home():
    return render_template('index.html', google_api_key=GOOGLE_API_KEY)

# 👉 API đọc folder ảnh
@app.route('/images')
def get_images():
    folder = os.path.join(app.static_folder, 'images')

    files = os.listdir(folder)

    images = [
        f'/static/images/{file}'
        for file in files
        if file.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))
    ]

    return jsonify(images)

if __name__ == '__main__':
    app.run(debug=True)