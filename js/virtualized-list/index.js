class VirtualizedList extends HTMLElement {
  customAttributes;
  viewportItemsLength = 20;
  lastRepaintY;

  constructor() {
    super();
    this.customAttributes = new Map([['h', 800], ['w', 720], ['item-size', 40], ['item-count', 200]]);
    this.attachShadow({ mode: 'open' });
  }

  get itemSize() {
    return this.customAttributes.get('item-size');
  }
  get itemCount() {
    return this.customAttributes.get('item-count');
  }
  get w() {
    return this.customAttributes.get('w');
  }
  get h() {
    return this.customAttributes.get('h');
  }

  // 들어온 값을 map에 저장 후, 렌더된 돔에 이쁘게 보이도록 어트리뷰트를 삭제해준다.
  setCustomAttributes() {
    const attributes = {
      h: this.getAttribute('h'),
      w: this.getAttribute('w'),
      'item-size': Number(this.getAttribute('item-size')),
      'item-count': Number(this.getAttribute('item-count')),
    };
    for(let attrName of this.customAttributes.keys()){
      if(attributes[attrName]){
        this.removeAttribute(attrName);
        this.customAttributes.set(attrName, attributes[attrName]);
      }
    }
  }

  // children을 생성한다
  getVisibleChildren({startIndex = 1, count = 20}) {
    const itemTemplate = document.querySelector('template#item');
    const length = startIndex + count > this.itemCount? this.itemCount - startIndex + 1 : count;
    return Array.from({ length }, (_,i) => i + startIndex).map((i) => {
      const clone = document.importNode(itemTemplate.content, true);
      const item = clone.querySelector('.item');
      item.style.top = `${(i - 1) * this.itemSize}px`;
      const button = item.querySelector('button');
      button.textContent = button.textContent.replace('[[index]]', i)
      return item.outerHTML;
    }).join('\n');
  }

  // 최초 렌더 
  render(children) {
    const width = String(this.w).includes('%')? this.w : `${this.w}px`;
    const height = String(this.h).includes('%')? this.h : `${this.h}px`;
    const totalHeight = this.itemSize * this.itemCount;
    let html = `<style>.list-wrap { width: ${width}; height: ${height}; position: relative; overflow: auto; will-change: transform; background-color: rgb(18,18,18); }
.item-wrap { width: 100%; height: ${totalHeight}px; }
.item { position: absolute; width: 100%; }
.item > button { height: ${this.itemSize}px; padding: 0 15px; background-color: transparent; cursor: pointer; outline: 0; border: 0; margin: 0; border-radius: 0; display: flex; align-items:center; width: 100%; transition: background-color 150ms cubic-bezier(.4, 0 .2, 1) 0ms; color: white; }
.item > button:hover { background-color: rgba(255, 255, 255, 0.08); }
      </style>`;
    html += `<div class="list-wrap"><div class="item-wrap">${children}</div></div>`;
    const moduleTemplate = document.createElement('template');
    moduleTemplate.innerHTML = html;
    const instance = moduleTemplate.content.cloneNode(true);
    // wrapper에 scroll event 추가
    instance.querySelector('.list-wrap').addEventListener("scroll", (e) => {
      const scrollTop = e.target.scrollTop;
      const first = Math.round(scrollTop / this.itemSize) - this.viewportItemsLength;
      if(!this.lastRepaintY || Math.abs(scrollTop - this.lastRepaintY) > (this.viewportItemsLength * this.itemSize)) {
        const children = this.getVisibleChildren({startIndex: first < 0 ? 0 : first, count: this.viewportItemsLength * 3});     
        this.reRender(children);
        this.lastRepaintY = scrollTop;
      }
      e?.preventDefault();
    });
    this.shadowRoot.innerHTML = '';
    this.shadowRoot.appendChild(instance);
  }

  // 재 렌더할 때에는 render의 과정을 반복할 필요 없이 wrapper 내부만 변경
  reRender(children) {
    const itemWrap = this.shadowRoot.querySelector('.item-wrap');
    itemWrap.innerHTML = children;
  }

  connectedCallback() {
    this.setCustomAttributes();

    if(!this.rendered) {
      const cachedItemsLength = this.viewportItemsLength * 3;
      const children = this.getVisibleChildren({startIndex: 1, count: cachedItemsLength / 2})
      this.render(children);
      this.rendered = true;
    }
  }

  static get observedAttributes() {
    return ['h', 'w', 'item-size', 'item-count'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    this.customAttributes.set(name, newValue);
    if(['h', 'item-size'].includes(name) && newValue) {
      this.viewportItemsLength = Math.ceil(this.customAttributes.get('h') / this.itemSize)
    }
  }
}
window.customElements.define('v-list', VirtualizedList);

