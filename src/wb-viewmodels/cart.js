import { readAttr } from '../core/read-attr.js';
/**
 * Cart Behavior
 * -----------------------------------------------------------------------------
 * A shopping cart that remembers what was added: a count you can see, and a
 * list you can open, check and change.
 * CSS: src/styles/behaviors/cart.css
 * Zero inline styles.
 *
 * Helper Attribute: [x-cart]
 * -----------------------------------------------------------------------------
 *
 * #463 -- John: "we need to support add to cart clicks." x-cardproduct's Add to
 * Cart button fired `wb:cardproduct:addtocart` and nothing on the site listened,
 * so every click was forgotten the moment it happened.
 *
 * Put <div x-cart></div> anywhere on the page. From then on:
 *   - every Add to Cart click on the page lands in the cart; adding the same
 *     product again raises its quantity instead of listing it twice;
 *   - the cart shows how many items it holds, and opens to list them with a
 *     remove button each, the total, and Clear;
 *   - the cart is kept in localStorage, so it survives a reload, and every
 *     x-cart on the page (or in another tab) shows the same contents.
 *
 * Where the state lives: one store per storage key (`key`, default
 * "wb-cart"), held here in the module, not in each element. That is what
 * keeps two carts on one page from each adding the same click.
 *
 * Anything can add to it, not only product cards: dispatch
 * `wb:cardproduct:addtocart` with { title, price, id }, or call
 * element.wbCart.addItem({ title, price, id }).
 */

const DEFAULT_KEY = 'wb-cart';

/** key -> { items, carts:Set<element> } */
const stores = new Map();
let listening = false;

function load(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed.filter((i) => i && typeof i.title === 'string') : [];
  } catch {
    return [];
  }
}

function save(key, items) {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // Private mode or a full quota: the cart still works for this page view.
  }
}

/** "$1,049.50" -> 1049.5; anything without a number -> 0. */
function amountOf(price) {
  const n = parseFloat(String(price ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

/** The currency mark a price is written with ("$", "€"), so the total matches it. */
function markOf(items) {
  const first = items.find((i) => i.price);
  const m = first ? String(first.price).match(/^[^\d.\s-]+/) : null;
  return m ? m[0] : '';
}

/** One identity per product: its id when it has one, otherwise its title. */
function idOf(item) {
  return String(item.id || item.title);
}

function storeFor(key) {
  if (!stores.has(key)) stores.set(key, { items: load(key), carts: new Set() });
  return stores.get(key);
}

function commit(key) {
  const store = storeFor(key);
  save(key, store.items);
  store.carts.forEach((el) => render(el));
}

function add(key, item) {
  if (!item || !item.title) return;
  const store = storeFor(key);
  const id = idOf(item);
  const existing = store.items.find((i) => idOf(i) === id);
  if (existing) existing.qty += 1;
  else store.items.push({ id: item.id || '', title: String(item.title), price: item.price ? String(item.price) : '', qty: 1 });
  commit(key);
}

function remove(key, id) {
  const store = storeFor(key);
  store.items = store.items.filter((i) => idOf(i) !== id);
  commit(key);
}

function clear(key) {
  storeFor(key).items = [];
  commit(key);
}

/** One document listener for every cart, so a click is added once per store. */
function onAddToCart(e) {
  stores.forEach((store, key) => {
    if (store.carts.size) add(key, e.detail);
  });
}

/** Another tab changed the cart: show its contents here too. */
function onStorage(e) {
  if (!e.key || !stores.has(e.key)) return;
  const store = stores.get(e.key);
  store.items = load(e.key);
  store.carts.forEach((el) => render(el));
}

function part(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function render(element) {
  const key = element._wbCartKey;
  const { items } = storeFor(key);
  const count = items.reduce((n, i) => n + i.qty, 0);
  const total = items.reduce((n, i) => n + amountOf(i.price) * i.qty, 0);
  const mark = markOf(items);

  element.querySelector('.x-cart__count').textContent = String(count);
  element.querySelector('.x-cart__summary').setAttribute('aria-label', `Cart, ${count} item${count === 1 ? '' : 's'}`);
  element.classList.toggle('x-cart--empty', count === 0);

  const list = element.querySelector('.x-cart__items');
  list.replaceChildren(...items.map((item) => {
    const li = part('li', 'x-cart__item');
    li.dataset.cartId = idOf(item);
    li.append(
      part('span', 'x-cart__item-title', item.title),
      part('span', 'x-cart__item-qty', `× ${item.qty}`),
      part('span', 'x-cart__item-price', item.price),
    );
    const del = part('button', 'x-cart__remove', '✕');
    del.type = 'button';
    del.setAttribute('aria-label', `Remove ${item.title}`);
    del.addEventListener('click', () => remove(key, idOf(item)));
    li.append(del);
    return li;
  }));

  element.querySelector('.x-cart__empty').hidden = count > 0;
  element.querySelector('.x-cart__footer').hidden = count === 0;
  element.querySelector('.x-cart__total').textContent = `${mark}${total.toFixed(2)}`;

  element.dispatchEvent(new CustomEvent('wb:cart:change', {
    bubbles: true,
    detail: { items: items.map((i) => ({ ...i })), count, total },
  }));
}

export function cart(element, options = {}) {
  const key = String(options.key || readAttr(element, 'key', DEFAULT_KEY) || DEFAULT_KEY);
  element._wbCartKey = key;
  element.classList.add('x-cart');

  const details = part('details', 'x-cart__details');
  // The cart's own disclosure, not an x-details: auto-inject would otherwise
  // rewrite its <summary> into a text label and drop the count inside it.
  details.setAttribute('x-ignore', '');
  const summary = part('summary', 'x-cart__summary');
  summary.append(part('span', 'x-cart__icon', '🛒'), part('span', 'x-cart__count', '0'));
  const panel = part('div', 'x-cart__panel');
  const empty = part('p', 'x-cart__empty', 'Your cart is empty.');
  const list = part('ul', 'x-cart__items');
  const footer = part('div', 'x-cart__footer');
  const totalRow = part('span', 'x-cart__total-row', 'Total ');
  totalRow.append(part('strong', 'x-cart__total', '0.00'));
  const clearBtn = part('button', 'x-cart__clear', 'Clear');
  clearBtn.type = 'button';
  clearBtn.addEventListener('click', () => clear(key));
  footer.append(totalRow, clearBtn);
  panel.append(empty, list, footer);
  details.append(summary, panel);
  element.replaceChildren(details);

  storeFor(key).carts.add(element);
  if (!listening) {
    document.addEventListener('wb:cardproduct:addtocart', onAddToCart);
    window.addEventListener('storage', onStorage);
    listening = true;
  }

  // Canonical verbs (#782): typed add/remove, reset, typed getters.
  element.wbCart = {
    addItem: (item) => add(key, item),
    removeItem: (id) => remove(key, String(id)),
    reset: () => clear(key),
    getItems: () => storeFor(key).items.map((i) => ({ ...i })),
    getCount: () => storeFor(key).items.reduce((n, i) => n + i.qty, 0),
  };

  render(element);

  return () => {
    storeFor(key).carts.delete(element);
    element.classList.remove('x-cart', 'x-cart--empty');
    delete element.wbCart;
  };
}
