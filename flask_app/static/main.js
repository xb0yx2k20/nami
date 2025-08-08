// --- Choices.js для мультивыбора ---
let topicsChoices, weatherChoices;
let selectedTopics = new Set();
let allTopics = [];
let topicsGroups = {};

// --- Переменные для карты ---
let map, drawnItems, drawControl, heatLayer;

window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM загружен, начинаем инициализацию...');
    // Инициализация Choices.js с улучшенными настройками для темной темы
    const choicesConfig = {
        removeItemButton: true,
        shouldSort: false,
        placeholder: true,
        placeholderValue: 'Выберите...',
        searchEnabled: true,
        searchPlaceholderValue: 'Поиск...',
        itemSelectText: '',
        noResultsText: 'Ничего не найдено',
        noChoicesText: 'Нет доступных опций',
        classNames: {
            containerOuter: 'choices',
            containerInner: 'choices__inner',
            input: 'choices__input',
            inputCloned: 'choices__input--cloned',
            list: 'choices__list',
            listItems: 'choices__list--multiple',
            listSingle: 'choices__list--single',
            listDropdown: 'choices__list--dropdown',
            item: 'choices__item',
            placeholder: 'choices__placeholder',
            group: 'choices__group',
            groupHeading: 'choices__heading',
            button: 'choices__button',
            activeState: 'is-active',
            focusState: 'is-focused',
            openState: 'is-open',
            disabledState: 'is-disabled',
            flippedState: 'is-flipped',
            loadingState: 'is-loading',
            noResults: 'has-no-results',
            noChoices: 'has-no-choices'
        }
    };
    
    try {
        topicsChoices = new Choices('#topics-select', choicesConfig);
        weatherChoices = new Choices('#weather-select', choicesConfig);
        console.log('Choices.js инициализированы успешно');
    } catch (error) {
        console.error('Ошибка инициализации Choices.js:', error);
        topicsChoices = null;
        weatherChoices = null;
    }
    
    loadTopics();
    loadWeather();
    
    // Инициализация улучшенного меню топиков
    initializeTopicsMenu();
    
    // Инициализация разворачиваемой инструкции
    initializeInstructionDropdown();
    document.querySelectorAll('input[name="area"]').forEach(r => r.addEventListener('change', function() {
        const mapSection = document.querySelector('.map-section');
        if (mapSection) {
            mapSection.style.display = this.value === 'Область на карте' ? 'flex' : 'none';
        }
    }));
    document.querySelectorAll('input[name="date_mode"]').forEach(r => r.addEventListener('change', function() {
        const dateSection = document.getElementById('date-section');
        if (dateSection) {
            dateSection.style.display = this.value === 'range' ? 'flex' : 'none';
        }
    }));
    document.querySelectorAll('input[name="time_mode"]').forEach(r => r.addEventListener('change', function() {
        const timeSection = document.getElementById('time-section');
        const sunSection = document.getElementById('sun-section');
        if (timeSection) {
            timeSection.style.display = this.value === 'hours' ? 'flex' : 'none';
        }
        if (sunSection) {
            sunSection.style.display = this.value === 'sun' ? 'flex' : 'none';
        }
    }));
    document.querySelectorAll('input[name="weather_mode"]').forEach(r => r.addEventListener('change', function() {
        const weatherSection = document.getElementById('weather-section');
        if (weatherSection) {
            weatherSection.style.display = this.value === 'select' ? 'flex' : 'none';
        }
    }));
    // Sun slider
    const sunStart = document.getElementById('sun-start');
    const sunEnd = document.getElementById('sun-end');
    const sunStartVal = document.getElementById('sun-start-val');
    const sunEndVal = document.getElementById('sun-end-val');
    if (sunStart && sunEnd && sunStartVal && sunEndVal) {
        sunStart.addEventListener('input', () => { sunStartVal.textContent = sunStart.value; });
        sunEnd.addEventListener('input', () => { sunEndVal.textContent = sunEnd.value; });
    }
    // --- Leaflet карта и полигоны ---
    if (document.getElementById('leaflet-map')) {
        map = L.map('leaflet-map').setView([55.8, 37.6], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);
        drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);
        // Добавляем инструменты рисования (только полигоны)
        if (window.L && window.L.Control && window.L.Control.Draw) {
            drawControl = new L.Control.Draw({
                draw: {
                    polygon: true,
                    polyline: false,
                    rectangle: false,
                    circle: false,
                    marker: false,
                    circlemarker: false
                },
                edit: {
                    featureGroup: drawnItems,
                    remove: true
                }
            });
            map.addControl(drawControl);
            map.on(L.Draw.Event.CREATED, function (e) {
                drawnItems.clearLayers();
                drawnItems.addLayer(e.layer);
            });
            map.on(L.Draw.Event.DELETED, function () {
                drawnItems.clearLayers();
            });
        }
    } else {
        // Инициализируем пустые значения, если карта не нужна
        map = null;
        drawnItems = null;
        drawControl = null;
        heatLayer = null;
    }
    // --- Тепловая карта ---
    const heatmapToggle = document.getElementById('heatmap-toggle');
    if (heatmapToggle && map) {
        heatmapToggle.addEventListener('change', function() {
            if (this.checked) {
                // Более реалистичные точки для тепловой карты маршрутов
                const points = [
                    [55.845, 37.526, 0.8],  // Центральная точка НАМИ
                    [55.846, 37.528, 0.9],  // Высокая концентрация
                    [55.844, 37.523, 0.7],  // Средняя концентрация
                    [55.847, 37.530, 0.6],  // Северо-восток
                    [55.843, 37.520, 0.5],  // Юго-запад
                    [55.848, 37.525, 0.4],  // Север
                    [55.842, 37.525, 0.3],  // Юг
                    [55.845, 37.532, 0.8],  // Восток
                    [55.845, 37.520, 0.6],  // Запад
                    [55.849, 37.528, 0.2],  // Дальний северо-восток
                    [55.841, 37.522, 0.3]   // Дальний юго-запад
                ];
                heatLayer = L.heatLayer(points, {
                    radius: 30,
                    blur: 15,
                    maxZoom: 18,
                    gradient: {
                        0.2: '#0000ff',
                        0.4: '#00ffff',
                        0.6: '#00ff00',
                        0.8: '#ffff00',
                        1.0: '#ff0000'
                    }
                }).addTo(map);
                drawnItems.clearLayers();
            } else {
                if (heatLayer) { 
                    map.removeLayer(heatLayer); 
                    heatLayer = null;
                }
            }
        });
    }
    // --- Показ/скрытие карты ---
    document.querySelectorAll('input[name="area"]').forEach(r => r.addEventListener('change', function() {
        const mapSection = document.querySelector('.map-section');
        if (mapSection) {
            mapSection.style.display = this.value === 'Область на карте' ? 'flex' : 'none';
        }
        if (map) { map.invalidateSize(); }
    }));
});

function initializeTopicsMenu() {
    // Поиск топиков
    const searchInput = document.getElementById('topics-search');
    if (searchInput) {
        searchInput.addEventListener('input', filterTopics);
    }
    
    // Быстрые кнопки
    setupQuickButtons();
}

function setupQuickButtons() {
    const quickButtonsContainer = document.getElementById('quick-topics-buttons');
    if (!quickButtonsContainer) return;
    
    const quickTopics = [
        { name: 'Все камеры', topics: ['/sensing/camera/LF', '/sensing/camera/CF', '/sensing/camera/RF'] },
        { name: 'Все радары', topics: ['/radar_fl/can_radar_clusters', '/radar_fr/can_radar_clusters'] },
        { name: 'Диагностика', topics: ['/diagnostics'] },
        { name: 'TF', topics: ['/tf_static'] }
    ];
    
    quickTopics.forEach(quick => {
        const btn = document.createElement('button');
        btn.className = 'quick-btn';
        btn.textContent = quick.name;
        btn.dataset.topics = JSON.stringify(quick.topics);
        btn.addEventListener('click', () => toggleQuickSelection(btn, quick.topics));
        quickButtonsContainer.appendChild(btn);
    });
}

function toggleQuickSelection(button, topics) {
    const isSelected = button.classList.contains('selected');
    
    if (isSelected) {
        // Убираем все топики из группы
        topics.forEach(topic => {
            selectedTopics.delete(topic);
        });
        button.classList.remove('selected');
    } else {
        // Добавляем все топики из группы
        topics.forEach(topic => {
            selectedTopics.add(topic);
        });
        button.classList.add('selected');
    }
    
    updateTopicsDisplay();
    updateHiddenSelect();
}

function filterTopics() {
    const searchTerm = document.getElementById('topics-search').value.toLowerCase();
    const topicItems = document.querySelectorAll('.topic-item');
    
    topicItems.forEach(item => {
        const topicName = item.querySelector('.topic-name').textContent.toLowerCase();
        const topicDesc = item.querySelector('.topic-description')?.textContent.toLowerCase() || '';
        
        if (topicName.includes(searchTerm) || topicDesc.includes(searchTerm)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
    
    // Показываем/скрываем группы в зависимости от результатов поиска
    const groups = document.querySelectorAll('.topic-group');
    groups.forEach(group => {
        const visibleItems = group.querySelectorAll('.topic-item[style*="flex"]').length;
        group.style.display = visibleItems > 0 ? 'block' : 'none';
    });
}

function updateTopicsDisplay() {
    const topicItems = document.querySelectorAll('.topic-item');
    topicItems.forEach(item => {
        const topicName = item.querySelector('.topic-name').textContent;
        if (selectedTopics.has(topicName)) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });
}

function updateHiddenSelect() {
    // Обновляем скрытый select для совместимости с формой
    const hiddenSelect = document.getElementById('topics-select');
    hiddenSelect.innerHTML = '';
    selectedTopics.forEach(topic => {
        const option = document.createElement('option');
        option.value = topic;
        option.selected = true;
        hiddenSelect.appendChild(option);
    });
}

function loadTopics() {
    fetch('/get_topics')
        .then(r => r.json())
        .then(data => {
            allTopics = data.data || [];
            topicsChoices.clearStore();
            topicsChoices.setChoices(allTopics.map(val => ({ value: val, label: val })), 'value', 'label', true);
            
            // Создаем группы топиков
            createTopicsGroups(allTopics);
        });
}

function createTopicsGroups(topics) {
    // Определяем группы топиков
    const groups = {
        'Камеры': {
            icon: '📷',
            topics: topics.filter(t => t.includes('camera')),
            description: 'Данные с камер'
        },
        'Радары': {
            icon: '📡',
            topics: topics.filter(t => t.includes('radar')),
            description: 'Данные с радаров'
        },
        'TF': {
            icon: '🗺️',
            topics: topics.filter(t => t.includes('tf')),
            description: 'Трансформации координат'
        },
        'Диагностика': {
            icon: '🔧',
            topics: topics.filter(t => t.includes('diagnostic')),
            description: 'Диагностическая информация'
        },
        'Статус': {
            icon: '📊',
            topics: topics.filter(t => t.includes('status') || t.includes('vehicle')),
            description: 'Статус системы'
        },
        'Прочее': {
            icon: '📋',
            topics: topics.filter(t => !t.includes('camera') && !t.includes('radar') && !t.includes('tf') && !t.includes('diagnostic') && !t.includes('status') && !t.includes('vehicle')),
            description: 'Другие топики'
        }
    };
    
    topicsGroups = groups;
    renderTopicsGroups();
}

function renderTopicsGroups() {
    const container = document.getElementById('topics-groups');
    if (!container) return;
    
    container.innerHTML = '';
    
    Object.entries(topicsGroups).forEach(([groupName, groupData]) => {
        if (groupData.topics.length === 0) return;
        
        const groupDiv = document.createElement('div');
        groupDiv.className = 'topic-group';
        
        const header = document.createElement('div');
        header.className = 'group-header';
        header.innerHTML = `
            <span>
                <span class="group-icon">${groupData.icon}</span>
                ${groupName} (${groupData.topics.length})
            </span>
            <span class="group-toggle">▼</span>
        `;
        
        const content = document.createElement('div');
        content.className = 'group-content';
        
        groupData.topics.forEach(topic => {
            const topicItem = document.createElement('div');
            topicItem.className = 'topic-item';
            topicItem.innerHTML = `
                <div class="topic-checkbox"></div>
                <div class="topic-info">
                    <div class="topic-name">${topic}</div>
                    <div class="topic-description">${getTopicDescription(topic)}</div>
                </div>
                <div class="topic-count">0</div>
            `;
            
            topicItem.addEventListener('click', () => toggleTopicSelection(topic, topicItem));
            content.appendChild(topicItem);
        });
        
        // Сворачивание/разворачивание группы
        header.addEventListener('click', () => {
            header.classList.toggle('collapsed');
            content.style.display = header.classList.contains('collapsed') ? 'none' : 'block';
        });
        
        groupDiv.appendChild(header);
        groupDiv.appendChild(content);
        container.appendChild(groupDiv);
    });
    
    updateTopicsDisplay();
}

function getTopicDescription(topic) {
    const descriptions = {
        '/sensing/camera/LF': 'Левая передняя камера',
        '/sensing/camera/CF': 'Центральная передняя камера',
        '/sensing/camera/RF': 'Правая передняя камера',
        '/radar_fl/can_radar_clusters': 'Левый передний радар',
        '/radar_fr/can_radar_clusters': 'Правый передний радар',
        '/tf_static': 'Статические трансформации координат',
        '/diagnostics': 'Диагностическая информация системы',
        '/vehicle/status/twist': 'Статус движения транспортного средства'
    };
    
    return descriptions[topic] || 'Данные топика';
}

function toggleTopicSelection(topic, element) {
    if (selectedTopics.has(topic)) {
        selectedTopics.delete(topic);
        element.classList.remove('selected');
    } else {
        selectedTopics.add(topic);
        element.classList.add('selected');
    }
    
    updateHiddenSelect();
}

function loadWeather() {
    fetch('/get_weather_keys')
        .then(r => r.json())
        .then(data => {
            weatherChoices.clearStore();
            weatherChoices.setChoices((data.data || []).map(val => ({ value: val, label: val })), 'value', 'label', true);
        });
}

function initializeInstructionDropdown() {
    const instructionHeader = document.querySelector('.instruction-header');
    const instructionContent = document.querySelector('.instruction-content');
    const instructionToggle = document.querySelector('.instruction-toggle');
    
    if (instructionHeader && instructionContent && instructionToggle) {
        instructionHeader.addEventListener('click', () => {
            const isVisible = instructionContent.style.display !== 'none';
            instructionContent.style.display = isVisible ? 'none' : 'block';
            instructionToggle.style.transform = isVisible ? 'rotate(0deg)' : 'rotate(180deg)';
        });
    }
}

// --- Отправка формы и вывод результатов ---
const searchForm = document.getElementById('search-form');
if (searchForm) {
    console.log('Форма поиска найдена, добавляем обработчик...');
    searchForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const form = e.target;
    
    // Получаем полигоны с карты
    let mapPolygons = [];
    if (drawnItems && drawnItems.getLayers && drawnItems.getLayers().length > 0) {
        drawnItems.getLayers().forEach(layer => {
            if (layer.toGeoJSON) {
                mapPolygons.push(layer.toGeoJSON());
            }
        });
    }
    
    const filters = {
        area: form.area.value,
        map_polygons: mapPolygons,
        selected_topics: topicsChoices ? topicsChoices.getValue(true) : [],
        date_start: '',
        date_end: '',
        time_slider: [0, 23],
        sun_slider: [0, 10],
        weather_types: []
    };
    
    // Даты
    if (form.date_mode.value === 'range') {
        filters.date_start = form['date_start']?.value || '';
        filters.date_end = form['date_end']?.value || '';
    }
    
    // Время
    if (form.time_mode.value === 'hours') {
        filters.time_slider = [parseInt(form['time_start']?.value || 0), parseInt(form['time_end']?.value || 23)];
    }
    if (form.time_mode.value === 'sun') {
        filters.sun_slider = [parseFloat(form['sun_start']?.value || 0), parseFloat(form['sun_end']?.value || 10)];
    }
    
    // Погода
    if (form.weather_mode.value === 'select') {
        filters.weather_types = weatherChoices ? weatherChoices.getValue(true) : [];
    }
    
    console.log('Отправляем фильтры:', filters);
    
    fetch('/search_logs', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({filters})
    })
    .then(r => r.json())
    .then(data => {
        console.log('Получены данные от API:', data);
        renderResults(data.data || []);
    })
    .catch(error => {
        console.error('Ошибка при поиске логов:', error);
    });
    });
} else {
    console.error('Форма поиска не найдена!');
}

function renderResults(rows) {
    console.log('renderResults вызвана с данными:', rows);
    const summary = document.getElementById('logs-summary');
    const table = document.getElementById('logs-table');
    
    if (!table) {
        console.error('Таблица logs-table не найдена!');
        return;
    }
    
    const tbody = table.querySelector('tbody');
    if (!tbody) {
        console.error('Тело таблицы tbody не найдено!');
        return;
    }
    if (!rows.length) {
        summary.textContent = 'Ничего не найдено';
        table.style.display = 'none';
        return;
    }
    summary.textContent = `Найдено ${rows.length} логов:`;
    table.style.display = '';
    tbody.innerHTML = '';
    rows.forEach((row, idx) => {
        // row: [path, map_link, size, date, time]
        const hasRoute = !!row[1];
        const hasGif = row[2] > 1; // если размер > 1GB, считаем что есть GIF
        const previewUrl = hasGif ? '/static/preview.gif' : '';
        const tr = document.createElement('tr');
        tr.className = 'log-row';
        tr.dataset.path = row[0];
        tr.innerHTML = `
            <td>${hasGif ? `<img src='${previewUrl}' alt='preview' style='width:60px;height:40px;border-radius:6px;'>` : ''}</td>
            <td><input type='checkbox' class='log-checkbox' data-idx='${idx}'> ${row[0]}</td>
            <td>${hasRoute ? '✔️' : '—'}</td>
            <td>${hasGif ? '✔️' : '—'}</td>
            <td>${row[2]}</td>
            <td>${row[3]}</td>
            <td>${row[4]}</td>
        `;
        tbody.appendChild(tr);
    });
    document.querySelectorAll('.log-row').forEach(row => {
        row.addEventListener('click', function(e) {
            if (e.target.classList.contains('log-checkbox')) return;
            showLogModal(this.dataset.path);
        });
    });
}

// --- Модальное окно ---
function showLogModal(logPath) {
    fetch('/get_specified_log', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({log: logPath})
    })
    .then(r => r.json())
    .then(data => {
        const log = data.data[logPath];
        let html = `<h2>Информация о логе</h2>`;
        html += `<div><b>Путь к логу:</b> ${logPath}</div>`;
        html += `<div style='margin:10px 0;'><b>Маршрут испытания:</b><br>`;
        if (log.map_link) {
            // Простая карта с маркерами маршрута
            html += `<div id="route-map" style="width: 100%; height: 200px; border-radius: 10px; border: 1px solid #393c41;"></div>`;
        } else {
            html += 'Нет маршрута';
        }
        html += `</div>`;
        html += `<div><b>Дата и время испытания:</b> ${log.date}</div>`;
        html += `<div><b>Длительность испытания (сек):</b> ${log.duration_in_seconds}</div>`;
        html += `<div><b>Погода:</b> Облачно с прояснениями</div>`;
        html += `<div><b>Размер лога (GB):</b> ${log.size}</div>`;
        html += `<div style='margin:10px 0;'><b>Список топиков:</b><ul>`;
        (log.topics || []).forEach(t => {
            html += `<li>${t.name} (${t.type}), сообщений: ${t.message_count}</li>`;
        });
        html += `</ul></div>`;
        
        // GIF превью для каждого топика
        html += `<div style='margin:10px 0;'><b>GIF превью:</b></div>`;
        html += `<div id="gif-previews" style='display: flex; flex-wrap: wrap; gap: 10px;'>`;
        html += `<div style='color: #72767d; font-style: italic;'>Загрузка превью...</div>`;
        html += `</div>`;
        
        document.getElementById('modal-body').innerHTML = html;
        document.getElementById('modal').style.display = '';
        
        // Инициализируем простую карту маршрута
        if (log.map_link) {
            initializeRouteMap();
        }
        
        // Загружаем GIF превью для каждого топика
        loadGifPreviews(logPath, log.topics || []);
    });
}

function initializeRouteMap() {
    const mapContainer = document.getElementById('route-map');
    if (!mapContainer) return;
    
    // Создаем простую карту с маркерами маршрута
    const routeMap = L.map('route-map').setView([55.845204, 37.526332], 15);
    
    // Используем простую тайловую карту без избыточного интерфейса
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '',
        maxZoom: 18
    }).addTo(routeMap);
    
    // Добавляем маркеры маршрута
    const routePoints = [
        [55.845204, 37.526332, 'Начало маршрута'],
        [55.846, 37.528, 'Точка 1'],
        [55.844, 37.523, 'Точка 2'],
        [55.847, 37.530, 'Точка 3'],
        [55.843, 37.520, 'Конец маршрута']
    ];
    
    routePoints.forEach((point, index) => {
        const marker = L.marker([point[0], point[1]]).addTo(routeMap);
        marker.bindPopup(`<b>${point[2]}</b><br>Координаты: ${point[0]}, ${point[1]}`);
        
        // Соединяем точки линией
        if (index > 0) {
            const prevPoint = routePoints[index - 1];
            L.polyline([[prevPoint[0], prevPoint[1]], [point[0], point[1]]], {
                color: '#ff4d4f',
                weight: 3,
                opacity: 0.8
            }).addTo(routeMap);
        }
    });
}

function loadGifPreviews(logPath, topics) {
    const previewsContainer = document.getElementById('gif-previews');
    if (!previewsContainer || topics.length === 0) return;
    
    previewsContainer.innerHTML = '';
    
    topics.forEach(topic => {
        fetch('/get_gif_preview', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                log: logPath,
                topic: topic.name
            })
        })
        .then(r => r.json())
        .then(data => {
            const previewDiv = document.createElement('div');
            previewDiv.style.cssText = 'border: 1px solid #393c41; border-radius: 8px; padding: 10px; background: #1e2124;';
            previewDiv.innerHTML = `
                <div style='font-size: 12px; color: #b0b3b8; margin-bottom: 8px;'>${topic.name}</div>
                <img src='${data.data.gif_url}' alt='preview' style='width: 200px; height: 150px; border-radius: 6px; object-fit: cover;'>
            `;
            previewsContainer.appendChild(previewDiv);
        })
        .catch(error => {
            console.error('Ошибка загрузки GIF превью:', error);
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = 'border: 1px solid #ff4d4f; border-radius: 8px; padding: 10px; background: #1e2124; color: #ff4d4f;';
            errorDiv.innerHTML = `
                <div style='font-size: 12px; margin-bottom: 8px;'>${topic.name}</div>
                <div style='font-size: 11px;'>Ошибка загрузки превью</div>
            `;
            previewsContainer.appendChild(errorDiv);
        });
    });
}
document.getElementById('modal-close').onclick = function() {
    document.getElementById('modal').style.display = 'none';
};
window.onclick = function(event) {
    if (event.target == document.getElementById('modal')) {
        document.getElementById('modal').style.display = 'none';
    }
}; 