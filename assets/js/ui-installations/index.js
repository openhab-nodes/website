import Cmp from './cmp.svelte';

window.customElements.define('ui-installations', class extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        this.cmp = new Cmp({ target: this, props: { } });
    }
    disconnectedCallback() {
        if (this.cmp) this.cmp.$destroy();
    }
});

