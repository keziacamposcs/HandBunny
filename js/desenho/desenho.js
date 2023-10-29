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
const ModuloDesenho = (() => {
    function desenharMarcadoresMao(results, ctx) {
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

    function aoSoltaMouse(evt) {
        desenhando = true;
        x = evt.clientX - canvasQuadro.getBoundingClientRect().left;
        y = evt.clientY - canvasQuadro.getBoundingClientRect().top;
    }

    function aoMoverMouse(evt) {
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
        desenharMarcadoresMao,
        limpar,
        aoSoltaMouse,
        aoMoverMouse
    };
})();

// =========================
// Módulo de Detecção de Mãos
// =========================
const ModuloDeteccaoMaos = (() => {
    function aoResultados(results) {
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
        ModuloDesenho.desenharMarcadoresMao(results, ctx);

        if (results.multiHandLandmarks) {
            for (const landmarks of results.multiHandLandmarks) {
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
        aoResultados
    };
})();

// =========================
// Módulo da Câmera
// =========================
const ModuloCamera = (() => {
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

    hands.onResults(ModuloDeteccaoMaos.aoResultados);

    const camera = new Camera(videoElement, {
        onFrame: async () => {
            await hands.send({ image: videoElement });
        },
        width: 1024,
        height: 768
    });

    camera.start();

    return {
        hands,
        camera
    };
})();

// =========================
// Event Listeners
// =========================
canvasQuadro.addEventListener("mouseup", ModuloDesenho.aoSoltaMouse);
canvasQuadro.addEventListener("mousemove", ModuloDesenho.aoMoverMouse);
