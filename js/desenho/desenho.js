// ----- DOM Elements Module -----
const DOMElements = (() => {
    return {
      videoElement: document.getElementsByClassName('input_video')[0],
      canvasElement: document.getElementsByClassName('output_canvas')[0],
      canvasQuadro: document.getElementById('quadro'),
      getCanvasCtx: function () { return this.canvasElement.getContext('2d'); },
      getCanvasQuadroCtx: function () { return this.canvasQuadro.getContext('2d'); }
    };
  })();
  
  // ----- Drawing Module -----
  const Drawing = (() => {
    let desenhando = false;
    let x, y;
  
    return {
      drawHandLandmarks: function (results, ctx) {
        if (results.multiHandLandmarks) {
          for (const landmarks of results.multiHandLandmarks) {
            const landmark = landmarks[4];
            ctx.beginPath();
            ctx.arc(landmark.x * DOMElements.canvasQuadro.width, landmark.y * DOMElements.canvasQuadro.height, 5, 0, 2 * Math.PI);
            ctx.fillStyle = '#1D3557';
            ctx.fill();
          }
        }
      },
      clearCanvas: function (canvas, context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
      },
      handleMouseMove: function (evt) {
        if (desenhando) {
          const ctx = DOMElements.getCanvasQuadroCtx();
          ctx.beginPath();
          ctx.moveTo(x, y);
          x = evt.clientX - DOMElements.canvasQuadro.getBoundingClientRect().left;
          y = evt.clientY - DOMElements.canvasQuadro.getBoundingClientRect().top;
          ctx.lineTo(x, y);
          ctx.stroke();
        }
      },
      handleMouseUp: function (evt) {
        desenhando = true;
        x = evt.clientX - DOMElements.canvasQuadro.getBoundingClientRect().left;
        y = evt.clientY - DOMElements.canvasQuadro.getBoundingClientRect().top;
      }
    };
  })();
  
  // ----- Hand Tracking Module -----
  const HandTracking = (() => {
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
  
    return {
      onResults: function (results) {
        const canvasCtx = DOMElements.getCanvasCtx();
        canvasCtx.save();
        Drawing.clearCanvas(DOMElements.canvasElement, canvasCtx);
        canvasCtx.drawImage(results.image, 0, 0, DOMElements.canvasElement.width, DOMElements.canvasElement.height);
  
        if (results.multiHandLandmarks) {
          for (const landmarks of results.multiHandLandmarks) {
            drawLandmarks(canvasCtx, [landmarks[8]], { color: '#E63946', lineWidth: 1 });
            const indexFinger = landmarks[8];
            const handOpen = indexFinger.y < landmarks[5].y;
            const ctx = DOMElements.getCanvasQuadroCtx();
  
            if (handOpen) {
              ctx.strokeStyle = '#1D3557';
              ctx.lineWidth = 5;
              ctx.lineCap = 'round';
            } else {
              ctx.strokeStyle = '#f5f5f5';
              ctx.lineWidth = 5;
              ctx.lineCap = 'round';
            }
  
            ctx.beginPath();
            ctx.moveTo(indexFinger.x * DOMElements.canvasQuadro.width, indexFinger.y * DOMElements.canvasQuadro.height);
            ctx.lineTo(landmarks[7].x * DOMElements.canvasQuadro.width, landmarks[7].y * DOMElements.canvasQuadro.height);
            ctx.stroke();
          }
        }
        canvasCtx.restore();
      },
      initialize: function () {
        hands.onResults(this.onResults);
  
        const camera = new Camera(DOMElements.videoElement, {
          onFrame: async () => {
            await hands.send({ image: DOMElements.videoElement });
          },
          width: 1024,
          height: 768
        });
  
        camera.start();
      }
    };
  })();
  
  // ----- Event Listeners Module -----
  const EventListeners = (() => {
    return {
      setup: function () {
        DOMElements.canvasQuadro.addEventListener("mouseup", Drawing.handleMouseUp);
        DOMElements.canvasQuadro.addEventListener("mousemove", Drawing.handleMouseMove);
      }
    };
  })();
  
  // ----- Initialization -----
  (function initialize() {
    HandTracking.initialize();
    EventListeners.setup();
  })();
  