// =========================
// Configurações Iniciais
// =========================
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
const canvasQuadro = document.getElementById('quadro');
const ctx = canvasQuadro.getContext('2d');
let desenhando = false;
let x, y;

// =========================
// Módulo de Desenho
// =========================
const DrawModule = (() => {
    function drawHandLandmarks(results, ctx) {
        if (results.multiHandLandmarks) {
            for (const landmarks of results.multiHandLandmarks) {
                const landmark = landmarks[4];
                ctx.beginPath();
                ctx.arc(landmark.x * canvasQuadro.width, landmark.y * canvasQuadro.height, 5, 0, 2 * Math.PI);
                ctx.fillStyle = '#1B335F';
                ctx.fill();
            }
        }
    }

    function limpar() {
        ctx.clearRect(0, 0, canvasQuadro.width, canvasQuadro.height);
    }

    function onMouseUp(evt) {
        desenhando = true;
        x = evt.clientX - canvasQuadro.getBoundingClientRect().left;
        y = evt.clientY - canvasQuadro.getBoundingClientRect().top;
    }

    function onMouseMove(evt) {
        if (desenhando) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            x = evt.clientX - canvasQuadro.getBoundingClientRect().left;
            y = evt.clientY - canvasQuadro.getBoundingClientRect().top;
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    }

    return {
        drawHandLandmarks,
        limpar,
        onMouseUp,
        onMouseMove
    };
})();

// =========================
// Módulo de Detecção de Mãos
// =========================
const HandDetectionModule = (() => {
    function onResults(results) {
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

        if (results.multiHandLandmarks) {
            for (const landmarks of results.multiHandLandmarks) {
                DrawModule.drawHandLandmarks(results, ctx);

                const indexFinger = landmarks[8];
                const handOpen = indexFinger.y < landmarks[5].y;

                if (handOpen) {
                    ctx.strokeStyle = '#1B335F';
                } else {
                    ctx.strokeStyle = '#f5f5f5';
                }

                ctx.lineWidth = 5;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(indexFinger.x * canvasQuadro.width, indexFinger.y * canvasQuadro.height);
                ctx.lineTo(landmarks[7].x * canvasQuadro.width, landmarks[7].y * canvasQuadro.height);
                ctx.stroke();
            }
        }

        canvasCtx.restore();
    }

    return {
        onResults
    };
})();

// =========================
// Módulo da Câmera
// =========================
const CameraModule = (() => {
    const hands = new Hands({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
    });

    hands.setOptions({
        selfieMode: true,
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.9,
        minTrackingConfidence: 0.9
    });

    hands.onResults(HandDetectionModule.onResults);

    const camera = new Camera(videoElement, {
        onFrame: async () => {
            await hands.send({ image: videoElement });
        },
        width: 1024,
        height: 768
    });

    camera.start();
})();

// =========================
// Event Listeners
// =========================
canvasQuadro.addEventListener("mouseup", DrawModule.onMouseUp);
canvasQuadro.addEventListener("mousemove", DrawModule.onMouseMove);
