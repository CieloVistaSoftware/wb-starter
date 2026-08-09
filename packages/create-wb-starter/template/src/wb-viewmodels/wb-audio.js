/**
 * WBAudio Component
 * =================
 * Custom Tag: <wb-audio>
 * 
 * Wrapper for audio.js behavior
 * Enhanced <audio> element with 15-Band Graphic Equalizer
 * Premium audio player with Web Audio API EQ, presets, and master volume
 * 
 * Default: Uses pleasant royalty-free demo audio if no src provided
 * 
 * Usage:
 *   <wb-audio></wb-audio>  (uses default pleasant demo: "Carefree" by Kevin MacLeod)
 *   <wb-audio src="audio.mp3"></wb-audio>
 *   <wb-audio src="music.mp3" show-eq volume="0.8"></wb-audio>
 *   <wb-audio src="podcast.mp3" controls loop></wb-audio>
 */

import { audio as audioBehavior } from './semantics/audio.js';

// Pleasant demo audio: Kevin MacLeod's "Carefree" from Incompetech
// Royalty-free, uplifting, universally loved by users
// Perfect for testing audio features & EQ - immediately gets positive reactions
// Source: https://incompetech.com/music/royalty-free/music.html
const DEFAULT_DEMO_SRC = 'https://incompetech.com/music/royalty-free/mp3/Carefree.mp3';

export class WBAudio extends HTMLElement {
  constructor() {
    super();
    this._cleanup = null;
  }

  connectedCallback() {
    // v3.0: Read attributes directly (plain attributes, not data-*)
    // as per WB-Starter v3.0 standards
    
    // If no src provided, use pleasant default demo
    let src = this.getAttribute('src');
    if (!src || src.trim() === '') {
      src = DEFAULT_DEMO_SRC;
      // Mark that we're using the default so UI can indicate it
      this.setAttribute('data-using-default', 'true');
    }
    
    const config = {
      src: src,
      volume: parseFloat(this.getAttribute('volume') || '0.8'),
      controls: this.hasAttribute('controls') !== false, // Default to true
      autoplay: this.hasAttribute('autoplay') && this.getAttribute('autoplay') !== 'false',
      loop: this.hasAttribute('loop') && this.getAttribute('loop') !== 'false',
      muted: this.hasAttribute('muted') && this.getAttribute('muted') !== 'false',
      showEq: this.hasAttribute('show-eq') && this.getAttribute('show-eq') !== 'false',
      bass: parseFloat(this.getAttribute('bass') || '0'),
      treble: parseFloat(this.getAttribute('treble') || '0')
    };

    // Apply the audio behavior from semantics/audio.js
    this._cleanup = audioBehavior(this, config);
  }

  disconnectedCallback() {
    if (this._cleanup) {
      this._cleanup();
    }
  }
  
  /**
   * API: Set audio source dynamically
   */
  setSrc(src) {
    if (src) {
      this.setAttribute('src', src);
      this.removeAttribute('data-using-default');
      // Update audio element
      const audioEl = this.querySelector('audio');
      if (audioEl) {
        audioEl.src = src;
        audioEl.load();
      }
    }
  }
  
  /**
   * API: Get current source
   */
  getSrc() {
    return this.getAttribute('src') || DEFAULT_DEMO_SRC;
  }
  
  /**
   * API: Check if using default demo
   */
  isUsingDefault() {
    return this.hasAttribute('data-using-default');
  }
}

if (!customElements.get('wb-audio')) {
  customElements.define('wb-audio', WBAudio);
}
