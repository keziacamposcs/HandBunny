const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
const fingerDirectionElement = document.getElementById('finger-direction');
let canClick = true;

// Função que processa os resultados da detecção de mãos
function onResults(results) {
    canvasCtx.save();
    // Limpa o canvas
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    // Desenha a imagem da câmera no canvas
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.multiHandLandmarks) {
        for (const landmarks of results.multiHandLandmarks) {
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#F1FAEE', lineWidth: 3 });
            drawLandmarks(canvasCtx, landmarks, { color: '#E63946', lineWidth: 1 });

            // Verifica a direção do dedo indicador
            const direction = checkFingerDirection(landmarks);

            // Atualiza a legenda com a direção do dedo indicador
            fingerDirectionElement.textContent = direction;
        }
    }
    canvasCtx.restore();
}

function checkFingerDirection(handLandmarks) {
    const thumbPos = handLandmarks[4];
    const indexPos = handLandmarks[8];
    const middlePos = handLandmarks[12];
    const ringPos = handLandmarks[16];
    const pinkyPos = handLandmarks[20];

    const deltaX = indexPos.x - thumbPos.x;
    const deltaY = indexPos.y - thumbPos.y;

    const distBetweenFingers = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Detecta gesto de zoom in (dedos se aproximando)
    if (distBetweenFingers < 20) {
        return "Zoom In";
    }

    // Detecta gesto de zoom out (dedos afastando)
    if (distBetweenFingers > 50) {
        return "Zoom Out";
    }

    // Detecta gesto de página anterior
    if (middlePos.x < thumbPos.x && ringPos.x < thumbPos.x && pinkyPos.x < thumbPos.x) {
        return "Anterior";
    }

    // Detecta gesto de próxima página
    if (middlePos.x > thumbPos.x && ringPos.x > thumbPos.x && pinkyPos.x > thumbPos.x) {
        return "Próxima";
    }

    return "Nenhum";
}

// Configura o detector de mãos do MediaPipe Hands
const hands = new Hands({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }
});

hands.setOptions({
    selfieMode: true,
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});
hands.onResults(onResults);

// Inicializa a câmera
const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({ image: videoElement });
    },
    width: 1024,
    height: 768
});
camera.start();

// PDF
var pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = '//mozilla.github.io/pdf.js/build/pdf.worker.js';

var pdfDoc = null,
    pageNum = 1,
    pageRendering = false,
    pageNumPending = null,
    scale = 0.8,
    canvas = document.getElementById('the-canvas'),
    ctx = canvas.getContext('2d');

// Renderiza a página
function renderPage(num) {
    const pageCanvas = document.getElementById('the-canvas');
    const context = pageCanvas.getContext('2d');
    pageRendering = true;

    pdfDoc.getPage(num).then(function (page) {
        const viewport = page.getViewport({ scale: scale });
        pageCanvas.width = viewport.width;
        pageCanvas.height = viewport.height;
        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };
        page.render(renderContext).promise.then(function () {
            pageRendering = false;
            if (pageNumPending !== null) {
                renderPage(pageNumPending);
                pageNumPending = null;
            }
        });
    });
    document.getElementById('page_num').textContent = num;
}

function queueRenderPage(num) {
    if (pageRendering) {
        pageNumPending = num;
    } else {
        renderPage(num);
    }
}

// Função que muda para a página anterior
function onPrevPage() {
    if (pageNum <= 1) {
        return;
    }
    pageNum--;
    queueRenderPage(pageNum);
}
document.getElementById('prev').addEventListener('click', onPrevPage);

// Função que muda para a próxima página
function onNextPage() {
    if (pageNum >= pdfDoc.numPages) {
        return;
    }
    pageNum++;
    queueRenderPage(pageNum);
}
document.getElementById('next').addEventListener('click', onNextPage);
// Função que realiza o zoom in
SlideModule.zoomIn = () => {
    if (scale < 2.0) { // Limita o zoom para 2x o tamanho original ou ajuste conforme necessário
        scale += 0.1; // Ajuste o valor do zoom conforme necessário
        renderPage(pageNum);
    }
}

// Função que realiza o zoom out
SlideModule.zoomOut = () => {
    if (scale > 0.5) { // Limita o zoom para 0.5x o tamanho original ou ajuste conforme necessário
        scale -= 0.1; // Ajuste o valor do zoom conforme necessário
        renderPage(pageNum);
    }
}

// Carrega o slide
document.getElementById('inputGroupFile').addEventListener('change', function () {
    var file = this.files[0];
    var fileReader = new FileReader();
    fileReader.onload = function () {
        var typedarray = new Uint8Array(this.result);
        pdfjsLib.getDocument(typedarray).promise.then(function (pdfDoc_) {
            pdfDoc = pdfDoc_;
            document.getElementById('page_count').textContent = pdfDoc.numPages;
            renderPage(pageNum);
        });
    };
    fileReader.readAsArrayBuffer(file);
});

const botao_prox = document.getElementById("next");
const botao_antes = document.getElementById("prev");

function handleGestureDirection(direction) {
    fingerDirectionElement.textContent = direction;
    setTimeout(() => {
        fingerDirectionElement.textContent = "";
    }, 2000);

    if (direction === "Próxima" && canClick) {
        SlideModule.nextSlide();
        canClick = false;
    } else if (direction === "Anterior" && canClick) {
        SlideModule.prevSlide();
        canClick = false;
    } else if (direction === "Zoom In" && canClick) {
        SlideModule.zoomIn();
        canClick = false;
    } else if (direction === "Zoom Out" && canClick) {
        SlideModule.zoomOut();
        canClick = false;
    }

    setTimeout(() => {
        canClick = true;
    }, 5000);
}

