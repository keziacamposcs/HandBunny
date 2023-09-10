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
    let scale = 1.0; // Adicione uma variável de escala

    function renderPage(num) {
        // Atualize a função renderPage para incluir a escala
        const pageCanvas = document.getElementById('the-canvas');
        const context = pageCanvas.getContext('2d');
        pageRendering = true;

        pdfDoc.getPage(num).then(function(page) {
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
            if (scale < 2.0) { // Defina um limite de zoom
                scale += 0.1; // Aumente a escala
                renderPage(pageNum);
            }
        },
        zoomOut: () => {
            if (scale > 0.5) { // Defina um limite de zoom
                scale -= 0.1; // Diminua a escala
                renderPage(pageNum);
            }
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
// Inicialização dos Módulos
// =========================
window.onload = () => {
    GestureModule.init();
    SlideModule.init();
};