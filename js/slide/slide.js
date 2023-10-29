// =========================
// Configurações Iniciais
// =========================
const elementoVideo = document.getElementsByClassName('input_video')[0];
const elementoCanvas = document.getElementsByClassName('output_canvas')[0];
const contextoCanvas = elementoCanvas.getContext('2d');
const elementoDirecaoDedo = document.getElementById('finger-direction');
let podeClicar = true;

// =========================
// Módulo de Detecção de Gestos
// =========================
const ModuloDeteccaoGestos = (() => {

    function aoResultados(results) {
        contextoCanvas.save();
        contextoCanvas.clearRect(0, 0, elementoCanvas.width, elementoCanvas.height);
        contextoCanvas.drawImage(results.image, 0, 0, elementoCanvas.width, elementoCanvas.height);

        if (results.multiHandLandmarks) {
            for (const landmarks of results.multiHandLandmarks) {
                drawConnectors(contextoCanvas, landmarks, HAND_CONNECTIONS, {color: '#F1FAEE', lineWidth: 3});
                drawLandmarks(contextoCanvas, landmarks, {color: '#E63946', lineWidth: 1});
                manipularDirecaoGesto(verificarDirecaoDedo(landmarks));
            }
        }
        contextoCanvas.restore();
    }

    function verificarDirecaoDedo(handLandmarks) {
        const thumbPos = handLandmarks[4];
        const indexPos = handLandmarks[8];
        return indexPos.x > thumbPos.x ? "Direita" : "Esquerda";
    }

    function manipularDirecaoGesto(direction) {
        elementoDirecaoDedo.textContent = direction;$
        setTimeout(() => {
            elementoDirecaoDedo.textContent = "";
        }, 2000);

        if (direction === "Direita" && podeClicar) {
            ModuloSlides.proximoSlide();
            podeClicar = false;
        } else if (direction === "Esquerda" && podeClicar) {
            ModuloSlides.slideAnterior();
            podeClicar = false;
        }

        setTimeout(() => {
            podeClicar = true;
        }, 5000);
    }

    return {
        iniciar: () => {
            const hands = new Hands({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
                }
            });

            hands.setOptions({
                selfieMode: true,
            });
            hands.aoResultados(aoResultados);

            const camera = new Camera(elementoVideo, {
                onFrame: async () => {
                    await hands.send({image: elementoVideo});
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
const ModuloSlides = (() => {
    let docPdf = null, numPagina = 1, renderizandoPagina = false, numPaginaPendente = null;

    function renderizarPagina(num) { /*...*/ }
    function enfileirarRenderizacaoPagina(num) { /*...*/ }

    return {
        proximoSlide: () => {
            if (numPagina < docPdf.numPages) {
                numPagina++;
                enfileirarRenderizacaoPagina(numPagina);
            }
        },
        slideAnterior: () => {
            if (numPagina > 1) {
                numPagina--;
                enfileirarRenderizacaoPagina(numPagina);
            }
        },
        iniciar: () => {
            document.getElementById('inputGroupFile').addEventListener('change', function() { /*...*/ });
            document.getElementById('prev').addEventListener('click', ModuloSlides.slideAnterior);
            document.getElementById('next').addEventListener('click', ModuloSlides.proximoSlide);
        }
    };
})();

// =========================
// Inicialização dos Módulos
// =========================
window.onload = () => {
    ModuloDeteccaoGestos.iniciar();
    ModuloSlides.iniciar();
};