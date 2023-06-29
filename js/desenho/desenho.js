const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');

const canvasQuadro = document.getElementById('quadro');

var ctx = canvasQuadro.getContext('2d');
var desenhando = false;
var x, y;

function drawHandLandmarks(results, ctx) {
  if (results.multiHandLandmarks) {
    for (const landmarks of results.multiHandLandmarks) {
      const landmark = landmarks[4]; // seleciona a ponta do dedo indicador (landmark 4)
      ctx.beginPath();
      ctx.arc(landmark.x * canvasQuadro.width, landmark.y * canvasQuadro.height, 5, 0, 2 * Math.PI);
      ctx.fillStyle = '#1D3557';
      ctx.fill();
    }
  }
}

function limpar() {
  var canvas = document.getElementById("quadro");
  var ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Função que processa os resultados da detecção de mãos
function onResults(results)
{
  canvasCtx.save();
  // Limpa o canvas

  // Desenha a imagem da câmera no canvas
  canvasCtx.drawImage( results.image, 0, 0, canvasElement.width, canvasElement.height );
  if (results.multiHandLandmarks)
    {
      for (const landmarks of results.multiHandLandmarks)
      {
        drawLandmarks(canvasCtx, [landmarks[8]], {color: '#E63946', lineWidth: 1});
      }
    }
  // Desenha as landmarks das mãos no canvasQuadro
  drawHandLandmarks(results, canvasQuadro.getContext('2d'));
  
  canvasCtx.restore();
}

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





// Configura o detector de mãos do MediaPipe Hands
const hands = new Hands({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
}});

hands.setOptions({
  selfieMode: true,
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.9,
  minTrackingConfidence: 0.9
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
