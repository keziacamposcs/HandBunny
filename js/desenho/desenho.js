// Módulo para a detecção de mãos
const HandDetectionModule = (function () {
    const videoElement = document.getElementsByClassName('input_video')[0];
    const canvasElement = document.getElementsByClassName('output_canvas')[0];
    const canvasCtx = canvasElement.getContext('2d');
    const fingerDirectionElement = document.getElementById('finger-direction');
  
    // Função que processa os resultados da detecção de mãos
    function onResults(results) {
      canvasCtx.save();
      // Limpa o canvas
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  
      // Desenha a imagem da câmera no canvas
      canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
      if (results.multiHandLandmarks) {
        for (const landmarks of results.multiHandLandmarks) {
          drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#F1FAEE', lineWidth: 3 });
          drawLandmarks(canvasCtx, landmarks, { color: '#E63946', lineWidth: 1 });
  
          // verifica a direção do dedo indicador
          const direction = checkFingerDirection(landmarks);
  
          // Atualiza a legenda com a direção do dedo indicador
          fingerDirectionElement.textContent = direction;
        }
      }
      canvasCtx.restore();
    }
  
    function checkFingerDirection(handLandmarks) {
      const thumbPos = handLandmarks[4];
      const indexPos = handLandmarks[8];
  
      if (indexPos.x > thumbPos.x) {
        // Exibe "Direita" por 1 segundos
        document.getElementById("finger-direction").textContent = "Direita";
        setTimeout(() => {
          document.getElementById("finger-direction").textContent = "";
        }, 2000);
        return "Direita";
      } else {
        // Exibe "Esquerda" por 1 segundos
        document.getElementById("finger-direction").textContent = "Esquerda";
        setTimeout(() => {
          document.getElementById("finger-direction").textContent = "";
        }, 2000);
        return "Esquerda";
      }
    }
  
    return {
      onResults,
    };
  })();
  
  // Módulo para a detecção de PDF
  const PdfDetectionModule = (function () {
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
    function renderPage(num) {
      pageRendering = true;
      // Using promise to fetch the page
      pdfDoc.getPage(num).then(function (page) {
        var viewport = page.getViewport({ scale: scale });
        canvas.height = viewport.height;
        canvas.width = viewport.width;
  
        // Render PDF page into canvas context
        var renderContext = { canvasContext: ctx, viewport: viewport };
        var renderTask = page.render(renderContext);
  
        // Wait for rendering to finish
        renderTask.promise.then(function () {
          pageRendering = false;
          if (pageNumPending !== null) {
            renderPage(pageNumPending);
            pageNumPending = null;
          }
        });
      });
      document.getElementById('page_num').textContent = num;
    }
  
    function queueRenderPage(num) {
      if (pageRendering) {
        pageNumPending = num;
      } else {
        renderPage(num);
      }
    }
  
    // Função que muda para a página anterior
    function onPrevPage() {
      if (pageNum <= 1) {
        return;
      }
      pageNum--;
      queueRenderPage(pageNum);
    }
  
    // Função que muda para a próxima página
    function onNextPage() {
      if (pageNum >= pdfDoc.numPages) {
        return;
      }
      pageNum++;
      queueRenderPage(pageNum);
    }
  
    // Carrega o slide
    document.getElementById('inputGroupFile').addEventListener('change', function () {
      var file = this.files[0];
      var fileReader = new FileReader();
      fileReader.onload = function () {
        var typedarray = new Uint8Array(this.result);
        pdfjsLib.getDocument(typedarray).promise.then(function (pdfDoc_) {
          pdfDoc = pdfDoc_;
          document.getElementById('page_count').textContent = pdfDoc.numPages;
          renderPage(pageNum);
        });
      };
      fileReader.readAsArrayBuffer(file);
    });
  
    document.getElementById('prev').addEventListener('click', onPrevPage);
    document.getElementById('next').addEventListener('click', onNextPage);
  
    return {
      renderPage,
    };
  })();
  
  // Módulo para o controle de cliques
  const ClickControlModule = (function () {
    const botao_prox = document.getElementById("next");
    const botao_antes = document.getElementById("prev");
  
    let canClick = true; // Variável para controlar o delay entre cliques
  
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        const texto = mutation.target.textContent.toLowerCase();
        if (texto.includes("direita") && canClick) {
          PdfDetectionModule.renderPage(PdfDetectionModule.pageNum + 1);
          canClick = false;
          setTimeout(() => {
            canClick = true;
          }, 5000); // Delay
          break;
        } else if (texto.includes("esquerda") && canClick) {
          PdfDetectionModule.renderPage(PdfDetectionModule.pageNum - 1);
          canClick = false;
          setTimeout(() => {
            canClick = true;
          }, 5000); // Delay
          break;
        }
      }
    });
  
    observer.observe(document.body, { childList: true, subtree: true });
  })();  