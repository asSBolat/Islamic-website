// Ждем, пока загрузятся все стили и элементы на странице
window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    
    // Делаем небольшую задержку (например, 1 секунду) просто для красоты, 
    // чтобы пользователь точно успел увидеть красивую анимацию луны
    setTimeout(() => {
        preloader.style.opacity = '0'; // Плавно делаем прозрачным
        
        // Когда он станет прозрачным, полностью удаляем его, чтобы можно было кликать по кнопкам
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 500); 
    }, 1000); 
});
// Переменная для хранения таймера обратного отсчета
let countdownInterval = null;

// ==========================================
// 1. ИНИЦИАЛИЗАЦИЯ И ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const menuButtons = document.querySelectorAll('.menu-btn');
    const sections = document.querySelectorAll('.content-section');

    menuButtons.forEach(button => {
        button.addEventListener('click', () => {
            menuButtons.forEach(btn => btn.classList.remove('active'));
            sections.forEach(sec => sec.classList.remove('active'));

            button.classList.add('active');

            const targetSectionId = button.getAttribute('data-target');
            const targetSection = document.getElementById(targetSectionId);
            if (targetSection) {
                targetSection.classList.add('active');
            }
        });
    });

    // ==========================================
    // 2. ИСПРАВЛЕННАЯ ЛОГИКА ДЛЯ СЧЕТЧИКА ЗИКРОВ
    // ==========================================
    const dhikrItems = document.querySelectorAll('.dhikr-item');
    const listScreen = document.getElementById('dhikr-list-screen');
    const counterScreen = document.getElementById('dhikr-counter-screen');
    const activeName = document.getElementById('active-dhikr-name');
    
    // ИЩЕМ ПО ID ИЗ ТВОЕГО HTML (через getElementById или #)
    const counterDisplay = document.getElementById('counter-view'); 
    const clickArea = document.getElementById('click-button');      
    const backBtn = document.getElementById('back-to-list');        
    const resetBtn = document.getElementById('reset-button');       

    let currentDhikrId = null;

    // Загружаем сохраненные счетчики из памяти телефона при старте
    dhikrItems.forEach(item => {
        const id = item.getAttribute('data-id');
        const savedCount = localStorage.getItem(`dhikr_count_${id}`) || 0;
        
        const badge = document.getElementById(`badge-${id}`);
        if (badge) badge.innerText = savedCount;
    });

    // Открытие экрана счетчика конкретного зикра
    dhikrItems.forEach(item => {
        item.addEventListener('click', () => {
            currentDhikrIndex = allDhikrItems.indexOf(item); 
            currentDhikrId = item.getAttribute('data-id');
            const name = item.querySelector('.dhikr-name').innerText;
            
            activeName.innerText = name;
            const currentCount = localStorage.getItem(`dhikr_count_${currentDhikrId}`) || 0;
            counterDisplay.innerText = currentCount;

            // Переключаем экраны внутри секции зикров
            if (listScreen) listScreen.classList.add('hidden');
            if (counterScreen) counterScreen.classList.remove('hidden');
        });
    });

    // Клик по кнопке "Нажмите, чтобы считать" (+1)
    if (clickArea) {
        clickArea.addEventListener('click', (e) => {
            e.stopPropagation(); // Чтобы клик не дублировался
            if (!currentDhikrId) return;
            
            let count = parseInt(counterDisplay.innerText) + 1;
            counterDisplay.innerText = count;

            // Сохраняем в память телефона
            localStorage.setItem(`dhikr_count_${currentDhikrId}`, count);

            // Обновляем циферку в списке
            const badge = document.getElementById(`badge-${currentDhikrId}`);
            if (badge) badge.innerText = count;
        });
    }

    // Кнопка Сбросить этот счетчик
    if (resetBtn) {
        resetBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!currentDhikrId) return;
            if (confirm("Обнулить этот счетчик?")) {
                counterDisplay.innerText = 0;
                localStorage.setItem(`dhikr_count_${currentDhikrId}`, 0);
                const badge = document.getElementById(`badge-${currentDhikrId}`);
                if (badge) badge.innerText = 0;
            }
        });
    }

    // Кнопка Назад к списку
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (counterScreen) counterScreen.classList.add('hidden');
            if (listScreen) listScreen.classList.remove('hidden');
            currentDhikrId = null;
        });
    }

    // Слушатель смены городов
    const cityElement = document.getElementById('city-select');
    if (cityElement) {
        cityElement.addEventListener('change', getPrayerTimes);
    }
    
    // Запуск загрузки времени при старте приложения
    getPrayerTimes();
});

// ==========================================
// 3. ПОЛУЧЕНИЕ ВРЕМЕНИ НАМАЗА ИЗ ИНТЕРНЕТА
// ==========================================
async function getPrayerTimes() {
    const cityElement = document.getElementById('city-select');
    const selectedCity = cityElement ? cityElement.value : "Lenger";

    try {
        const response = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${selectedCity}&country=Kazakhstan&method=3&school=1`);
        const result = await response.json();
        
        if (result.code === 200) {
            let times = result.data.timings;

            function adjustMinutes(timeStr, minutesOffset) {
                if (!timeStr) return "00:00";
                const [h, m] = timeStr.split(':').map(Number);
                const date = new Date();
                date.setHours(h, m + minutesOffset, 0, 0);
                return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
            }

            let exactTimes = {
                Fajr: times.Fajr,
                Dhuhr: times.Dhuhr,
                Asr: times.Asr,
                Maghrib: times.Maghrib,
                Isha: times.Isha
            };

            // ЮВЕЛИРНАЯ НАСТРОЙКА ТОЛЬКО ДЛЯ ЛЕНГЕРА
            if (selectedCity === "Lenger") {
                exactTimes.Fajr = adjustMinutes(times.Fajr, 29);       // По умолчанию (2:59)
                exactTimes.Dhuhr = adjustMinutes(times.Dhuhr, 3);     // Сдвиг на 12:24
                exactTimes.Asr = adjustMinutes(times.Asr, 3);         // Авто-Ханафи от сервера
                exactTimes.Maghrib = adjustMinutes(times.Maghrib, 3); // Сдвиг на 20:02
                exactTimes.Isha = adjustMinutes(times.Isha, -19);
            }
            // Для Шымкента и Алматы время идет чистое с сервера по Ханафи мазхабу
            else if (selectedCity === "Shymkent") {
                // Если понадобится подкрутить Шымкент, пиши настройки сюда
            }
            else if (selectedCity === "Almaty") {
                // Если понадобится подкрутить Алматы, пиши настройки сюда
            }

            // Выводим чистое время в таблицу
            startCountdown(exactTimes);
        }
    } catch (error) {
        console.log("Ошибка интернета, ставим резерв");
        const backupTimes = { Fajr: "02:59", Dhuhr: "12:24", Asr: "17:41", Maghrib: "20:02", Isha: "22:10" };
        startCountdown(backupTimes);
    }
}

// ==========================================
// 4. ТАЙМЕР И АВТО-ОПРЕДЕЛЕНИЕ ТЕКУЩЕГО НАМАЗА
// ==========================================
function startCountdown(todayPrayers) {
    if (countdownInterval) clearInterval(countdownInterval);

    function updateTimer() {
        const now = new Date();
        const prayers = [
            { id: 1, name: "Фаджр", time: todayPrayers.Fajr },
            { id: 2, name: "Зухр", time: todayPrayers.Dhuhr },
            { id: 3, name: "Аср", time: todayPrayers.Asr },
            { id: 4, name: "Магриб", time: todayPrayers.Maghrib },
            { id: 5, name: "Иша", time: todayPrayers.Isha }
        ];

        let nextPrayer = null;
        let minDiff = Infinity;
        let currentPrayerIndex = -1;

        // Превращаем строки в реальные даты для сравнения
        const prayerDates = prayers.map(p => {
            const [hours, minutes] = p.time.split(':').map(Number);
            const d = new Date(now);
            d.setHours(hours, minutes, 0, 0);
            return d;
        });

        // 1. ОПРЕДЕЛЯЕМ, КАКОЙ НАМАЗ ИДЕТ СЕЙЧАС
        if (now >= prayerDates[0] && now < prayerDates[1]) currentPrayerIndex = 0; // Идет Фаджр
        else if (now >= prayerDates[1] && now < prayerDates[2]) currentPrayerIndex = 1; // Идет Зухр
        else if (now >= prayerDates[2] && now < prayerDates[3]) currentPrayerIndex = 2; // Идет Аср
        else if (now >= prayerDates[3] && now < prayerDates[4]) currentPrayerIndex = 3; // Идет Магриб
        else currentPrayerIndex = 4; // Идет Иша (ночью до Фаджра следующего дня)

        // 2. ОБНОВЛЯЕМ НАЗВАНИЯ НА ЭКРАНЕ И ДОБАВЛЯЕМ "(Сейчас)"
        prayers.forEach((prayer, index) => {
            const rowElement = document.querySelector(`.prayer-row:nth-child(${prayer.id})`);
            if (rowElement) {
                const nameSpan = rowElement.querySelector('span:first-child');
                const timeSpan = rowElement.querySelector('span:last-child');
                
                // Выводим время
                timeSpan.innerText = prayer.time;
                
                // Если этот намаз текущий — добавляем маркер, иначе — просто чистое имя
                if (index === currentPrayerIndex) {
                    nameSpan.innerText = `${prayer.name} (Сейчас)`;
                    rowElement.classList.add('current-active-prayer'); // Можно стилизовать в CSS
                } else {
                    nameSpan.innerText = prayer.name;
                    rowElement.classList.remove('current-active-prayer');
                }
            }
        });

        // 3. ИЩЕМ СЛЕДУЮЩИЙ НАМАЗ ДЛЯ ТАЙМЕРА
        prayers.forEach((prayer, index) => {
            let diff = prayerDates[index] - now;
            // Если этот намаз на сегодня уже прошел, значит он будет завтра
            if (diff < 0) {
                const tomorrowDate = new Date(prayerDates[index]);
                tomorrowDate.setDate(tomorrowDate.getDate() + 1);
                diff = tomorrowDate - now;
            }

            if (diff < minDiff) {
                minDiff = diff;
                nextPrayer = prayer;
            }
        });

        // 4. СЧИТАЕМ И ВЫВОДИМ СЕКУНДЫ НА ЭКРАН
        const totalSeconds = Math.floor(minDiff / 1000);
        const hrs = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
        const mins = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
        const secs = String(totalSeconds % 60).padStart(2, '0');

        const countdownElement = document.querySelector('.countdown');
        if (countdownElement) {
            countdownElement.innerText = `До ${nextPrayer.name}а осталось: ${hrs}:${mins}:${secs}`;
        }
    }

    updateTimer();
    countdownInterval = setInterval(updateTimer, 1000);
}

// Переменные для хранения текущего зикра и его счета
let currentDhikrIndex = 0;
const allDhikrItems = Array.from(document.querySelectorAll('.dhikr-item'));
        function loadDhikrData(index) {
    const item = allDhikrItems[index];
    if (!item) return;

    // Вытаскиваем имя из класса .dhikr-name
    const name = item.querySelector('.dhikr-name').innerText;
    // Вытаскиваем описание из нового класса .dhikr-descr
    const descrElement = item.querySelector('.dhikr-descr'); 
    
    document.getElementById('active-dhikr-name').innerText = name;
    
    const fullTextCounter = document.getElementById('active-dhikr-full-text');
    if (descrElement) {
        fullTextCounter.innerText = descrElement.innerText;
        fullTextCounter.style.display = 'block';
    } else {
        fullTextCounter.style.display = 'none';
    }

    const currentCount = item.querySelector('.dhikr-badge').innerText;
    document.getElementById('counter-view').innerText = currentCount;
}


// ОБРАБОТЧИК КЛИКА ПО БОЛЬШОЙ КНОПКЕ (КЛИКЕРУ)
document.getElementById('click-area-btn').addEventListener('click', () => {
    const counterView = document.getElementById('counter-view');
    let count = parseInt(counterView.innerText) || 0;
    count++;
    counterView.innerText = count;

    // Сразу обновляем цифру в главном списке и в соответствующем бейдже
    const activeItem = allDhikrItems[currentDhikrIndex];
    if (activeItem) {
        activeItem.querySelector('.dhikr-badge').innerText = count;
    }
});

// ОБРАБОТЧИК КНОПКИ СБРОСА (↻)
document.getElementById('reset-btn').addEventListener('click', () => {
    document.getElementById('counter-view').innerText = '0';
    const activeItem = allDhikrItems[currentDhikrIndex];
    if (activeItem) {
        activeItem.querySelector('.dhikr-badge').innerText = '0';
    }
});

// Кнопка "Вперед"
document.getElementById('next-dhikr').addEventListener('click', () => {
    currentDhikrIndex = (currentDhikrIndex + 1) % allDhikrItems.length;
    loadDhikrData(currentDhikrIndex);
});

// Кнопка "Назад"
document.getElementById('prev-dhikr').addEventListener('click', () => {
    currentDhikrIndex = (currentDhikrIndex - 1 + allDhikrItems.length) % allDhikrItems.length;
    loadDhikrData(currentDhikrIndex);
});

// Возврат к списку
document.getElementById('back-to-list').addEventListener('click', () => {
    document.getElementById('dhikr-counter-screen').classList.add('hidden');
    document.getElementById('dhikr-list-screen').classList.remove('hidden');
});
