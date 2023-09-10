// =========================
// Configurações Iniciais
// =========================
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
const fingerDirectionElement = document.getElementById('finger-direction');
let canClick = true;
const ZOOM_IN_THRESHOLD = 0.1; // Defina conforme necessário
const ZOOM_OUT_THRESHOLD = -0.1; // Defina conforme necessário
let currentScale = 1;  // Escala inicial

// =========================
// Módulo de Detecção de Gestos
// =========================
const GestureModule = (() => {
    function onResults(results) {
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

        if (results.multiHandLandmarks) {
            for (const landmarks of results.multiHandLandmarks) {
                drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {color: '#F1FAEE', lineWidth: 3});
                drawLandmarks(canvasCtx, landmarks, {color: '#E63946', lineWidth: 1});
                handleGestureDirection(checkFingerDirection(landmarks), landmarks);
            }
        }
        canvasCtx.restore();
    }

    function checkFingerDirection(handLandmarks) {
        const thumbPos = handLandmarks[4];
        const indexPos = handLandmarks[8];
        return indexPos.x > thumbPos.x ? "Direita" : "Esquerda";
    }

    function handleGestureDirection(direction, handLandmarks) {
        fingerDirectionElement.textContent = direction;
        setTimeout(() => {
            fingerDirectionElement.textContent = "";
        }, 2000);
    
        if (direction === "Direita" && canClick) {
            SlideModule.nextSlide();
            canClick = false;
        } else if (direction === "Esquerda" && canClick) {
            SlideModule.prevSlide();
            canClick = false;
        }
    
        const zoomChange = checkZoomGesture(handLandmarks);
        if (zoomChange > ZOOM_IN_THRESHOLD) {
            SlideModule.zoomIn();
        } else if (zoomChange < ZOOM_OUT_THRESHOLD) {
            SlideModule.zoomOut();
        }
    
        setTimeout(() => {
            canClick = true;
        }, 5000);
    }
    

    return {
        init: () => {
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

            const camera = new Camera(videoElement, {
                onFrame: async () => {
                    await hands.send({image: videoElement});
                },
                width: 1024,
                height: 768
            });
            camera.start();
        }
    };
})();

// =========================
// Módulo de Slides (PDF)
// =========================
const SlideModule = (() => {
    let pdfDoc = null, pageNum = 1, pageRendering = false, pageNumPending = null;

    function renderPage(num) { /*...*/ }
    function queueRenderPage(num) { /*...*/ }

    return {
        nextSlide: () => {
            if (pageNum < pdfDoc.numPages) {
                pageNum++;
                queueRenderPage(pageNum);
            }
        },

        prevSlide: () => {
            if (pageNum > 1) {
                pageNum--;
                queueRenderPage(pageNum);
            }
        },

        zoomIn: () => {
            currentScale += 0.1;  // Ajuste conforme necessário
            renderPage(pageNum);
        },
    
        zoomOut: () => {
            currentScale -= 0.1;  // Ajuste conforme necessário
            renderPage(pageNum);
        },

        init: () => {
            document.getElementById('inputGroupFile').addEventListener('change', function() { /*...*/ });
            document.getElementById('prev').addEventListener('click', SlideModule.prevSlide);
            document.getElementById('next').addEventListener('click', SlideModule.nextSlide);
            document.getElementById('zoomIn').addEventListener('click', SlideModule.zoomIn);
            document.getElementById('zoomOut').addEventListener('click', SlideModule.zoomOut);            
        }
    };
})();

// =========================
// Módulo de Zoom
// =========================
function checkZoomGesture(handLandmarks) {
    const thumbPos = handLandmarks[4];
    const indexPos = handLandmarks[8];
    const distance = Math.sqrt(Math.pow((thumbPos.x - indexPos.x), 2) + Math.pow((thumbPos.y - indexPos.y), 2));

    // Compare com a distância anterior (se disponível)
    if (typeof checkZoomGesture.previousDistance === "undefined") {
        checkZoomGesture.previousDistance = distance;
        return 0; 
    }

    const distanceChange = distance - checkZoomGesture.previousDistance;
    checkZoomGesture.previousDistance = distance;
    return distanceChange;
}




// =========================
// Inicialização dos Módulos
// =========================
window.onload = () => {
    GestureModule.init();
    SlideModule.init();
};