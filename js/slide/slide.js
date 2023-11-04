// --------------------
//  Camera
// --------------------
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');

function onResults(results)
{
    canvasCtx.save();
    canvasCtx.clearRect( 0, 0, canvasElement.width, canvasElement.height );
    canvasCtx.drawImage( results.image, 0, 0, canvasElement.width, canvasElement.height );
    if (results.multiHandLandmarks)
    {
        for (const landmarks of results.multiHandLandmarks)
        {
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS,  {color: '#F1FAEE', lineWidth: 3}  );
            drawLandmarks(canvasCtx, landmarks, {color: '#E63946', lineWidth: 1});
            const direction = checkFingerDirection(landmarks);
            fingerDirectionElement.textContent = direction;
        }
    }
    canvasCtx.restore();
}
// --------------------
//  Fim - Camera
// --------------------


// --------------------
//  Direcao do dedo
// --------------------
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
// --------------------
//  Fim - Direcao do dedo
// --------------------


// --------------------
//  Configuração MediaPipe
// --------------------
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
// --------------------
//  Fim  - Configuração MediaPipe
// --------------------


// --------------------
//  PDF
// --------------------
var pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = '//mozilla.github.io/pdf.js/build/pdf.worker.js';

var pdfDoc = null,
pageNum = 1,
pageRendering = false,
pageNumPending = null,
scale = 0.8,
canvas = document.getElementById('the-canvas'),
ctx = canvas.getContext('2d');


function renderPage(num)
{
  pageRendering = true;
  pdfDoc.getPage(num).then(function(page)
  {
    var viewport = page.getViewport({scale: scale});
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    var renderContext = {canvasContext: ctx, viewport: viewport };
    var renderTask = page.render(renderContext);
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
// --------------------
//  Fim - PDF
// --------------------


// --------------------
//  Listeners
// --------------------
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
// --------------------
//  Fim - Listeners
// --------------------