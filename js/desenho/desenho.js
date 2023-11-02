// =========================
// Módulo de Desenho
// =========================
function drawHandLandmarks(results, ctx, canvasQuadro) {
    if (results.multiHandLandmarks) {
      for (const landmarks of results.multiHandLandmarks) {
        const landmark = landmarks[4];
        ctx.beginPath();
        ctx.arc(landmark.x * canvasQuadro.width, landmark.y * canvasQuadro.height, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#1D3557';
        ctx.fill();
      }
    }
  }
  function clearCanvas(canvasQuadro) {
    const ctx = canvasQuadro.getContext("2d");
    ctx.clearRect(0, 0, canvasQuadro.width, canvasQuadro.height);
  }
  export const drawingModule = {
    drawHandLandmarks,
    clearCanvas
  };
  
  // =========================
  // Módulo de Detecção de Mãos
  // =========================
  function onResults(results, canvasCtx, canvasElement, canvasQuadro, ctx) {
    canvasCtx.save();
  
    // Limpa o canvas
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  
    // Desenha a imagem da câmera no canvas
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    if (results.multiHandLandmarks) {
      for (const landmarks of results.multiHandLandmarks) {
        drawLandmarks(canvasCtx, [landmarks[8]], {color: '#E63946', lineWidth: 1});
        const indexFinger = landmarks[8]; // seleciona a ponta do dedo indicador (landmark 8)
        const handOpen = indexFinger.y < landmarks[5].y; // verifica se o dedo indicador está abaixo do dedo médio (landmark 5)
  
        if (handOpen) {
          // Mão aberta (pincel)
          ctx.strokeStyle = '#1D3557'; //cor do pincel
          ctx.lineWidth = 5;
          ctx.lineCap = 'round';
        } else {
          // Mão fechada (apagador)
          ctx.strokeStyle = '#f5f5f5'; //cor do apagador
          ctx.lineWidth = 5;
          ctx.lineCap = 'round'; 
        }
  
        ctx.beginPath();
        ctx.moveTo(indexFinger.x * canvasQuadro.width, indexFinger.y * canvasQuadro.height);
        ctx.lineTo(landmarks[7].x * canvasQuadro.width, landmarks[7].y * canvasQuadro.height);
        ctx.stroke();
      }
    }
    canvasCtx.restore();
  }
  function initializeHandDetection(videoElement, onResultsCallback) {
    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });
  
    hands.setOptions({
      selfieMode: true,
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.9,
      minTrackingConfidence: 0.9
    });
  
    hands.onResults(onResultsCallback);
  
    return hands;
  }
  
  export const handDetectionModule = {
    onResults,
    initializeHandDetection
  };
  
  // =========================
  // Módulo da Câmera
  // =========================
  function initializeCamera(videoElement, hands) {
    const camera = new Camera(videoElement, {
      onFrame: async () => {
        await hands.send({image: videoElement});
      },
      width: 1024,
      height: 768
    });
  
    return camera;
  }
  export const cameraModule = {
    initializeCamera
  };
  
  // =========================
  // Event Listeners
  // =========================
  function setupEventListeners(canvasQuadro, ctx) {
    let desenhando = false;
    let x, y;
  
    canvasQuadro.addEventListener("mouseup", function(evt) {
      desenhando = true;
      x = evt.clientX - canvasQuadro.getBoundingClientRect().left;
      y = evt.clientY - canvasQuadro.getBoundingClientRect().top;
    });
    
    canvasQuadro.addEventListener("mousemove", function(evt) {
      if (desenhando) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        x = evt.clientX - canvasQuadro.getBoundingClientRect().left;
        y = evt.clientY - canvasQuadro.getBoundingClientRect().top;
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    });
  }
  export const eventListenersModule = {
    setupEventListeners
  };
  
// =========================
// Configurações Iniciais e Execução
// =========================
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
const canvasQuadro = document.getElementById('quadro');
const ctx = canvasQuadro.getContext('2d');

const hands = handDetectionModule.initializeHandDetection(videoElement, (results) => handDetectionModule.onResults(results, canvasCtx, canvasElement, canvasQuadro, ctx));
const camera = cameraModule.initializeCamera(videoElement, hands);
camera.start();

eventListenersModule.setupEventListeners(canvasQuadro, ctx);
