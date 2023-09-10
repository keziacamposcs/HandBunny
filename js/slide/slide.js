const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');

let currentScale = 1.0; // Escala atual
const minScale = 0.5;   // Escala mínima
const maxScale = 2.0;   // Escala máxima
let isZooming = false; // Indica se o gesto de zoom está em andamento
let isShaking = false; // Indica se a mão está sendo agitada

// Função para detectar o gesto de zoom
function detectZoomGesture(handLandmarks) {
    const palmBase = handLandmarks[0];
    const palmCenter = handLandmarks[9]; // Use um ponto central da palma da mão

    // Calcula a distância vertical entre a base da palma e o centro da palma
    const palmVerticalDistance = Math.abs(palmCenter.y - palmBase.y);

    // Verifique se o movimento é semelhante ao de agitar
    const shakeThreshold = 20; // Ajuste conforme necessário
    const isShakingGesture = palmVerticalDistance > shakeThreshold;

    // Inicia o gesto de zoom quando o movimento de agitar é detectado
    if (isShakingGesture && !isZooming) {
        isZooming = true;
        applyZoom(1.1); // Aumenta o zoom quando agitado
    }

    // Conclui o gesto de zoom quando o movimento de agitar termina
    if (!isShakingGesture && isZooming) {
        isZooming = false;
    }
}

// Função para aplicar o zoom à página
function applyZoom(zoomAmount) {
    document.body.style.zoom = zoomAmount;
}


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

            detectZoomGesture(landmarks);

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
var pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = '//mozilla.github.io/pdf.js/build/pdf.worker.js';

var pdfDoc = null,
pageNum = 1,
pageRendering = false,
pageNumPending = null,
scale = 0.8,
canvas = document.getElementById('the-canvas'),
ctx = canvas.getContext('2d');

// renderiniza a página
function renderPage(num)
{
  pageRendering = true;
  // Using promise to fetch the page
  pdfDoc.getPage(num).then(function(page)
  {
    var viewport = page.getViewport({scale: scale});
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // Render PDF page into canvas context
    var renderContext = {canvasContext: ctx, viewport: viewport };
    var renderTask = page.render(renderContext);

    // Wait for rendering to finish
    renderTask.promise.then(function()
    {
      pageRendering = false;
      if (pageNumPending !== null)
      {
        renderPage(pageNumPending);
        pageNumPending = null;
      }
    });
  });
  document.getElementById('page_num').textContent = num;
}

function queueRenderPage(num)
{
  if (pageRendering)
  {
    pageNumPending = num;
  }
  else
  {
    renderPage(num);
  }
}

// Função que muda para a página anterior
function onPrevPage()
{
  if (pageNum <= 1)
  {
    return;
  }
  pageNum--;
  queueRenderPage(pageNum);
}
document.getElementById('prev').addEventListener('click', onPrevPage);
// Fim - Função que muda para a página anterior

// Função que muda para a proxima página
function onNextPage()
{
  if (pageNum >= pdfDoc.numPages) 
  {
    return;
  }
  pageNum++;
  queueRenderPage(pageNum);
}
document.getElementById('next').addEventListener('click', onNextPage);
// Fim - Função que muda para a proxima página

//Carrega o slide
document.getElementById('inputGroupFile').addEventListener('change', function()
{
  var file = this.files[0];
  var fileReader = new FileReader();
  fileReader.onload = function()
  {
    var typedarray = new Uint8Array(this.result);
    pdfjsLib.getDocument(typedarray).promise.then(function(pdfDoc_)
    {
      pdfDoc = pdfDoc_;
      document.getElementById('page_count').textContent = pdfDoc.numPages;
      renderPage(pageNum);
    });
  };
  fileReader.readAsArrayBuffer(file);
});



const botao_prox = document.getElementById("next");
const botao_antes = document.getElementById("prev");

let canClick = true; // Variável para controlar o delay entre cliques

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