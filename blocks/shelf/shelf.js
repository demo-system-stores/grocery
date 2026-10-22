import { createOptimizedPicture } from '../../scripts/aem.js';

const EDGE_RATIO = 0.2;
const MAX_SPEED = 14;

function updateEdges(block, list) {
  const maxScroll = list.scrollWidth - list.clientWidth;
  block.classList.toggle('shelf-can-scroll-left', list.scrollLeft > 1);
  block.classList.toggle('shelf-can-scroll-right', list.scrollLeft < maxScroll - 1);
}

function enableEdgeScroll(list) {
  let speed = 0;
  let frame = null;

  const tick = () => {
    if (!speed) {
      frame = null;
      return;
    }
    list.scrollLeft += speed;
    frame = requestAnimationFrame(tick);
  };

  list.addEventListener('mousemove', (event) => {
    const { left, width } = list.getBoundingClientRect();
    const x = (event.clientX - left) / width;
    if (x < EDGE_RATIO) {
      speed = -Math.ceil(((EDGE_RATIO - x) / EDGE_RATIO) * MAX_SPEED);
    } else if (x > 1 - EDGE_RATIO) {
      speed = Math.ceil(((x - (1 - EDGE_RATIO)) / EDGE_RATIO) * MAX_SPEED);
    } else {
      speed = 0;
    }
    if (speed && !frame) frame = requestAnimationFrame(tick);
  });

  list.addEventListener('mouseleave', () => {
    speed = 0;
  });
}

export default function decorate(block) {
  const list = document.createElement('ul');
  [...block.children].forEach((row) => {
    const item = document.createElement('li');
    while (row.firstElementChild) item.append(row.firstElementChild);
    [...item.children].forEach((div) => {
      div.className = div.children.length === 1 && div.querySelector('picture')
        ? 'shelf-item-image'
        : 'shelf-item-body';
    });
    list.append(item);
  });
  list.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '500' }])));
  block.replaceChildren(list);

  const refresh = () => updateEdges(block, list);
  list.addEventListener('scroll', refresh, { passive: true });
  new ResizeObserver(refresh).observe(list);
  list.querySelectorAll('img').forEach((img) => img.addEventListener('load', refresh));
  refresh();

  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) enableEdgeScroll(list);
}
