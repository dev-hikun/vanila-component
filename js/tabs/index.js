class TabList extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    const shadow = this.shadowRoot;
    const template = document.createElement('template');
    template.innerHTML = `
      <style>
        :host {
          display: flex;
          overflow: hidden;
          position: relative;
          border-bottom: 1px solid rgba(0,0,0,.12);
          font-family: Arial;
          background-color: white;
        }

        .indicator {
          position: absolute;
          display: block;
          height: 3px;
          bottom: 0;
          width: 0;
          left: 0;
          background-color: #1976d2;
          transition: all .3s cubic-bezier(0.4, 0, 0.2, 1) 0ms;
        }
      </style>
      <slot name="tab-buttons"></slot>
      <span class="indicator" />
    `;
    shadow.append(template.content.cloneNode(true));
  }
  
  get allTabItems() {
    return Array.from(this.querySelectorAll("tab-item"));
  }
  get tabItems() {
    return Array.from(this.querySelectorAll('tab-item:not([disabled])'));
  }

  get selectedTab() {
    return this.querySelector("tab-item[selected]");
  }
  get selectedIndex() {
    return this.tabItems.findIndex((tab) => tab.selected);
  }

  get indicator() {
    return this.shadowRoot.querySelector('.indicator');
  }

  initSelectedTab() {
    this.tabItems.length > 0 && (this.tabItems[0].selected = true);
  }

  connectedCallback() {
    this.index = Array.from(document.querySelectorAll('tab-list')).indexOf(this);
    this.setAttribute('id', `tab-list-${this.index + 1}`);
    this.setAttribute('role', 'tablist');
    
    // connected 된 순간에는 자식이 render되지 않아 없음.
    setTimeout(() => {
      this.allTabItems.forEach((item) => {
        item.slot = "tab-buttons";
        item.setAttribute('aria-disabled', Boolean(item?.disabled));
        item.setAttribute('aria-selected', Boolean(item?.selected));
        item.setAttribute('tabindex', Boolean(item?.selected) ? "0" : "-1");
      });

      if(!this.selectedTab) {
        this.initSelectedTab();
      }

      if(this.selectedTab && this.selectedTab.disabled) {
        this.initSelectedTab();
      }

      if(this.selectedTab) {
        this.selectedTab.selected = true;
      }
    });
  }
}

class TabItem extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    const shadow = this.shadowRoot;
    const template = document.createElement('template');
    template.innerHTML = `<style>
      :host-context(tab-list) {
        display: flex;
        position: relative;
        width: auto; height: fit-content;
        cursor: pointer;
        transition: all .1s;
      }
      :host(:not([disabled]):hover), :host([selected]) {
        color: #1976d2;
      }
      :host([disabled]) {
        cursor: initial;
        opacity: 0.4;
        pointer-events: none;
      }
      #text { padding: 18px 30px; }

    </style>

    <span id="text" role="none">
      <slot></slot>
    </span>`;
    shadow.appendChild(template.content.cloneNode(true));
  }

  get parent() {
    return this.closest('tab-list');
  }
  get selected() {
    return this.hasAttribute('selected');
  }
  set selected(isSelected) {
    this.toggleAttribute('selected', Boolean(isSelected))
  }
  get linkedPanel() {
    const panelId = this.getAttribute('aria-controls');
    const panel = document.querySelector(`tab-panel#${panelId}`);
    return panel;
  }

  showPanel() {
    if (this.linkedPanel) this.linkedPanel.show = true;
  }

  hidePanel() {
    if (this.linkedPanel) this.linkedPanel.show = false;
  }

  clickHandler(e) {
    console.log(this.disabled);
    if (!this.disabled) {
      e.target.selected = true;
      this.parent.allTabItems.forEach((item) => {
        if (item !== this) {
          item.selected = false;
        }
      })
    }
  }

  connectedCallback() {
    this.setAttribute('role', 'tab');
    this.addEventListener('click', this.clickHandler);
    this.index = this.parent.tabItems.indexOf(this);
    this.id = `${this.parent.id}-button-${this.index}`;
    if(this.linkedPanel) {
      this.linkedPanel.setAttribute('aria-labelledby', this.id);
    }
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.clickHandler);
  }

  static get observedAttributes() {
    return ["selected", "disabled"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    const isTrue = newValue === '' || newValue;
    if(name === 'selected') {
      this.setAttribute('aria-selected', isTrue);
      this.setAttribute('tabindex', isTrue ? '0' : '-1');
      isTrue ? this.showPanel() : this.hidePanel();
      if(isTrue) {
        this.showPanel();
        this.parent.indicator.style.cssText = `left:${this.offsetLeft}px;width:${this.offsetWidth}px;`;
        return;
      }
      this.hidePanel();
      return;
    }

    if(name === 'disabled') {
      console.log(name, newValue);
      this.setAttribute('aria-disabled', isTrue);
      if(isTrue) this.removeAttribute('tabindex');
      else this.setAttribute('tabindex', '0');
      return;
    }
  }
}

class TabPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open'});
    const shadow = this.shadowRoot;
    const template = document.createElement('template');
    template.innerHTML = `
      <style>
        :host {
          padding: 20px;
          background: white;
          display: block;
        }
        :host(:not([show])) {
          display: none;
        }
      </style>
      <slot></slot>
    `;
    shadow.appendChild(template.content.cloneNode(true));
  }

  get show() {
    return this.hasAttribute('show');
  }
  set show(isShow) {
    this.toggleAttribute('show', Boolean(isShow));
  }

  connectedCallback() {
    this.setAttribute('tabindex', 0);
    this.setAttribute('role', 'tabpanel');
  }
}


window.customElements.define('tab-list', TabList);
window.customElements.define('tab-item', TabItem);
window.customElements.define('tab-panel', TabPanel);