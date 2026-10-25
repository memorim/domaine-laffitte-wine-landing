const wines = [
  {
    id: 'white',
    name: 'Colombard Sauvignon',
    display: 'Colombard<br>&amp; Sauvignon',
    kind: 'WHITE WINE',
    price: 138,
    image: 'colombard-sauvignon.png',
    bounds: [4, 7, 199, 729],
  },
  {
    id: 'red',
    name: 'Malbec',
    display: 'Malbec',
    kind: 'RED WINE',
    price: 135,
    image: 'malbec.png',
    bounds: [19, 53, 186, 698],
  },
  {
    id: 'rose',
    name: 'Rosé',
    display: 'Rosé',
    kind: 'ROSÉ WINE',
    price: 149,
    image: 'rose.png',
    bounds: [15, 17, 208, 736],
  },
];
const $ = (selector) => document.querySelector(selector);
const dialog = $('#collection-dialog');
const menu = $('.menu-button');
const storageKey = 'domaine-laffitte-selection-v1';
let current = 0;
let selection = {};
let toastTimer;

// Storage may be blocked or edited: only known wine IDs and bounded counts survive.
try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
  for (const wine of wines) {
    if (Number.isInteger(saved?.[wine.id]) && saved[wine.id] > 0 && saved[wine.id] <= 99)
      selection[wine.id] = saved[wine.id];
  }
} catch {
  /* The collection still works in memory when storage is unavailable. */
}

function bottle(container, wine) {
  const [left, top, right, bottom] = wine.bounds;
  const width = right - left;
  const height = bottom - top;
  // Calibrate transparent padding from the exported PNG alpha bounds, not its canvas.
  container.style.cssText = `--bottle-ratio:${width} / ${height};--raster-width:${(218 / width) * 100}%;--raster-height:${(742 / height) * 100}%;--raster-left:${(-left / width) * 100}%;--raster-top:${(-top / height) * 100}%`;
  let image = container.querySelector('img');
  if (!image) {
    image = document.createElement('img');
    image.width = 218;
    image.height = 742;
    image.draggable = false;
    container.append(image);
  }
  image.src = `assets/${wine.image}`;
  image.alt =
    container.getAttribute('aria-hidden') === 'true'
      ? ''
      : `Domaine Laffitte ${wine.name} wine bottle`;
}

function showWine(index) {
  current = (index + wines.length) % wines.length;
  const wine = wines[current];
  document.body.dataset.wine = wine.id;
  bottle($('.bottle-current'), wine);
  bottle($('.bottle-preview'), wines[(current + 1) % wines.length]);
  $('.wine-name').innerHTML = wine.display; // Fixed, local copy; never user content.
  $('.wine-kind').textContent = `0${current + 1} / ${wine.kind}`;
  $('.wine-price').textContent = `€${wine.price}`;
  $('.current-number').textContent = `0${current + 1}`;
  $('.index-line').style.setProperty('--index-offset', `${(current * 100) / 3}%`);
  $('.add-button').setAttribute('aria-label', `Add ${wine.name} to your selection`);
  document
    .querySelectorAll('.wine-selector')
    .forEach((button) =>
      button.setAttribute('aria-pressed', String(button.dataset.select === wine.id)),
    );
  const activeBottle = $('.bottle-current');
  activeBottle.classList.remove('changing');
  // One short transition; rapid clicks cancel the previous animation without delaying input.
  requestAnimationFrame(() => activeBottle.classList.add('changing'));
}

function updateCollection() {
  const list = $('.collection-items');
  list.replaceChildren();
  let total = 0;
  let count = 0;
  for (const wine of wines) {
    const quantity = selection[wine.id] || 0;
    if (!quantity) continue;
    count += quantity;
    total += quantity * wine.price;
    const item = document.createElement('li');
    const text = document.createElement('div');
    const heading = document.createElement('h3');
    heading.textContent = wine.name;
    const detail = document.createElement('p');
    detail.textContent = `${quantity} × €${wine.price} · €${quantity * wine.price}`;
    text.append(heading, detail);
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'remove-item';
    remove.textContent = 'Remove';
    remove.setAttribute('aria-label', `Remove ${wine.name} from selection`);
    remove.addEventListener('click', () => {
      delete selection[wine.id];
      updateCollection();
      notify(`${wine.name} removed`);
      $('.close-dialog').focus();
    });
    item.append(text, remove);
    list.append(item);
  }
  $('.collection-count').textContent = count;
  $('.collection-button').setAttribute(
    'aria-label',
    `Open your selection, ${count} ${count === 1 ? 'bottle' : 'bottles'}`,
  );
  $('.collection-empty').hidden = count > 0;
  $('.collection-summary').hidden = count === 0;
  $('.collection-total').textContent = `€${total}`;
  try {
    localStorage.setItem(storageKey, JSON.stringify(selection));
  } catch {
    /* Keep the usable in-memory selection. */
  }
}

function notify(message) {
  clearTimeout(toastTimer);
  $('.toast').textContent = message;
  $('.toast').classList.add('visible');
  toastTimer = setTimeout(() => $('.toast').classList.remove('visible'), 2600);
}

$('.next-button').addEventListener('click', () => showWine(current + 1));
document
  .querySelectorAll('.wine-selector')
  .forEach((button) =>
    button.addEventListener('click', () =>
      showWine(wines.findIndex((wine) => wine.id === button.dataset.select)),
    ),
  );
$('.hero').addEventListener('keydown', (event) => {
  if (
    !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key) ||
    !event.target.closest('.wine-selectors, .next-button')
  )
    return;
  event.preventDefault();
  showWine(
    event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? wines.length - 1
        : current + (event.key === 'ArrowRight' ? 1 : -1),
  );
});
$('.add-button').addEventListener('click', () => {
  const wine = wines[current];
  if ((selection[wine.id] || 0) >= 99) return notify('You have reached 99 bottles of this wine.');
  selection[wine.id] = (selection[wine.id] || 0) + 1;
  updateCollection();
  notify(`${wine.name} added to your selection`);
});
$('.collection-button').addEventListener('click', () => dialog.showModal());
$('.close-dialog').addEventListener('click', () => dialog.close());
$('.continue-button').addEventListener('click', () => dialog.close());
// Safari does not always focus a button clicked with a mouse before showModal().
dialog.addEventListener('close', () => $('.collection-button').focus());
dialog.addEventListener('click', (event) => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  )
    dialog.close();
});
function closeMenu() {
  $('.navigation').classList.remove('open');
  menu.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-label', 'Open navigation');
}
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  $('.navigation').classList.toggle('open', open);
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  if (open) $('.navigation a').focus();
});
document
  .querySelectorAll('.navigation a')
  .forEach((link) => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menu.focus();
  }
});
// Preload the remaining two small local images before the first carousel interaction.
for (const wine of wines.slice(1)) {
  const image = new Image();
  image.src = `assets/${wine.image}`;
}
showWine(0);
updateCollection();
