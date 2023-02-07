const delimiter = "➳❍";
const bookend = "❍⇚";
const delimiterComment = `<!--${delimiter}-->`;
const bookendComment = `<!--${bookend}-->`;
const dependencyCollector = new Map();
const queueStack = new Set();
const nextTicks = new Set();
let consumingQueue = false;
const listeners = new WeakMap();
const sanitize = (str) => {
  return str === "<!---->" ? str : str.replace(/[<>]/g, (m) => m === ">" ? "&gt;" : "&lt;");
};
function queue(fn) {
  return (newValue, oldValue) => {
    if (!queueStack.size) {
      setTimeout(() => {
        consumingQueue = true;
        queueStack.forEach((fn2) => fn2(newValue, oldValue));
        queueStack.clear();
        consumingQueue = false;
        nextTicks.forEach((fn2) => fn2());
        nextTicks.clear();
      });
    }
    !consumingQueue && queueStack.add(fn);
  };
}
export function nextTick(fn) {
  if (!queueStack.size) {
    if (fn)
      fn();
    return Promise.resolve();
  }
  let resolve;
  const p = new Promise((r2) => {
    resolve = r2;
  });
  nextTicks.add(() => {
    if (fn)
      fn();
    resolve();
  });
  return p;
}
function addDep(proxy, property) {
  dependencyCollector.forEach((tracker) => {
    let properties = tracker.get(proxy);
    if (!properties) {
      properties = new Set();
      tracker.set(proxy, properties);
    }
    properties.add(property);
  });
}
function isTpl(template) {
  return typeof template === "function" && !!template.isT;
}
function isR(obj) {
  return typeof obj === "object" && obj !== null && typeof obj.$on === "function";
}
function has(obj, property) {
  return Object.prototype.hasOwnProperty.call(obj, property);
}
function isReactiveFunction(fn) {
  return has(fn, "$on");
}
function createNodes(html2) {
  const tpl = document.createElement("template");
  tpl.innerHTML = html2;
  const dom = tpl.content.cloneNode(true);
  dom.normalize();
  return dom.childNodes;
}
function createPartial(group = Symbol()) {
  let html2 = "";
  let expressions = [];
  let chunks = [];
  let previousChunks = [];
  const keyedChunks = new Map();
  const partial = () => {
    if (!chunks.length) {
      addPlaceholderChunk();
    }
    const dom = assignDomChunks(fragment(createNodes(html2), expressions)());
    reset();
    return dom;
  };
  partial.ch = () => previousChunks;
  partial.l = 0;
  partial.add = (tpl) => {
    if (!tpl && tpl !== 0)
      return;
    let template = tpl;
    let localExpressions = [];
    let key;
    isTpl(tpl) ? [template, localExpressions, key] = tpl._h() : template = sanitize(String(tpl));
    html2 += template;
    html2 += bookendComment;
    const keyedChunk = key && keyedChunks.get(key);
    const chunk = keyedChunk || {
      html: template,
      exp: localExpressions,
      dom: [],
      tpl,
      key
    };
    chunks.push(chunk);
    if (key) {
      keyedChunk ? keyedChunk.exp.forEach((exp, i) => exp._up(localExpressions[i].e)) : keyedChunks.set(key, chunk);
    }
    localExpressions.forEach((callback) => expressions.push(callback));
    partial.l++;
  };
  partial._up = () => {
    const subPartial = createPartial(group);
    let startChunking = 0;
    let lastNode = previousChunks[0].dom[0];
    if (!chunks.length)
      addPlaceholderChunk(document.createComment(""));
    const closeSubPartial = () => {
      if (!subPartial.l)
        return;
      const frag = subPartial();
      const last = frag.lastChild;
      lastNode[startChunking ? "after" : "before"](frag);
      transferChunks(subPartial, chunks, startChunking);
      lastNode = last;
    };
    chunks.forEach((chunk, index) => {
      const prev = previousChunks[index];
      if (chunk.key && chunk.dom.length) {
        closeSubPartial();
        if (!prev || prev.dom !== chunk.dom) {
          lastNode[index ? "after" : "before"](...chunk.dom);
        }
        lastNode = chunk.dom[chunk.dom.length - 1];
      } else if (prev && chunk.html === prev.html && !prev.key) {
        closeSubPartial();
        prev.exp.forEach((expression, i) => expression._up(chunk.exp[i].e));
        chunk.exp = prev.exp;
        chunk.dom = prev.dom;
        lastNode = chunk.dom[chunk.dom.length - 1];
      } else {
        if (!subPartial.l)
          startChunking = index;
        subPartial.add(chunk.tpl);
      }
    });
    closeSubPartial();
    let node = lastNode.nextSibling;
    while (node && has(node, group)) {
      const next = node.nextSibling;
      removeNode(node);
      node = next;
    }
    reset();
  };
  const reset = () => {
    html2 = "";
    partial.l = 0;
    expressions = [];
    previousChunks = [...chunks];
    chunks = [];
  };
  const addPlaceholderChunk = (node) => {
    html2 = "<!---->";
    chunks.push({
      html: html2,
      exp: [],
      dom: node ? [node] : [],
      tpl: html2,
      key: 0
    });
  };
  const assignDomChunks = (frag) => {
    let chunkIndex = 0;
    const toRemove = [];
    frag.childNodes.forEach((node) => {
      if (node.nodeType === 8 && node.data === bookend) {
        chunkIndex++;
        toRemove.push(node);
        return;
      }
      Object.defineProperty(node, group, {value: group});
      chunks[chunkIndex].dom.push(node);
    });
    toRemove.forEach((node) => node.remove());
    return frag;
  };
  const transferChunks = (partialA, chunksB, chunkIndex) => {
    partialA.ch().forEach((chunk, index) => {
      chunksB[chunkIndex + index].dom = chunk.dom;
    });
  };
  return partial;
}
export function t(strings, ...expSlots) {
  const expressions = [];
  let str = "";
  const addExpressions = (expression, html2) => {
    if (typeof expression === "function") {
      let observer = () => {
      };
      expressions.push(Object.assign((...args) => expression(...args), {
        e: expression,
        $on: (obs) => {
          observer = obs;
        },
        _up: (exp) => {
          expression = exp;
          observer();
        }
      }));
      return html2 + delimiterComment;
    }
    if (Array.isArray(expression)) {
      return expression.reduce((html3, exp) => addExpressions(exp, html3), html2);
    }
    return html2 + expression;
  };
  const toString = () => {
    if (!str) {
      str = strings.reduce(function interlaceTemplate(html2, strVal, i) {
        html2 += strVal;
        return expSlots[i] !== void 0 ? addExpressions(expSlots[i], html2) : html2;
      }, "");
    }
    return str;
  };
  const template = (el) => {
    const dom = createNodes(toString());
    const frag = fragment(dom, expressions);
    return el ? frag(el) : frag();
  };
  template.isT = true;
  template._k = 0;
  template._h = () => [toString(), expressions, template._k];
  template.key = (key) => {
    template._k = key;
    return template;
  };
  return template;
}
function fragment(dom, expressions) {
  const frag = document.createDocumentFragment();
  let node;
  while (node = dom.item(0)) {
    if (node.nodeType === 8 && node.nodeValue === delimiter) {
      frag.append(comment(node, expressions));
      continue;
    }
    if (node instanceof Element)
      attrs(node, expressions);
    if (node.hasChildNodes()) {
      fragment(node.childNodes, expressions)(node);
    }
    frag.append(node);
    if (node instanceof HTMLOptionElement)
      node.selected = node.defaultSelected;
  }
  return (parent) => {
    if (parent) {
      parent.appendChild(frag);
      return parent;
    }
    return frag;
  };
}
function attrs(node, expressions) {
  if (!node.hasAttributes())
    return;
  const hasValueIDL = node instanceof HTMLInputElement || node instanceof HTMLSelectElement || node instanceof HTMLTextAreaElement;
  const total = node.attributes.length;
  const toRemove = [];
  const attrs2 = [];
  for (let i = 0; i < total; i++) {
    attrs2.push(node.attributes[i]);
  }
  attrs2.forEach((attr) => {
    const attrName = attr.name;
    if (attr.value.indexOf(delimiterComment) !== -1) {
      const expression = expressions.shift();
      if (attrName.charAt(0) === "@") {
        const event = attrName.substring(1);
        node.addEventListener(event, expression);
        if (!listeners.has(node))
          listeners.set(node, new Map());
        listeners.get(node)?.set(event, expression);
        toRemove.push(attrName);
      } else {
        w(expression, (value) => {
          if (hasValueIDL && attrName === "value") {
            node.value = value;
          } else {
            value !== false ? node.setAttribute(attrName, value) : node.removeAttribute(attrName);
          }
        });
      }
    }
  });
  toRemove.forEach((attrName) => node.removeAttribute(attrName));
}
function removeNode(node) {
  node.remove();
  listeners.get(node)?.forEach((listener, event) => node.removeEventListener(event, listener));
}
function comment(node, expressions) {
  const frag = document.createDocumentFragment();
  node.remove();
  const partial = createPartial();
  const expression = expressions.shift();
  if (expression && isTpl(expression.e)) {
    partial.add(expression.e);
  } else {
    if (partial.l) {
      frag.appendChild(partial());
    }
    let n = document.createTextNode("");
    n = w(expression, (value) => setNode(n, value));
    frag.appendChild(n instanceof Node ? n : n());
  }
  if (partial.l) {
    frag.appendChild(partial());
  }
  return frag;
}
function setNode(n, value) {
  if (!Array.isArray(value)) {
    return setNode(n, [value]);
  }
  const isUpdate = typeof n === "function";
  const partial = isUpdate ? n : createPartial();
  value.forEach((item) => partial.add(item));
  if (isUpdate)
    partial._up();
  return partial;
}
export function w(fn, after) {
  const trackingId = Symbol();
  if (!dependencyCollector.has(trackingId)) {
    dependencyCollector.set(trackingId, new Map());
  }
  let currentDeps = new Map();
  const queuedCallFn = queue(callFn);
  function callFn() {
    dependencyCollector.set(trackingId, new Map());
    const value = fn();
    const newDeps = dependencyCollector.get(trackingId);
    dependencyCollector.delete(trackingId);
    currentDeps.forEach((propertiesToUnobserve, proxy) => {
      const newProperties = newDeps.get(proxy);
      if (newProperties) {
        newProperties.forEach((prop) => propertiesToUnobserve.delete(prop));
      }
      propertiesToUnobserve.forEach((prop) => proxy.$off(prop, queuedCallFn));
    });
    newDeps.forEach((properties, proxy) => {
      properties.forEach((prop) => proxy.$on(prop, queuedCallFn));
    });
    currentDeps = newDeps;
    return after ? after(value) : value;
  }
  if (isReactiveFunction(fn))
    fn.$on(callFn);
  return callFn();
}
function reactiveMerge(reactiveTarget, reactiveSource) {
  const state = reactiveSource._st();
  if (state.o) {
    state.o.forEach((callbacks, property) => {
      callbacks.forEach((c) => {
        reactiveTarget.$on(property, c);
      });
    });
  }
  if (state.p) {
    reactiveTarget._p = state.p;
  }
  return reactiveTarget;
}
function arrayOperation(op, arr, proxy, native) {
  const synthetic = (...args) => {
    const retVal = Array.prototype[op].call(arr, ...args);
    arr.forEach((item, i) => proxy._em(String(i), item));
    if (proxy._p) {
      const [property, parent] = proxy._p;
      parent._em(property, proxy);
    }
    return retVal;
  };
  switch (op) {
    case "shift":
    case "pop":
    case "sort":
    case "reverse":
    case "copyWithin":
      return synthetic;
    case "unshift":
    case "push":
    case "fill":
      return (...args) => synthetic(...args.map((arg) => r(arg)));
    case "splice":
      return (start, remove, ...inserts) => synthetic(start, remove, ...inserts.map((arg) => r(arg)));
    default:
      return native;
  }
}
export function r(data, state = {}) {
  if (isR(data) || typeof data !== "object")
    return data;
  const observers = state.o || new Map();
  const observerProperties = state.op || new Map();
  const isArray = Array.isArray(data);
  const children = [];
  const proxySource = isArray ? [] : Object.create(data, {});
  for (const property in data) {
    const entry = data[property];
    if (typeof entry === "object" && entry !== null) {
      proxySource[property] = !isR(entry) ? r(entry) : entry;
      children.push(property);
    } else {
      proxySource[property] = entry;
    }
  }
  const dep = (a) => (p, c) => {
    let obs = observers.get(p);
    let props = observerProperties.get(c);
    if (!obs) {
      obs = new Set();
      observers.set(p, obs);
    }
    if (!props) {
      props = new Set();
      observerProperties.set(c, props);
    }
    obs[a](c);
    props[a](p);
  };
  const $on = dep("add");
  const $off = dep("delete");
  const _em = (property, newValue, oldValue) => {
    observers.has(property) && observers.get(property).forEach((c) => c(newValue, oldValue));
  };
  const _st = () => {
    return {
      o: observers,
      op: observerProperties,
      r: proxySource,
      p: proxy._p
    };
  };
  const depProps = {
    $on,
    $off,
    _em,
    _st,
    _p: void 0
  };
  const proxy = new Proxy(proxySource, {
    get(...args) {
      const [, p] = args;
      if (Reflect.has(depProps, p))
        return Reflect.get(depProps, p);
      const value = Reflect.get(...args);
      addDep(proxy, p);
      if (isArray && has(Array.prototype, p)) {
        return arrayOperation(p, proxySource, proxy, value);
      }
      return value;
    },
    set(...args) {
      const [target, property, value] = args;
      const old = Reflect.get(target, property);
      if (Reflect.has(depProps, property)) {
        return Reflect.set(depProps, property, value);
      }
      if (value && isR(old)) {
        const o = old;
        const oldState = o._st();
        const newR = isR(value) ? reactiveMerge(value, o) : r(value, oldState);
        Reflect.set(target, property, newR);
        _em(property, newR);
        oldState.o.forEach((_c, property2) => {
          const oldValue = Reflect.get(old, property2);
          const newValue = Reflect.get(newR, property2);
          if (oldValue !== newValue) {
            o._em(property2, newValue, oldValue);
          }
        });
        return true;
      }
      const didSet = Reflect.set(...args);
      if (didSet) {
        if (old !== value) {
          _em(property, value, old);
        }
        if (proxy._p) {
          proxy._p[1]._em(...proxy._p);
        }
      }
      return didSet;
    }
  });
  children.map((c) => {
    proxy[c]._p = [c, proxy];
  });
  return proxy;
}
export const html = t;
export const reactive = r;
export const watch = w;
