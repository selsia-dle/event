import { db } from './firebase-config.js';
import { collection, addDoc, onSnapshot, query } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', main);

// --- 전역 변수 ---
let currentDate = new Date();
let selectedCategory = 'anime'; // 'anime' 또는 'game'
let selectedSeries = null;
let eventData = []; // Firestore에서 가져온 데이터를 저장할 배열

// --- 샘플 데이터 ---
// 모든 시리즈의 마스터 목록
const allSeries = [
    // Game
    { name: "FC 온라인", category: 'game' },
    { name: "GTA", category: 'game' },
    { name: "검은사막", category: 'game' },
    { name: "나이트 크로우", category: 'game' },
    { name: "던전앤파이터", category: 'game' },
    { name: "데이브 더 다이버", category: 'game' },
    { name: "동물의 숲", category: 'game' },
    { name: "디아블로", category: 'game' },
    { name: "라그나로크 온라인", category: 'game' },
    { name: "레드 데드 리뎀션 2", category: 'game' },
    { name: "로스트아크", category: 'game' },
    { name: "로블록스", category: 'game' },
    { name: "리그 오브 레전드", category: 'game' },
    { name: "리니지", category: 'game' },
    { name: "마인크래프트", category: 'game' },
    { name: "메이플스토리", category: 'game' },
    { name: "발더스 게이트 3", category: 'game' },
    { name: "발로란트", category: 'game' },
    { name: "배틀그라운드", category: 'game' },
    { name: "붕괴: 스타레일", category: 'game' },
    { name: "사이버펑크 2077", category: 'game' },
    { name: "서든어택", category: 'game' },
    { name: "슈퍼 마리오", category: 'game' },
    { name: "스타크래프트", category: 'game' },
    { name: "스트리트 파이터", category: 'game' },
    { name: "에이펙스 레전드", category: 'game' },
    { name: "엘든 링", category: 'game' },
    { name: "오버워치", category: 'game' },
    { name: "월드 오브 워크래프트", category: 'game' },
    { name: "원신", category: 'game' },
    { name: "젤다의 전설", category: 'game' },
    { name: "철권", category: 'game' },
    { name: "콜 오브 듀티", category: 'game' },
    { name: "파이널 판타지", category: 'game' },
    { name: "포트나이트", category: 'game' },
    { name: "포켓몬스터", category: 'game' },
    { name: "하스스톤", category: 'game' },
    
    // Anime
    { name: "4월은 너의 거짓말", category: 'anime' },
    { name: "강철의 연금술사", category: 'anime' },
    { name: "귀멸의 칼날", category: 'anime' },
    { name: "나루토", category: 'anime' },
    { name: "나의 히어로 아카데미아", category: 'anime' },
    { name: "닥터 스톤", category: 'anime' },
    { name: "데스노트", category: 'anime' },
    { name: "드래곤볼", category: 'anime' },
    { name: "Re:제로부터 시작하는 이세계 생활", category: 'anime' },
    { name: "모브사이코 100", category: 'anime' },
    { name: "블랙 클로버", category: 'anime' },
    { name: "블리치", category: 'anime' },
    { name: "빈란드 사가", category: 'anime' },
    { name: "불꽃 소방대", category: 'anime' },
    { name: "소드 아트 온라인", category: 'anime' },
    { name: "슈타인즈 게이트", category: 'anime' },
    { name: "스파이 패밀리", category: 'anime' },
    { name: "신세기 에반게리온", category: 'anime' },
    { name: "심슨 가족", category: 'anime' },
    { name: "약속의 네버랜드", category: 'anime' },
    { name: "오버로드", category: 'anime' },
    { name: "원펀맨", category: 'anime' },
    { name: "원피스", category: 'anime' },
    { name: "은혼", category: 'anime' },
    { name: "전생했더니 슬라임이었던 건에 대하여", category: 'anime' },
    { name: "죠죠의 기묘한 모험", category: 'anime' },
    { name: "주술회전", category: 'anime' },
    { name: "진격의 거인", category: 'anime' },
    { name: "체인소맨", category: 'anime' },
    { name: "카우보이 비밥", category: 'anime' },
    { name: "코드기어스", category: 'anime' },
    { name: "클라나드", category: 'anime' },
    { name: "페어리 테일", category: 'anime' },
    { name: "하이큐!!", category: 'anime' },
    { name: "헌터 x 헌터", category: 'anime' }
];

// --- 메인 함수 ---
async function main() {
    setupEventListeners();
    await fetchEvents();
    render();
}

// --- 데이터베이스 관련 함수 ---
async function fetchEvents() {
    const q = query(collection(db, "events"));
    return new Promise((resolve) => {
        onSnapshot(q, (querySnapshot) => {
            eventData = [];
            querySnapshot.forEach((doc) => {
                eventData.push({ id: doc.id, ...doc.data() });
            });
            render();
            resolve();
        });
    });
}


async function saveEvent(event) {
    try {
        await addDoc(collection(db, "events"), event);
        console.log("Event added successfully");
    } catch (error) {
        console.error("Error adding event: ", error);
        alert("이벤트 추가에 실패했습니다. 콘솔을 확인해주세요.");
    }
}


// --- 렌더링 관련 함수 ---
function render() {
    updateCurrentMonthDisplay();
    renderCategoryButtons();
    renderSeriesList();
    renderCalendar();
}

function renderCategoryButtons() {
    document.querySelectorAll('#categoryBtns .chapter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === selectedCategory);
    });
}

function updateCurrentMonthDisplay() {
    const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
    document.getElementById('currentMonth').textContent = `${currentDate.getFullYear()}년 ${monthNames[currentDate.getMonth()]}`;
}

function renderSeriesList() {
    const container = document.getElementById('seriesContainer');
    const search = document.getElementById('seriesSearch').value.toLowerCase();
    container.innerHTML = '';

    const currentMonthStr = formatDate(currentDate).substring(0, 7); // "YYYY-MM"

    // 1. 현재 달에 이벤트가 있는 시리즈 이름을 Set으로 만들어 확인용으로 사용합니다.
    const seriesWithEventsThisMonth = new Set(
        eventData
            .filter(e => e.date.startsWith(currentMonthStr))
            .map(e => e.series)
    );

    // 2. 전체 시리즈 목록에서 현재 선택된 카테고리의 시리즈만 필터링합니다.
    const seriesInCategory = allSeries.filter(s => s.category === selectedCategory);

    // 3. 정렬: 이벤트 있는 시리즈를 위로, 나머지는 가나다순으로 정렬합니다.
    seriesInCategory.sort((a, b) => {
        const aHasEvent = seriesWithEventsThisMonth.has(a.name);
        const bHasEvent = seriesWithEventsThisMonth.has(b.name);
        if (aHasEvent && !bHasEvent) return -1;
        if (!aHasEvent && bHasEvent) return 1;
        return a.name.localeCompare(b.name, 'ko');
    });
    
    // 4. 검색어로 최종 필터링합니다.
    const filteredList = seriesInCategory.filter(s => s.name.toLowerCase().includes(search));
    
    // 5. 목록을 화면에 그립니다.
    filteredList.forEach(series => {
        const el = document.createElement('div');
        el.className = 'series-item';
        el.textContent = series.name;

        // 이번 달에 이벤트가 있으면 굵게 표시합니다.
        if (seriesWithEventsThisMonth.has(series.name)) {
            el.style.fontWeight = 'bold';
        }
        
        if (selectedSeries === series.name) {
            el.classList.add('selected');
        }
        
        el.addEventListener('click', () => {
            selectedSeries = (selectedSeries === series.name) ? null : series.name;
            render();
        });
        container.appendChild(el);
    });
}

function renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = '';
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const startDayOffset = firstDayOfMonth.getDay(); 
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - startDayOffset);

    for (let i = 0; i < 42; i++) {
        const day = new Date(startDate);
        day.setDate(startDate.getDate() + i);
        calendarGrid.appendChild(createDayElement(day, month));
    }
}

function createDayElement(date, currentMonth) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    if (date.getMonth() !== currentMonth) {
        dayElement.classList.add('other-month');
    }

    const today = new Date();
    if (date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate()) {
        dayElement.classList.add('today');
    }

    dayElement.innerHTML = `<div class="day-number">${date.getDate()}</div><div class="day-events"></div>`;
    
    // 이벤트 '추가'를 위한 클릭 리스너
    dayElement.addEventListener('click', () => {
        if (date.getMonth() === currentMonth) { // 현재 달의 날짜만 클릭 가능
            openAddEventModal(formatDate(date));
        }
    });

    const eventsContainer = dayElement.querySelector('.day-events');
    const eventsForDay = getEventsForDate(formatDate(date));
    
    eventsForDay.forEach(event => {
        const eventEl = document.createElement('div');
        eventEl.className = 'event-item';
        eventEl.textContent = event.eventName;
        eventEl.title = event.eventName;
        eventEl.addEventListener('click', (e) => {
            e.stopPropagation(); // 부모(dayElement)의 클릭 이벤트 방지
            showModal(event);
        });
        eventsContainer.appendChild(eventEl);
    });

    return dayElement;
}

// --- 이벤트 핸들러 설정 ---
function setupEventListeners() {
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        render();
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        render();
    });

    document.getElementById('seriesSearch').addEventListener('input', renderSeriesList);
    
    // 기존 모달 닫기
    document.querySelector('.close').addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target.id === 'eventModal') {
            closeModal();
        }
    });

    // 이벤트 추가 모달 닫기
    document.getElementById('addEventModalClose').addEventListener('click', closeAddEventModal);
    window.addEventListener('click', (e) => {
        if (e.target.id === 'addEventModal') {
            closeAddEventModal();
        }
    });

    document.querySelectorAll('#categoryBtns .chapter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedCategory = btn.dataset.category;
            selectedSeries = null; // 카테고리 변경 시 시리즈 선택 초기화
            render();
        });
    });

    // 이벤트 추가 폼 제출
    document.getElementById('addEventForm').addEventListener('submit', handleAddEventSubmit);
}

// --- 헬퍼 함수 ---
function getEventsForDate(dateString) {
    return eventData.filter(event => {
        if (event.date !== dateString) return false;
        if (selectedCategory && event.category !== selectedCategory) return false;
        if (selectedSeries && event.series !== selectedSeries) return false;
        return true;
    });
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// --- 모달 관리 ---
function showModal(event) {
    document.getElementById('modalTitle').textContent = event.eventName;
    document.getElementById('modalDate').textContent = event.date;
    document.getElementById('modalCategory').textContent = event.series;
    document.getElementById('modalDescription').textContent = event.description || "상세 설명이 없습니다.";
    
    const link = document.getElementById('modalLink');
    if (event.url) {
        link.href = event.url;
        link.style.display = 'block';
    } else {
        link.style.display = 'none';
    }
    
    document.getElementById('eventModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('eventModal').style.display = 'none';
}

// --- 이벤트 추가 모달 관리 ---
function openAddEventModal(dateString) {
    const modal = document.getElementById('addEventModal');
    const form = document.getElementById('addEventForm');
    form.reset(); // 폼 초기화

    // 날짜 설정
    document.getElementById('eventDate').value = dateString;

    // 시리즈 드롭다운 채우기
    const seriesSelect = document.getElementById('eventSeries');
    seriesSelect.innerHTML = '<option value="">시리즈를 선택하세요</option>'; // 초기화
    
    allSeries
        .filter(s => s.category === selectedCategory) // 현재 카테고리에 맞는 시리즈만
        .forEach(s => {
            const option = document.createElement('option');
            option.value = s.name;
            option.textContent = s.name;
            seriesSelect.appendChild(option);
        });

    modal.style.display = 'flex';
}

function closeAddEventModal() {
    document.getElementById('addEventModal').style.display = 'none';
}

async function handleAddEventSubmit(e) {
    e.preventDefault();
    const newEvent = {
        date: document.getElementById('eventDate').value,
        series: document.getElementById('eventSeries').value,
        eventName: document.getElementById('eventName').value.trim(),
        description: document.getElementById('eventDescription').value.trim(),
        url: document.getElementById('eventUrl').value.trim(),
        category: selectedCategory 
    };

    if (!newEvent.eventName || !newEvent.series) {
        alert('시리즈와 이벤트 이름은 필수 항목입니다.');
        return;
    }

    await saveEvent(newEvent);
    closeAddEventModal();
} 