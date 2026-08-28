const sourceText = document.querySelector('#source-text');
const imagesInput = document.querySelector('#images');
const previewGrid = document.querySelector('#preview-grid');
const generateButton = document.querySelector('#generate-button');
const cardsContainer = document.querySelector('#cards-container');
const reviewBox = document.querySelector('#review-box');
const exportButton = document.querySelector('#export-button');
const materialForm = document.querySelector('#material-form');

let uploadedImages = [];
let cards = [];

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function extractKeywords(text) {
  return text
    .replace(/[^a-zA-Z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 5)
    .slice(0, 8);
}

function buildFallbackCards(text, imageCount) {
  const cleanText = text.trim().replace(/\s+/g, ' ');
  const firstSentence = cleanText.split(/[.!?]/).find(Boolean)?.trim() || 'the provided material';
  const generated = [
    {
      id: crypto.randomUUID(),
      front: `What is the key idea in: "${firstSentence.slice(0, 90)}${firstSentence.length > 90 ? '…' : ''}"?`,
      back: firstSentence,
      source: 'Text summary',
      confidence: cleanText.length > 120 ? 'medium' : 'low',
    },
  ];

  extractKeywords(cleanText).slice(0, 3).forEach((keyword) => {
    generated.push({
      id: crypto.randomUUID(),
      front: `How does "${keyword}" relate to the provided material?`,
      back: `Review the source and explain the role of ${keyword} in one short sentence.`,
      source: 'Keyword extraction',
      confidence: 'needs review',
    });
  });

  if (imageCount > 0) {
    generated.push({
      id: crypto.randomUUID(),
      front: 'What important visual detail should be remembered from the uploaded image?',
      back: 'Use the image preview to verify the visual detail before exporting this card.',
      source: 'Image prompt',
      confidence: 'needs review',
    });
  }

  return generated;
}

function reviewCards() {
  const issues = [];
  if (sourceText.value.trim().length < 60) issues.push('Add more source text for stronger factual grounding.');
  if (cards.some((card) => card.back.length > 180)) issues.push('Some answers may be too long for efficient recall.');
  if (uploadedImages.length > 0 && !cards.some((card) => card.source.toLowerCase().includes('image'))) {
    issues.push('Uploaded images are present but no image-focused card was generated.');
  }
  if (cards.some((card) => /review|verify|source/i.test(card.back))) {
    issues.push('At least one card needs human verification before export.');
  }
  return issues;
}

function renderPreviews() {
  previewGrid.innerHTML = '';
  uploadedImages.forEach((file) => {
    const figure = document.createElement('figure');
    figure.innerHTML = `<img src="${URL.createObjectURL(file)}" alt="${escapeHtml(file.name)}"><figcaption>${escapeHtml(file.name)}</figcaption>`;
    previewGrid.appendChild(figure);
  });
}

function renderCards() {
  cardsContainer.className = cards.length ? 'cards-list' : 'empty-state';
  cardsContainer.innerHTML = cards.length ? '' : 'Generated cards will appear here for editing and verification.';

  cards.forEach((card, index) => {
    const article = document.createElement('article');
    article.className = 'anki-card';
    article.innerHTML = `
      <div class="card-meta"><span>Card ${index + 1}</span><em>${escapeHtml(card.confidence)}</em></div>
      <label for="front-${card.id}">Front</label>
      <input id="front-${card.id}" value="${escapeHtml(card.front)}">
      <label for="back-${card.id}">Back</label>
      <textarea id="back-${card.id}">${escapeHtml(card.back)}</textarea>
      <small>Source: ${escapeHtml(card.source)}</small>
    `;
    article.querySelector('input').addEventListener('input', (event) => {
      card.front = event.target.value;
      renderReview();
    });
    article.querySelector('textarea').addEventListener('input', (event) => {
      card.back = event.target.value;
      renderReview();
    });
    cardsContainer.appendChild(article);
  });
}

function renderReview() {
  const issues = reviewCards();
  reviewBox.className = issues.length ? 'review-warnings' : 'review-ok';
  reviewBox.innerHTML = `<h3>${issues.length ? 'Needs attention' : 'Ready for human review'}</h3>`;
  if (issues.length) {
    issues.forEach((issue) => reviewBox.insertAdjacentHTML('beforeend', `<p>⚠️ ${escapeHtml(issue)}</p>`));
  } else {
    reviewBox.insertAdjacentHTML('beforeend', '<p>No automatic issues detected.</p>');
  }
  reviewBox.appendChild(exportButton);
  exportButton.disabled = cards.length === 0;
}

function toTsv() {
  return cards.map((card) => `${card.front.replaceAll('\t', ' ')}\t${card.back.replaceAll('\t', ' ')}`).join('\n');
}

function refreshGenerateState() {
  generateButton.disabled = !sourceText.value.trim() && uploadedImages.length === 0;
}

sourceText.addEventListener('input', refreshGenerateState);
imagesInput.addEventListener('change', (event) => {
  uploadedImages = Array.from(event.target.files || []);
  renderPreviews();
  refreshGenerateState();
});

materialForm.addEventListener('submit', (event) => {
  event.preventDefault();
  generateButton.textContent = 'Summarizing…';
  window.setTimeout(() => {
    cards = buildFallbackCards(sourceText.value, uploadedImages.length);
    renderCards();
    renderReview();
    generateButton.textContent = 'Generate Anki cards';
  }, 500);
});

exportButton.addEventListener('click', () => {
  const blob = new Blob([toTsv()], { type: 'text/tab-separated-values' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'anki-cards.tsv';
  anchor.click();
  URL.revokeObjectURL(url);
});
