// Seletores de elementos DOM
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
const fingerdirecaoElement = document.getElementById('direcao_dedo');

// Configurações e estados iniciais
let pdfAtual = null;
let PaginaAtual = 1;
let podeClicar = true;

// Inicialização do detector de mãos do MediaPipe Hands
const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

// Configuração do detector de mãos
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
            drawLandmarks(canvasCtx, landmarks, { color: '#F26D4F', lineWidth: 1 });

            const direcao = VerificarDirecaoDedo(landmarks);
            fingerdirecaoElement.textContent = direcao;
        }
    }
    canvasCtx.restore();
}

function VerificarDirecaoDedo(handLandmarks) {
    const thumbPos = handLandmarks[4];
    const indexPos = handLandmarks[8];
    const direcao = indexPos.x > thumbPos.x ? "Direita" : "Esquerda";

    document.getElementById("direcao_dedo").textContent = direcao;
    setTimeout(() => {
        document.getElementById("direcao_dedo").textContent = "";
    }, 2000);

    return direcao;
}

function displayPage(page) {
    const pdfViewer = document.getElementById('pdf-viewer');
    pdfViewer.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.src = pdfAtual + "#page=" + page;
    iframe.style.width = '100%';
    iframe.style.height = '500px';
    pdfViewer.appendChild(iframe);
}

// Eventos de controle do PDF
document.getElementById('file-input').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file.type === "application/pdf") {
        pdfAtual = URL.createObjectURL(file);
        PaginaAtual = 1;
        displayPage(PaginaAtual);
    } else {
        alert("Por favor, selecione um arquivo PDF.");
    }
});

document.getElementById('anterior').addEventListener('click', function() {
    if (PaginaAtual > 1) {
        PaginaAtual--;
        displayPage(PaginaAtual);
    }
});

document.getElementById('proximo').addEventListener('click', function() {
    PaginaAtual++;
    displayPage(PaginaAtual);
});

// Observador para mudança de páginas do PDF baseado na direção do dedo
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    const texto = mutation.target.textContent.toLowerCase();
    if (texto.includes("direita") && podeClicar) {
        document.getElementById("proximo").click();
        podeClicar = false;
        setTimeout(() => podeClicar = true, 5000);
    } else if (texto.includes("esquerda") && podeClicar) {
        document.getElementById("anterior").click();
        podeClicar = false;
        setTimeout(() => podeClicar = true, 5000);
    }
  });
});

observer.observe(fingerdirecaoElement, { childList: true });
