// =========================
// Configurações Iniciais
// =========================
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
const fingerDirectionElement = document.getElementById('finger-direction');
let canClick = true;

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
                handleGestureDirection(checkFingerDirection(landmarks));
            }
        }
        canvasCtx.restore();
    }

    function checkFingerDirection(handLandmarks) {
        const thumbPos = handLandmarks[4];
        const indexPos = handLandmarks[8];
        return indexPos.x > thumbPos.x ? "Direita" : "Esquerda";
    }

    function handleGestureDirection(direction) {
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
            });
            hands.onResults(onResults);

            const camera = new Camera(videoElement, {
                onFrame: async () => {
                    await hands.send({image: videoElement});
                },
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
        init: () => {
            document.getElementById('inputGroupFile').addEventListener('change', function() { /*...*/ });
            document.getElementById('prev').addEventListener('click', SlideModule.prevSlide);
            document.getElementById('next').addEventListener('click', SlideModule.nextSlide);
        }
    };
})();

// =========================
// Inicialização dos Módulos
// =========================
window.onload = () => {
    GestureModule.init();
    SlideModule.init();
};