from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# Главная страница с формой поиска
@app.route('/', methods=['GET', 'POST'])
def index():
    return render_template('index.html')

# Тестовая страница
@app.route('/test')
def test():
    return render_template('test.html')

# --- API-заглушки ---
@app.route('/get_weather_keys')
def get_weather_keys():
    return jsonify({
        'message': 'OK',
        'data': [
            'Ясное небо', 'В основном ясно', 'Переменная облачность', 'Пасмурно',
            'Дождь', 'Снег', 'Туман', 'Гроза', 'Облачно с прояснениями'
        ]
    })

@app.route('/get_topics')
def get_topics():
    return jsonify({
        'message': 'OK',
        'data': [
            '/tf_static', '/sensing/camera/LF', '/sensing/camera/CF', '/diagnostics',
            '/radar_fl/can_radar_clusters', '/vehicle/status/twist'
        ]
    })

@app.route('/get_topic_types')
def get_topic_types():
    return jsonify({
        'message': 'OK',
        'data': [
            'sensor_msgs/msg/Image', 'tf2_msgs/msg/TFMessage', 'diagnostic_msgs/msg/DiagnosticArray'
        ]
    })

@app.route('/search_logs', methods=['POST'])
def search_logs():
    # Получаем фильтры из запроса
    filters = request.json.get('filters', {})
    
    # Обрабатываем полигоны карты
    map_polygons = filters.get('map_polygons', [])
    area = filters.get('area', 'Не учитывать область')
    
    # Логируем полученные данные для отладки
    print(f"Получены фильтры: {filters}")
    print(f"Область: {area}")
    print(f"Полигоны: {map_polygons}")
    
    # Возвращаем статичный список логов
    return jsonify({
        'message': 'OK',
        'data': [
            [
                'smb://server/avd/ros_logs/foxy/city/2025-07-04_10_db3',
                'https://map.project-osrm.org/?z=15&center=55.845204%2C37.526332',
                2.44,
                '2025-07-04',
                '14:48:03'
            ],
            [
                'smb://server/avd/ros_logs/foxy/city/2025-07-04_9_db3',
                'https://map.project-osrm.org/?z=15&center=55.845204%2C37.526332',
                4.12,
                '2025-07-04',
                '14:47:29'
            ]
        ]
    })

@app.route('/get_specified_log', methods=['POST'])
def get_specified_log():
    log_path = request.json.get('log')
    return jsonify({
        'message': 'OK',
        'data': {
            log_path: {
                'date': '04/07/2025 14:40:34',
                'duration_in_seconds': 335.17,
                'map_link': 'https://map.project-osrm.org/?z=15&center=55.845204%2C37.526332',
                'size': 121.77,
                'topics': [
                    {'message_count': 25, 'name': '/tf_static', 'type': 'tf2_msgs/msg/TFMessage'},
                    {'message_count': 689, 'name': '/sensing/camera/LF', 'type': 'sensor_msgs/msg/Image'}
                ]
            }
        }
    })

@app.route('/get_gif_preview', methods=['POST'])
def get_gif_preview():
    """Получение GIF превью для конкретного лога по конкретному топику"""
    data = request.json
    log_path = data.get('log')
    topic = data.get('topic')
    
    # Возвращаем заглушку GIF превью
    return jsonify({
        'message': 'OK',
        'data': {
            'gif_url': '/static/preview.gif',
            'topic': topic,
            'log_path': log_path
        }
    })

if __name__ == '__main__':
    app.run(debug=True, port=5001)

