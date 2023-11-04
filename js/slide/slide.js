// Seletores de elementos DOM
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
const fingerDirectionElement = document.getElementById('finger-direction');

// Configurações e estados iniciais
let currentPDF = null;
let currentPage = 1;
let canClick = true;

// Inicialização do detector de mãos do MediaPipe Hands
const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

// Opções para o detector de mãos
hands.setOptions({
  selfieMode: true,
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

// Registro da função de callback para resultados do detector de mãos
hands.onResults(onResults);

// Inicialização da câmera
const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({ image: videoElement });
  },
  width: 1024,
  height: 768
});
camera.start();

// Funções de utilidade
function onResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.multiHandLandmarks) {
        for (const landmarks of results.multiHandLandmarks) {
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#F1FAEE', lineWidth: 3 });
            drawLandmarks(canvasCtx, landmarks, { color: '#E63946', lineWidth: 1 });

            const direction = checkFingerDirection(landmarks);
            fingerDirectionElement.textContent = direction;
        }
    }
    canvasCtx.restore();
}

function checkFingerDirection(handLandmarks) {
    const thumbPos = handLandmarks[4];
    const indexPos = handLandmarks[8];
    const direction = indexPos.x > thumbPos.x ? "Direita" : "Esquerda";

    document.getElementById("finger-direction").textContent = direction;
    setTimeout(() => {
        document.getElementById("finger-direction").textContent = "";
    }, 2000);

    return direction;
}

function displayPage(page) {
    const pdfViewer = document.getElementById('pdf-viewer');
    pdfViewer.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.src = currentPDF + "#page=" + page;
    iframe.style.width = '100%';
    iframe.style.height = '500px';
    pdfViewer.appendChild(iframe);
}

// Eventos de controle do PDF
document.getElementById('file-input').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file.type === "application/pdf") {
        currentPDF = URL.createObjectURL(file);
        currentPage = 1;
        displayPage(currentPage);
    } else {
        alert("Por favor, selecione um arquivo PDF.");
    }
});

document.getElementById('prev').addEventListener('click', function() {
    if (currentPage > 1) {
        currentPage--;
        displayPage(currentPage);
    }
});

document.getElementById('next').addEventListener('click', function() {
    currentPage++;
    displayPage(currentPage);
});

// Observador para mudança de páginas do PDF baseado na direção do dedo
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    const texto = mutation.target.textContent.toLowerCase();
    if (texto.includes("direita") && canClick) {
        document.getElementById("next").click();
        canClick = false;
        setTimeout(() => canClick = true, 5000);
    } else if (texto.includes("esquerda") && canClick) {
        document.getElementById("prev").click();
        canClick = false;
        setTimeout(() => canClick = true, 5000);
    }
  });
});

observer.observe(fingerDirectionElement, { childList: true });
