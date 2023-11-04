const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');

// Função que processa os resultados da detecção de mãos
function onResults(results)
{
    canvasCtx.save();
    // Limpa o canvas
    canvasCtx.clearRect( 0, 0, canvasElement.width, canvasElement.height );

    // Desenha a imagem da câmera no canvas
    canvasCtx.drawImage( results.image, 0, 0, canvasElement.width, canvasElement.height );
    if (results.multiHandLandmarks)
    {
        for (const landmarks of results.multiHandLandmarks)
        {
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS,  {color: '#F1FAEE', lineWidth: 3}  );
            drawLandmarks(canvasCtx, landmarks, {color: '#E63946', lineWidth: 1});

            // verifica a direção do dedo indicador
            const direction = checkFingerDirection(landmarks);

            // Atualiza a legenda com a direção do dedo indicador
            //fingerDirectionElement.textContent = checkFingerDirection(landmarks);
            fingerDirectionElement.textContent = direction;
        }
    }
    canvasCtx.restore();
}

function checkFingerDirection(handLandmarks)
{
    const thumbPos = handLandmarks[4];
    const indexPos = handLandmarks[8];

    if (indexPos.x > thumbPos.x)
    {
        // Exibe "Direita" por 1 segundos
        document.getElementById("finger-direction").textContent = "Direita";
        setTimeout(() => {
            document.getElementById("finger-direction").textContent = "";
        }, 2000);
        return "Direita";
    }
    else
    {
        // Exibe "Esquerda" por 1 segundos
        document.getElementById("finger-direction").textContent = "Esquerda";
        setTimeout(() => {
            document.getElementById("finger-direction").textContent = "";
        }, 2000);
        return "Esquerda";
    }
}

const fingerDirectionElement = document.getElementById('finger-direction');
// Fim - Função que verifica a direção do dedo indicador

// Configura o detector de mãos do MediaPipe Hands
const hands = new Hands({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
}});

hands.setOptions({
  selfieMode: true,
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});
hands.onResults(onResults);

// Inicializa a câmera
const camera = new Camera(videoElement,
{
  onFrame: async () => {
    await hands.send({image: videoElement});
  },
  width: 1024,
  height: 768
});
camera.start();

//PDF
let currentPDF = null;
let currentPage = 1;

document.getElementById('file-input').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file.type === "application/pdf") {
        currentPDF = URL.createObjectURL(file);
        currentPage = 1; // Começar do início do PDF
        displayPage(currentPage);
    } else {
        alert("Por favor, selecione um arquivo PDF.");
    }
});

function displayPage(page) {
    const pdfViewer = document.getElementById('pdf-viewer');
    pdfViewer.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.src = currentPDF + "#page=" + page;
    iframe.style.width = '100%';
    iframe.style.height = '500px';
    pdfViewer.appendChild(iframe);
}

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

const botao_prox = document.getElementById("next");
const botao_antes = document.getElementById("prev");

let canClick = true;
   const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        const texto = mutation.target.textContent.toLowerCase();
        if (texto.includes("direita") && canClick) {
            botao_prox.click();
            canClick = false;
            setTimeout(() => {
                canClick = true;
            }, 5000); // Delay 
            break;
        }
        else if (texto.includes("esquerda") && canClick) {
            botao_antes.click();
            canClick = false;
            setTimeout(() => {
                canClick = true;
            }, 5000); // Delay 
            break;
        }
    }
});

observer.observe(document.body, { childList: true, subtree: true });
