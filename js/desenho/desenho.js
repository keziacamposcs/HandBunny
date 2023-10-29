// =========================
// Configurações Iniciais
// =========================
const elementoVideo = document.getElementsByClassName('input_video')[0];
const elementoCanvas = document.getElementsByClassName('output_canvas')[0];
const contextoCanvas = elementoCanvas.getContext('2d');
const elementoQuadro = document.getElementById('quadro');
const contextoQuadro = elementoQuadro.getContext('2d');
let desenhando = false;
let x, y;

// =========================
// Módulo de Desenho
// =========================
const ModuloDesenho = (() => {
    function desenharMarcadoresMao(results, contextoQuadro) {
        if (results.multiHandLandmarks) {
            for (const landmarks of results.multiHandLandmarks) {
                const landmark = landmarks[4];
                contextoQuadro.beginPath();
                contextoQuadro.arc(landmark.x * elementoQuadro.width, landmark.y * elementoQuadro.height, 5, 0, 2 * Math.PI);
                contextoQuadro.fillStyle = '#1B335F';
                contextoQuadro.fill();
            }
        }
    }

    function limpar() {
        contextoQuadro.clearRect(0, 0, elementoQuadro.width, elementoQuadro.height);
    }

    function aoSoltaMouse(evt) {
        desenhando = true;
        x = evt.clientX - elementoQuadro.getBoundingClientRect().left;
        y = evt.clientY - elementoQuadro.getBoundingClientRect().top;
    }

    function aoMoverMouse(evt) {
        if (desenhando) {
            contextoQuadro.beginPath();
            contextoQuadro.moveTo(x, y);
            x = evt.clientX - elementoQuadro.getBoundingClientRect().left;
            y = evt.clientY - elementoQuadro.getBoundingClientRect().top;
            contextoQuadro.lineTo(x, y);
            contextoQuadro.stroke();
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
// Módulo de Detecção de Gestos
// =========================
const ModuloDeteccaoMaos = (() => {
    function aoResultados(results) {
        contextoCanvas.save();
        contextoCanvas.clearRect(0, 0, elementoCanvas.width, elementoCanvas.height);
        contextoCanvas.drawImage(results.image, 0, 0, elementoCanvas.width, elementoCanvas.height);

        if (results.multiHandLandmarks) {
            for (const landmarks of results.multiHandLandmarks) {
                ModuloDesenho.desenharMarcadoresMao(results, contextoQuadro);

                const indexFinger = landmarks[8];
                const handOpen = indexFinger.y < landmarks[5].y;

                if (handOpen) {
                    contextoQuadro.strokeStyle = '#1B335F';
                } else {
                    contextoQuadro.strokeStyle = '#f5f5f5';
                }

                contextoQuadro.lineWidth = 5;
                contextoQuadro.lineCap = 'round';
                contextoQuadro.beginPath();
                contextoQuadro.moveTo(indexFinger.x * elementoQuadro.width, indexFinger.y * elementoQuadro.height);
                contextoQuadro.lineTo(landmarks[7].x * elementoQuadro.width, landmarks[7].y * elementoQuadro.height);
                contextoQuadro.stroke();
            }
        }

        contextoCanvas.restore();
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

    hands.aoResultados(ModuloDeteccaoMaos.aoResultados);

    const camera = new Camera(elementoVideo, {
        onFrame: async () => {
            await hands.send({ image: elementoVideo });
        },
        width: 1024,
        height: 768
    });

    camera.start();
})();

// =========================
// Event Listeners
// =========================
elementoQuadro.addEventListener("mouseup", ModuloDesenho.aoSoltaMouse);
elementoQuadro.addEventListener("mousemove", ModuloDesenho.aoMoverMouse);
