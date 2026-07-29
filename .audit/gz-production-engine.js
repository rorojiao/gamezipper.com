#!/usr/bin/env node
'use strict';

// Loads the one inline script that defines a game's production LEVELS and
// validator. The DOM/audio shims are deliberately inert: verifiers exercise
// game state and validation, not rendering or persistence.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { spawnSync } = require('child_process');

const noop = () => {};

function makeClassList() {
  return { add: noop, remove: noop, toggle: noop, contains: () => false };
}

function makeCanvasContext(canvas) {
  const gradient = { addColorStop: noop };
  return new Proxy({ canvas }, {
    get(target, property) {
      if (property in target) return target[property];
      if (property === 'createLinearGradient' || property === 'createRadialGradient') return () => gradient;
      return noop;
    },
    set: () => true,
  });
}

function makeElement(id) {
  const element = {
    id,
    style: {},
    dataset: {},
    classList: makeClassList(),
    width: 800,
    height: 600,
    clientWidth: 800,
    clientHeight: 600,
    innerHTML: '',
    textContent: '',
    value: '',
    onclick: null,
    appendChild: noop,
    removeChild: noop,
    addEventListener: noop,
    removeEventListener: noop,
    remove: noop,
    focus: noop,
    animate: () => ({ onfinish: null }),
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
  };
  const context = makeCanvasContext(element);
  element.getContext = () => context;
  return new Proxy(element, {
    get(target, property) {
      if (property in target) return target[property];
      return noop;
    },
    set(target, property, value) {
      target[property] = value;
      return true;
    },
  });
}

function makeAudioContext() {
  const parameter = { value: 0, setValueAtTime: noop, linearRampToValueAtTime: noop, exponentialRampToValueAtTime: noop };
  return {
    currentTime: 0,
    destination: {},
    createGain: () => ({ connect: noop, disconnect: noop, gain: { ...parameter } }),
    createOscillator: () => ({ connect: noop, disconnect: noop, start: noop, stop: noop, frequency: { ...parameter }, type: '' }),
    resume: () => Promise.resolve(),
    close: () => Promise.resolve(),
  };
}

function makeSandbox() {
  const elements = new Map();
  const getElement = id => {
    if (!elements.has(id)) elements.set(id, makeElement(id));
    return elements.get(id);
  };
  const document = {
    getElementById: getElement,
    createElement: tag => makeElement(tag),
    addEventListener: noop,
    removeEventListener: noop,
    querySelector: () => null,
    querySelectorAll: () => [],
    body: makeElement('body'),
    head: makeElement('head'),
    documentElement: makeElement('html'),
    hidden: false,
    readyState: 'complete',
  };
  const localStorageData = new Map();
  const localStorage = {
    getItem: key => localStorageData.has(key) ? localStorageData.get(key) : null,
    setItem: (key, value) => localStorageData.set(key, String(value)),
    removeItem: key => localStorageData.delete(key),
    clear: () => localStorageData.clear(),
  };
  const AudioContext = function AudioContext() { return makeAudioContext(); };
  const window = {
    document,
    innerWidth: 1280,
    innerHeight: 800,
    devicePixelRatio: 1,
    addEventListener: noop,
    removeEventListener: noop,
    AudioContext,
    webkitAudioContext: AudioContext,
    getComputedStyle: () => ({}),
  };
  window.window = window;
  window.localStorage = localStorage;

  return {
    console,
    document,
    window,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    localStorage,
    AudioContext,
    webkitAudioContext: AudioContext,
    setTimeout: () => 0,
    clearTimeout: noop,
    setInterval: () => 0,
    clearInterval: noop,
    requestAnimationFrame: () => 0,
    cancelAnimationFrame: noop,
    alert: noop,
    performance: { now: () => 0 },
  };
}

function productionScript(slug) {
  const indexPath = path.resolve(__dirname, '..', slug, 'index.html');
  const html = fs.readFileSync(indexPath, 'utf8');
  const candidates = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
    .map(match => match[1])
    .filter(code => /\b(?:const|let|var)\s+LEVELS\s*=/.test(code))
    .filter(code => /\bfunction\s+(?:checkSolution|checkWin)\s*\(/.test(code) || /\b__PULSE_TEST__\b/.test(code));
  if (candidates.length !== 1) {
    throw new Error(`${slug}: expected one production LEVELS/validator script, found ${candidates.length}`);
  }
  return { indexPath, code: candidates[0] };
}

function loadProductionEngine(slug) {
  const { indexPath, code } = productionScript(slug);
  const context = vm.createContext(makeSandbox());
  vm.runInContext(code, context, { filename: indexPath, timeout: 2000 });
  return {
    run(source) {
      return vm.runInContext(source, context, { filename: `${slug}/verify_engine.js`, timeout: 2000 });
    },
  };
}

function runIndependentVerifier(directory) {
  const verifier = path.join(directory, 'verify_independent.js');
  if (!fs.existsSync(verifier)) return;
  const result = spawnSync(process.execPath, [verifier], { cwd: directory, encoding: 'utf8', timeout: 30000 });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Independent verifier failed with exit ${result.status}`);
}

module.exports = { loadProductionEngine, runIndependentVerifier };
