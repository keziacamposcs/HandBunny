// =========================
// Módulo de Desenho
// =========================
function drawLandmarksOnCanvas(results, canvasCtx) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasCtx.canvas.width, canvasCtx.canvas.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasCtx.canvas.width, canvasCtx.canvas.height);
    if (results.multiHandLandmarks) {
        for (const landmarks of results.multiHandLandmarks) {
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#F1FAEE', lineWidth: 3 });
            drawLandmarks(canvasCtx, landmarks, { color: '#E63946', lineWidth: 1 });
        }
    }
    canvasCtx.restore();
}

// =========================
// Módulo de Detecção de Mãos
// =========================
function onResults(results) {
    drawLandmarksOnCanvas(results, canvasCtx);
    if (results.multiHandLandmarks) {
        fingerDirectionElement.textContent = checkFingerDirection(results.multiHandLandmarks[0]);
    }
}

function initializeHandDetection() {
    const hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({
        selfieMode: true,
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    hands.onResults(onResults);

    return hands;
}

// =========================
// Módulo da Câmera
// =========================
function initializeCamera(videoElement, hands) {
    const camera = new Camera(videoElement, {
        onFrame: async () => {
            await hands.send({ image: videoElement });
        },
        width: 1024,
        height: 768
    });
    return camera;
}

// =========================
// Módulo de Direção do Dedo
// =========================
function checkFingerDirection(handLandmarks) {
    const thumbPos = handLandmarks[4];
    const indexPos = handLandmarks[8];

    if (indexPos.x > thumbPos.x) {
        setTimeout(() => {
            fingerDirectionElement.textContent = "";
        }, 2000);
        return "Direita";
    } else {
        setTimeout(() => {
            fingerDirectionElement.textContent = "";
        }, 2000);
        return "Esquerda";
    }
}

// =========================
// Módulo PDF
// =========================
function setupPdfViewer() {
    // ... (todo o código relacionado a manipulação do PDF vai aqui)
    // Certifique-se de exportar as funções que precisam ser acessadas fora deste módulo
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
    
}

// =========================
// Observador de Mutação
// =========================
function setupMutationObserver() {
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
}

// =========================
// Configurações Iniciais e Execução
// =========================
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
const fingerDirectionElement = document.getElementById('finger-direction');

const hands = initializeHandDetection();
const camera = initializeCamera(videoElement, hands);
camera.start();

setupMutationObserver();
setupPdfViewer();
