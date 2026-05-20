const dropZone   = document.getElementById('drop-zone');
const fileInput  = document.getElementById('file-input');
const fileInfo   = document.getElementById('file-info');
const analyzeBtn = document.getElementById('analyze-btn');
const progress   = document.getElementById('progress');
const results    = document.getElementById('results');
const errorBox   = document.getElementById('error');

let selectedFile = null;

// === Drag & Drop ===
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', e => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', e => {
  if (e.target.files.length) handleFile(e.target.files[0]);
});

function handleFile(file) {
  if (!file.type.startsWith('video/')) {
    showError('Please upload a video file.');
    return;
  }
  selectedFile = file;
  const sizeMB = (file.size / 1024 / 1024).toFixed(2);
  fileInfo.textContent = `📁 ${file.name} (${sizeMB} MB)`;
  fileInfo.classList.remove('hidden');
  analyzeBtn.disabled = false;
  hideError();
  results.classList.add('hidden');
}

// === Analyze ===
analyzeBtn.addEventListener('click', async () => {
  if (!selectedFile) return;

  hideError();
  results.classList.add('hidden');
  progress.classList.remove('hidden');
  analyzeBtn.disabled = true;

  const formData = new FormData();
  formData.append('file', selectedFile);

  try {
    const res = await fetch('/predict', { method: 'POST', body: formData });
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    const data = await res.json();
    renderResults(data);
  } catch (err) {
    showError(`Analysis failed: ${err.message}`);
  } finally {
    progress.classList.add('hidden');
    analyzeBtn.disabled = false;
  }
});

// === Render Results ===
function renderResults(data) {
  results.classList.remove('hidden');

  const verdict     = data.final_verdict;
  const confidence  = data.final_confidence;
  const isFake      = verdict === 'FAKE';

  // Verdict card
  const verdictCard = document.getElementById('verdict-card');
  const verdictText = document.getElementById('verdict-text');
  const verdictBar  = document.getElementById('verdict-bar');

  verdictText.textContent = isFake ? '⚠️ FAKE' : '✅ REAL';
  verdictText.className = `text-6xl font-black mb-4 ${isFake ? 'text-red-500' : 'text-green-400'}`;
  verdictCard.className = `rounded-2xl p-8 text-center border-2 ${
    isFake ? 'border-red-500 verdict-fake bg-red-950/20'
           : 'border-green-500 verdict-real bg-green-950/20'
  }`;
  document.getElementById('verdict-confidence').textContent = `${confidence.toFixed(2)}%`;

  setTimeout(() => {
    verdictBar.style.width = `${confidence}%`;
    verdictBar.className = `h-3 transition-all duration-1000 ${isFake ? 'bg-red-500' : 'bg-green-500'}`;
  }, 100);

  // Visual
  renderModel('visual', data.visual);
  renderModel('audio',  data.audio);

  // Meta
  document.getElementById('proc-time').textContent = data.processing_time_sec?.toFixed(2) ?? '—';
  document.getElementById('raw-json').textContent  = JSON.stringify(data, null, 2);

  results.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderModel(key, model) {
  if (!model) return;
  const fakeScore = model.fake_score ?? (model.verdict === 'FAKE' ? model.confidence : 100 - model.confidence);
  const badge = document.getElementById(`${key}-verdict`);
  badge.textContent = model.verdict;
  badge.className = `px-3 py-1 rounded-full text-sm font-bold ${
    model.verdict === 'FAKE' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
  }`;
  document.getElementById(`${key}-score`).textContent = `${fakeScore.toFixed(2)}%`;
  setTimeout(() => {
    document.getElementById(`${key}-bar`).style.width = `${fakeScore}%`;
  }, 200);
}

function showError(msg) {
  errorBox.textContent = '❌ ' + msg;
  errorBox.classList.remove('hidden');
}
function hideError() { errorBox.classList.add('hidden'); }