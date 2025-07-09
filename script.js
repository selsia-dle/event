import { db } from './firebase-config.js';
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('multiStepForm');
    if (!form) {
        alert('폼이 존재하지 않습니다. id="multiStepForm"을 확인하세요.');
        return;
    }
    const stepName = form.querySelector('.step-name');
    const stepGender = form.querySelector('.step-gender');
    const stepAge = form.querySelector('.step-age');
    const toGenderBtn = document.getElementById('toGender');
    const genderBtns = form.querySelectorAll('.gender-btn');
    const userNameInput = document.getElementById('userName');
    const userAgeInput = document.getElementById('userAge');
    const tmSection = document.getElementById('tm-section');
    const startTMBtn = document.getElementById('start-tm');
    let userData = { name: '', gender: '', age: '' };

    toGenderBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const name = userNameInput.value.trim();
        if (!name) {
            userNameInput.focus();
            return;
        }
        userData.name = name;
        stepName.style.display = 'none';
        stepGender.style.display = 'flex';
    });

    genderBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            genderBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            userData.gender = btn.dataset.gender;
            stepGender.style.display = 'none';
            stepAge.style.display = 'flex';
            userAgeInput.focus();
        });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const age = userAgeInput.value.trim();
        if (!age) {
            userAgeInput.focus();
            return;
        }
        userData.age = age;
        try {
            await addDoc(collection(db, "cat$dog"), {
                name: userData.name,
                gender: userData.gender,
                age: userData.age,
                createdAt: new Date()
            });
            form.style.display = 'none';
            tmSection.style.display = 'block';
        } catch (err) {
            alert('저장에 실패했습니다.');
        }
    });

    // Teachable Machine 연동 + 5초 후 자동 캡처 및 결과 표시
    const URL = "https://teachablemachine.withgoogle.com/models/CV4lKP4sW/";
    let model, webcam, labelContainer, maxPredictions;
    let captureTimeout;
    let capturedImageDataUrl = null;
    let loopId = null; // loop 애니메이션 id 저장

    startTMBtn.addEventListener('click', async () => {
        if (!window.tmImage) {
            alert('Teachable Machine 라이브러리가 로드되지 않았습니다.');
            return;
        }
        startTMBtn.disabled = true;
        const modelURL = URL + "model.json";
        const metadataURL = URL + "metadata.json";
        model = await window.tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();

        const flip = true;
        webcam = new window.tmImage.Webcam(400, 400, flip);
        await webcam.setup();
        await webcam.play();
        if (loopId) {
            cancelAnimationFrame(loopId);
        }
        loopId = window.requestAnimationFrame(loop);

        // 웹캠 컨테이너에 캔버스 추가 (카운트다운보다 먼저 보여줌)
        const webcamContainer = document.getElementById("webcam-container");
        webcamContainer.innerHTML = '';
        webcamContainer.appendChild(webcam.canvas);
        // 얼굴 윤곽선 가이드 오버레이 추가
        let guide = document.createElement('div');
        guide.className = 'face-guide-overlay';
        webcamContainer.appendChild(guide);
        webcamContainer.style.display = 'block';

        labelContainer = document.getElementById("label-container");
        labelContainer.innerHTML = '';
        for (let i = 0; i < maxPredictions; i++) {
            labelContainer.appendChild(document.createElement("div"));
        }
        labelContainer.style.display = 'block';

        // 5초 카운트다운 (웹캠이 보이는 상태에서)
        let count = 5;
        const countdownDiv = document.createElement('div');
        countdownDiv.id = 'countdown';
        countdownDiv.style.fontSize = '2rem';
        countdownDiv.style.margin = '16px 0';
        countdownDiv.textContent = `5초 후 자동 캡처`;
        tmSection.insertBefore(countdownDiv, webcamContainer);
        webcamContainer.style.position = 'relative';
        webcam.canvas.style.display = 'block';
        guide.style.display = 'block';

        const countdownInterval = setInterval(() => {
            count--;
            countdownDiv.textContent = `${count}초 후 자동 캡처`;
            if (count === 0) {
                clearInterval(countdownInterval);
                countdownDiv.textContent = '캡처!';
                captureAndPredict();
            }
        }, 1000);
    });

    async function loop() {
        if (!webcam || !webcam.canvas) return; // webcam 또는 canvas가 없으면 반복 중단
        webcam.update();
        await predict();
        loopId = window.requestAnimationFrame(loop);
    }

    async function predict() {
        const prediction = await model.predict(webcam.canvas);
        for (let i = 0; i < maxPredictions; i++) {
            const classPrediction =
                prediction[i].className + ": " + (prediction[i].probability * 100).toFixed(2) + "%";
            labelContainer.childNodes[i].innerHTML = classPrediction;
        }
    }

    async function captureAndPredict() {
        // 1. 현재 webcam 이미지를 캡처
        // 밝기 보정: 임시 캔버스에 복사 후 밝기 필터 적용
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = webcam.canvas.width;
        tempCanvas.height = webcam.canvas.height;
        const ctx = tempCanvas.getContext('2d');
        ctx.filter = 'brightness(1.35) contrast(1.10)'; // 밝기 약간만 보정
        ctx.drawImage(webcam.canvas, 0, 0);
        capturedImageDataUrl = tempCanvas.toDataURL('image/png');
        // 2. 예측(한 번만)
        const prediction = await model.predict(webcam.canvas);
        // 3. 결과 중 확률이 가장 높은 클래스를 찾음
        let maxIdx = 0;
        for (let i = 1; i < prediction.length; i++) {
            if (prediction[i].probability > prediction[maxIdx].probability) {
                maxIdx = i;
            }
        }
        const resultClass = prediction[maxIdx].className;
        const resultText = `결과: ${resultClass} (${(prediction[maxIdx].probability * 100).toFixed(2)}%)`;

        // 4. 캡처 이미지와 결과를 화면에 표시
        showCaptureResult(capturedImageDataUrl, resultClass, resultText);

        // 5. 결과를 Firebase에 저장 (result 필드 추가)
        try {
            await addDoc(collection(db, "cat$dog"), {
                name: userData.name,
                gender: userData.gender,
                age: userData.age,
                result: resultClass,
                createdAt: new Date()
            });
        } catch (err) {
            alert('결과 저장에 실패했습니다.');
        }
    }

    function showCaptureResult(imgDataUrl, resultClass, resultText) {
        // 웹캠, 라벨, 카운트다운, 카메라 시작 버튼 숨기기
        document.getElementById("webcam-container").style.display = 'none';
        document.getElementById("label-container").style.display = 'none';
        const countdownDiv = document.getElementById('countdown');
        if (countdownDiv) countdownDiv.style.display = 'none';
        const startTMBtn = document.getElementById('start-tm');
        if (startTMBtn) startTMBtn.style.display = 'none';

        // 캡처 이미지와 결과 표시 영역 생성
        const resultDiv = document.createElement('div');
        resultDiv.className = 'pretty-result';
        // 이모지 매핑 확장
        const lower = resultClass.toLowerCase();
        let emoji = '✨';
        if (lower.includes('dog')) emoji = '🐶';
        else if (lower.includes('cat')) emoji = '🐱';
        else if (lower.includes('rabbit')) emoji = '🐰';
        else if (lower.includes('fox')) emoji = '🦊';
        else if (lower.includes('dinosaur')) emoji = '🦖';
        resultDiv.innerHTML = `
            <div class="capture-img-wrap">
                <img src="${imgDataUrl}" alt="캡처 이미지" class="capture-img">
            </div>
            <div class="result-label">
                ${emoji}<span>${resultClass}</span>${emoji}
            </div>
            <div class="result-text">${resultText}</div>
            <div class="emoji-bubbles"></div>
            <button id="download-result-btn" class="download-result-btn">결과지 다운로드</button>
            <button id="restart-btn" class="restart-btn">처음으로 돌아가기</button>
        `;
        tmSection.appendChild(resultDiv);
        createEmojiBubbles(resultClass);

        // 결과지 다운로드 버튼 이벤트
        document.getElementById('download-result-btn').addEventListener('click', () => {
            downloadResultImage(resultDiv);
        });

        // 처음으로 돌아가기 버튼 이벤트
        document.getElementById('restart-btn').addEventListener('click', () => {
            tmSection.style.display = 'none';
            form.reset();
            userData = { name: '', gender: '', age: '' };
            form.style.display = 'block';
            form.querySelector('.step-name').style.display = 'flex';
            form.querySelector('.step-gender').style.display = 'none';
            form.querySelector('.step-age').style.display = 'none';
            resultDiv.remove();
            if (startTMBtn) {
                startTMBtn.style.display = 'inline-block';
                startTMBtn.disabled = false;
            }
            // webcam 해제 및 loop 중단
            if (webcam) {
                try { webcam.stop(); } catch(e) {}
                webcam = null;
            }
            if (loopId) {
                cancelAnimationFrame(loopId);
                loopId = null;
            }
            // 모델 등도 완전 초기화
            model = null;
            labelContainer = null;
            maxPredictions = null;
            capturedImageDataUrl = null;
            // webcam 관련 DOM 완전 초기화
            const webcamContainer = document.getElementById('webcam-container');
            if (webcamContainer) webcamContainer.innerHTML = '';
            const labelContainerDiv = document.getElementById('label-container');
            if (labelContainerDiv) labelContainerDiv.innerHTML = '';
            // 카운트다운 문구도 완전히 제거
            const countdownDiv = document.getElementById('countdown');
            if (countdownDiv) countdownDiv.remove();
        });
    }

    // 결과지 다운로드 함수 (html2canvas 사용)
    function downloadResultImage(resultDiv) {
        if (!window.html2canvas) {
            alert('다운로드 기능을 위해 html2canvas 라이브러리가 필요합니다.');
            return;
        }
        // 이모지 애니메이션 멈추기 (다운로드 시점에)
        const bubbles = resultDiv.querySelectorAll('.bubble-emoji');
        bubbles.forEach(b => b.style.animationPlayState = 'paused');
        window.html2canvas(resultDiv, {backgroundColor: null, useCORS: true}).then(canvas => {
            const link = document.createElement('a');
            link.download = 'face_result.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
        // 다시 애니메이션 재생
        setTimeout(() => {
            bubbles.forEach(b => b.style.animationPlayState = 'running');
        }, 500);
    }

    // 이모지 비눗방울 애니메이션 생성 함수
    function createEmojiBubbles(resultClass) {
        const emojiContainer = document.querySelector('.emoji-bubbles');
        // 이모지 매핑 확장
        const lower = resultClass.toLowerCase();
        let emoji = '✨';
        if (lower.includes('dog')) emoji = '🐶';
        else if (lower.includes('cat')) emoji = '🐱';
        else if (lower.includes('rabbit')) emoji = '🐰';
        else if (lower.includes('fox')) emoji = '🦊';
        else if (lower.includes('dinosaur')) emoji = '🦖';
        for (let i = 0; i < 18; i++) {
            const span = document.createElement('span');
            span.className = 'bubble-emoji';
            span.textContent = emoji;
            // 랜덤 위치, 크기, 애니메이션 딜레이
            span.style.left = Math.random() * 90 + '%';
            span.style.fontSize = (Math.random() * 1.5 + 1.2) + 'rem';
            span.style.animationDelay = (Math.random() * 2) + 's';
            emojiContainer.appendChild(span);
        }
    }
}); 