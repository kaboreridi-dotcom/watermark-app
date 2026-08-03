document.addEventListener('DOMContentLoaded', () => {
  // Éléments du DOM

  // --- GESTION DU THÈME (CLAIR / SOMBRE) ---
const themeToggleBtn = document.getElementById('themeToggleBtn');
const iconMoon = themeToggleBtn.querySelector('.icon-moon');
const iconSun = themeToggleBtn.querySelector('.icon-sun');

// Détection de la préférence enregistrée ou système
const savedTheme = localStorage.getItem('theme');
const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;

const initialTheme = savedTheme || (systemPrefersLight ? 'light' : 'dark');
applyTheme(initialTheme);

themeToggleBtn.addEventListener('click', () => {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
});

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);

  if (theme === 'light') {
    iconMoon.classList.add('hidden');
    iconSun.classList.remove('hidden');
  } else {
    iconSun.classList.add('hidden');
    iconMoon.classList.remove('hidden');
  }
}

  const mediaInput = document.getElementById('mediaInput');
  const mediaFileName = document.getElementById('mediaFileName');
  const watermarkText = document.getElementById('watermarkText');
  const textColor = document.getElementById('textColor');
  const textSize = document.getElementById('textSize');
  const watermarkImageInput = document.getElementById('watermarkImageInput');
  const watermarkImageName = document.getElementById('watermarkImageName');
  const imageScale = document.getElementById('imageScale');
  const opacityInput = document.getElementById('opacity');
  const opacityVal = document.getElementById('opacityVal');
  const marginInput = document.getElementById('margin');
  const canvas = document.getElementById('previewCanvas');
  const ctx = canvas.getContext('2d');
  const placeholderText = document.getElementById('placeholderText');
  const downloadBtn = document.getElementById('downloadBtn');
  const statusBadge = document.getElementById('statusBadge');
  const progressContainer = document.getElementById('progressContainer');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');

  // État de l'application
  let mediaType = null; // 'image' ou 'video'
  let mediaElement = null; // Image ou HTMLVideoElement
  let watermarkType = 'text'; // 'text' ou 'image'
  let watermarkImgElement = null;
  let selectedPosition = 'center';
  let animationFrameId = null;

  // Gestion des onglets (Texte / Image)
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      e.target.classList.add('active');
      
      watermarkType = e.target.dataset.type;
      document.getElementById(`${watermarkType}Controls`).classList.add('active');
      requestRender();
    });
  });

  // Gestion de la sélection de position
  document.querySelectorAll('.pos-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.pos-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      selectedPosition = e.target.dataset.pos;
      requestRender();
    });
  });

  // Événements d'entrée utilisateur
  opacityInput.addEventListener('input', (e) => {
    opacityVal.textContent = e.target.value;
    requestRender();
  });

  [watermarkText, textColor, textSize, imageScale, marginInput].forEach(elem => {
    elem.addEventListener('input', requestRender);
  });

  // Charger l'image en filigrane
  watermarkImageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      watermarkImageName.textContent = file.name;
      const img = new Image();
      img.onload = () => {
        watermarkImgElement = img;
        requestRender();
      };
      img.src = URL.createObjectURL(file);
    }
  });

  // Charger le fichier media (Image ou Vidéo)
  mediaInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    mediaFileName.textContent = file.name;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);

    if (file.type.startsWith('image/')) {
      mediaType = 'image';
      statusBadge.textContent = 'Image chargée';
      const img = new Image();
      img.onload = () => {
        mediaElement = img;
        canvas.width = img.width;
        canvas.height = img.height;
        placeholderText.classList.add('hidden');
        downloadBtn.disabled = false;
        requestRender();
      };
      img.src = URL.createObjectURL(file);
    } else if (file.type.startsWith('video/')) {
      mediaType = 'video';
      statusBadge.textContent = 'Vidéo chargée';
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.play();
      
      video.onloadedmetadata = () => {
        mediaElement = video;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        placeholderText.classList.add('hidden');
        downloadBtn.disabled = false;
        renderVideoLoop();
      };
    }
  });

  function requestRender() {
    if (mediaType === 'image' && mediaElement) {
      drawCanvas();
    }
  }

  function renderVideoLoop() {
    if (mediaType === 'video' && mediaElement) {
      drawCanvas();
      animationFrameId = requestAnimationFrame(renderVideoLoop);
    }
  }

  // Moteur de rendu principal sur Canvas
  function drawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 1. Dessiner le fichier source
    ctx.drawImage(mediaElement, 0, 0, canvas.width, canvas.height);

    // 2. Préparer l'opacité
    const opacity = parseFloat(opacityInput.value) / 100;
    ctx.globalAlpha = opacity;

    const margin = parseInt(marginInput.value, 10);

    // 3. Dessiner le filigrane (Texte ou Image)
    if (watermarkType === 'text') {
      const text = watermarkText.value;
      const size = parseInt(textSize.value, 10);
      ctx.font = `bold ${size}px Inter, sans-serif`;
      ctx.fillStyle = textColor.value;

      const textMetrics = ctx.measureText(text);
      const textWidth = textMetrics.width;
      const textHeight = size;

      let { x, y } = getPositionCoordinates(textWidth, textHeight, margin, true);
      ctx.fillText(text, x, y);

    } else if (watermarkType === 'image' && watermarkImgElement) {
      const scale = parseFloat(imageScale.value) / 100;
      const wmWidth = canvas.width * scale;
      const wmHeight = (watermarkImgElement.height / watermarkImgElement.width) * wmWidth;

      let { x, y } = getPositionCoordinates(wmWidth, wmHeight, margin, false);
      ctx.drawImage(watermarkImgElement, x, y, wmWidth, wmHeight);
    }

    ctx.globalAlpha = 1.0;
  }

  // Calcul des coordonnées selon la grille 9 points
  function getPositionCoordinates(width, height, margin, isText = false) {
    let x = margin;
    let y = margin;
    const canvasW = canvas.width;
    const canvasH = canvas.height;

    switch (selectedPosition) {
      case 'top-left':
        x = margin;
        y = isText ? margin + height : margin;
        break;
      case 'top-center':
        x = (canvasW - width) / 2;
        y = isText ? margin + height : margin;
        break;
      case 'top-right':
        x = canvasW - width - margin;
        y = isText ? margin + height : margin;
        break;
      case 'center-left':
        x = margin;
        y = isText ? (canvasH + height) / 2 : (canvasH - height) / 2;
        break;
      case 'center':
        x = (canvasW - width) / 2;
        y = isText ? (canvasH + height) / 2 : (canvasH - height) / 2;
        break;
      case 'center-right':
        x = canvasW - width - margin;
        y = isText ? (canvasH + height) / 2 : (canvasH - height) / 2;
        break;
      case 'bottom-left':
        x = margin;
        y = isText ? canvasH - margin : canvasH - height - margin;
        break;
      case 'bottom-center':
        x = (canvasW - width) / 2;
        y = isText ? canvasH - margin : canvasH - height - margin;
        break;
      case 'bottom-right':
        x = canvasW - width - margin;
        y = isText ? canvasH - margin : canvasH - height - margin;
        break;
    }
    return { x, y };
  }

  // Exportation du fichier
  downloadBtn.addEventListener('click', async () => {
    if (mediaType === 'image') {
      const link = document.createElement('a');
      link.download = `watermark_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } else if (mediaType === 'video') {
      exportVideo();
    }
  });

  // Enregistrement du Canvas pour l'export Vidéo
  function exportVideo() {
  downloadBtn.disabled = true;
  progressContainer.classList.remove('hidden');
  
  // 1. Désactiver la boucle pour permettre la détection de la fin
  const wasLooping = mediaElement.loop;
  mediaElement.loop = false;
  
  const stream = canvas.captureStream(30);
  
  if (mediaElement.captureStream) {
    const audioStream = mediaElement.captureStream();
    const audioTracks = audioStream.getAudioTracks();
    if (audioTracks.length > 0) stream.addTrack(audioTracks[0]);
  }

  const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
  const chunks = [];

  mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
  
  mediaRecorder.onstop = () => {
    const blob = new Blob(chunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `watermark_${Date.now()}.webm`;
    a.click();
    
    // Réactiver la lecture en boucle pour l'aperçu
    mediaElement.loop = wasLooping;
    mediaElement.play();

    downloadBtn.disabled = false;
    progressContainer.classList.add('hidden');
    progressBar.style.width = '0%';
  };

  // Réinitialiser la vidéo au début
  mediaElement.currentTime = 0;
  mediaElement.play();
  mediaRecorder.start();

  // Mettre à jour la barre de progression
  mediaElement.ontimeupdate = () => {
    if (!mediaElement.duration) return;
    const percent = Math.min((mediaElement.currentTime / mediaElement.duration) * 100, 100);
    progressBar.style.width = `${percent}%`;
    progressText.textContent = `Traitement vidéo : ${Math.round(percent)}%`;
  };

  // Stop automatique à la fin de la vidéo
  mediaElement.onended = () => {
    if (mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    mediaElement.ontimeupdate = null;
    mediaElement.onended = null;
  };
}
  
});
