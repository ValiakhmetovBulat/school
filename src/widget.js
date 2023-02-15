/**
 * Sanitizer which filters a set of whitelisted tags, attributes and css.
 * For now, the whitelist is small but can be easily extended.
 *
 * @param bool whether to escape or strip undesirable content.
 * @param map of allowed tag-attribute-attribute-parsers.
 * @param array of allowed css elements.
 * @param array of allowed url scheme
 */
function HtmlWhitelistedSanitizer(escape, tags, css, urls) {
    this.escape = escape;
    this.allowedTags = tags;
    this.allowedCss = css;
  
    // Use the browser to parse the input but create a new HTMLDocument.
    // This won't evaluate any potentially dangerous scripts since the element
    // isn't attached to the window's document. It also won't cause img.src to
    // preload images.
    //
    // To be extra cautious, you can dynamically create an iframe, pass the
    // input to the iframe and get back the sanitized string.
    this.doc = document.implementation.createHTMLDocument();
  
    if (urls == null) {
      urls = ['http://', 'https://'];
    }
  
    if (this.allowedTags == null) {
      // Configure small set of default tags
      var unconstrainted = function(x) { return x; };
      var globalAttributes = {
        'dir': unconstrainted,
        'lang': unconstrainted,
        'title': unconstrainted
      };
      var url_sanitizer = HtmlWhitelistedSanitizer.makeUrlSanitizer(urls);
      this.allowedTags = {
        'a': HtmlWhitelistedSanitizer.mergeMap(globalAttributes, {
            'download': unconstrainted,
            'href': url_sanitizer,
            'hreflang': unconstrainted,
            'ping': url_sanitizer,
            'rel': unconstrainted,
            'target': unconstrainted,
            'type': unconstrainted
          }),
        'img': HtmlWhitelistedSanitizer.mergeMap(globalAttributes, {
            'alt': unconstrainted,
            'height': unconstrainted,
            'src': url_sanitizer,
            'width': unconstrainted
          }),
        'p': globalAttributes,
        'div': globalAttributes,
        'span': globalAttributes,
        'br': globalAttributes,
        'b': globalAttributes,
        'i': globalAttributes,
        'u': globalAttributes
      };
    }
    if (this.allowedCss == null) {
      // Small set of default css properties
      this.allowedCss = ['border', 'margin', 'padding'];
    }
  }

    if (!String.prototype.startsWith) {
        String.prototype.startsWith = function (searchString, position) {
            "use strict";
            var str = this,
                strLen,
                seaLen,
                pos = position || 0;
            
            strLen = str.length;
            seaLen = searchString.length;
            
            return (seaLen + pos > strLen) ? false : (function nextChar(i) {
                return (i >= seaLen) || (function () {
                    return str.charCodeAt(pos + i) !== searchString.charCodeAt(i) ? false : nextChar(i + 1);
                }());
            }(0));
        };
    }
  
  HtmlWhitelistedSanitizer.makeUrlSanitizer = function(allowed_urls) {
    return function(str) {
      if (!str) { return ''; }
      for (var i in allowed_urls) {
        if (str.startsWith(allowed_urls[i])) {
          return str;
        }
      }
      return '';
    };
  }
  
  HtmlWhitelistedSanitizer.mergeMap = function(/*...*/) {
    var r = {};
    for (var arg in arguments) {
      for (var i in arguments[arg]) {
        r[i] = arguments[arg][i];
      }
    }
    return r;
  }
  
  HtmlWhitelistedSanitizer.prototype.sanitizeString = function(input) {
    var div = this.doc.createElement('div');
    div.innerHTML = input;
  
    // Return the sanitized version of the node.
    return this.sanitizeNode(div).innerHTML;
  }
  
  HtmlWhitelistedSanitizer.prototype.sanitizeNode = function(node) {
    // Note: <form> can have it's nodeName overriden by a child node. It's
    // not a big deal here, so we can punt on this.
    var node_name = node.nodeName.toLowerCase();
    if (node_name == '#text') {
      // text nodes are always safe
      return node;
    }
    if (node_name == '#comment') {
      // always strip comments
      return this.doc.createTextNode('');
    }
    if (!this.allowedTags.hasOwnProperty(node_name)) {
      // this node isn't allowed
      console.log("forbidden node: " + node_name);
      this.danger = true;
      if (this.escape) {
        return this.doc.createTextNode(node.outerHTML);
      }
      return this.doc.createTextNode('');
    }
  
    // create a new node
    var copy = this.doc.createElement(node_name);
  
    // copy the whitelist of attributes using the per-attribute sanitizer
    for (var n_attr=0; n_attr < node.attributes.length; n_attr++) {
      var attr = node.attributes.item(n_attr).name;
      if (this.allowedTags[node_name].hasOwnProperty(attr)) {
        var sanitizer = this.allowedTags[node_name][attr];
        copy.setAttribute(attr, sanitizer(node.getAttribute(attr)));
      }
    }
    // copy the whitelist of css properties
    for (var css in this.allowedCss) {
      copy.style[this.allowedCss[css]] = node.style[this.allowedCss[css]];
    }
  
    // recursively sanitize child nodes
    while (node.childNodes.length > 0) {
      var child = node.removeChild(node.childNodes[0]);
      copy.appendChild(this.sanitizeNode(child));
    }
    return copy;
  }


class CHESLIDESHOW {
    constructor (params = {}) {
        this.currentSlideIndex = params.slideIndex ? params.slideIndex : 0,
        this.newSlideIndex,
        this.running = false,
        this.slidePool = params.slidePool,
        this.slideExtractor = params.slideExtractor ? params.slideExtractor : function (poolItem) { return poolItem; },
        this.currentSlide = null,
        this.newSlide = null,
        this.mode = params.mode ? params.mode : 'BothMoveLeft';

        let speed = params.speed ? params.speed : 100;
        this.delay = Math.max(100 - speed, 0);
    }

    animateSlides (mode) {
        if (this.running) {
            return false;
        }
        this.running = true;

        this.setTargets();
        this.animate(this.currentSlide, this.newSlide, mode);
    }

    setTargets() {
        this.newSlideIndex = (this.currentSlideIndex + 1) % this.slidePool.length;

        this.currentSlide = this.slideExtractor(this.slidePool[this.currentSlideIndex]);
        this.newSlide = this.slideExtractor(this.slidePool[this.newSlideIndex]);
    }

    _prepareBothMoveLeft(slide, isNew) {
        slide.style.top = '';
        slide.style.left = isNew ? '100%' : '0%';
    }

    _animateBothMoveLeft(slide, isNew) {
        slide.style.left = `${ parseInt(slide.style.left) - 4 }%`;
    }

    _prepareBothMoveRight(slide, isNew) {
        slide.style.left = isNew ? '-100%' : '0%';
    }

    _animateBothMoveRight(slide, isNew) {
        slide.style.left = `${ parseInt(slide.style.left) + 4 }%`;
    }

    _prepareBothMoveUp(slide, isNew) {
        slide.style.top = isNew ? '100%' : '0%';
    }

    _animateBothMoveUp(slide, isNew) {
        slide.style.top = `${ parseInt(slide.style.top) - 4 }%`;
    }

    _prepareBothMoveDown(slide, isNew) {
        slide.style.top = isNew ? '-100%' : '0%';
    }

    _animateBothMoveDown(slide, isNew) {
        slide.style.top = `${ parseInt(slide.style.top) + 4 }%`;
    }

    _prepareFade(slide, isNew) {
        slide.style.opacity = isNew ? '0%' : '100%';
    }

    _animateFade(slide, isNew) {
        if (isNew) {
            slide.style.opacity = `${ parseFloat(slide.style.opacity) + 0.04 }`;
        } else {
            slide.style.opacity = `${ parseFloat(slide.style.opacity) - 0.04 }`;
        }
    }

    animate (currentSlide, newSlide, mode) {
        let i = 0;

        let finalize = () => {
            currentSlide.classList.add('inactive');
            currentSlide.style = {};
            newSlide.style = {};

            this.currentSlideIndex = this.newSlideIndex;
            this.running = false;
        }

        this[`_prepare${mode}`](currentSlide, false);
        this[`_prepare${mode}`](newSlide, true);
        let animator = this[`_animate${mode}`];
        newSlide.classList.remove('inactive');
        if(this.delay != 0) {
            let newThis = this;
            let animationInt = setTimeout( function tick() {
                animator(currentSlide, false);
                animator(newSlide, true);
                animationInt = setTimeout(tick, newThis.delay);

                i++;
                if(i >= 25) {
                    clearTimeout(animationInt);
                    finalize();
                }
                
            }, this.delay);
        } else {
            finalize();
        }
    }
    
    nextSlide(mode) {
        let animationMode = mode ? mode : this.mode;
        if (animationMode === 'Random') {
            let modes = ['BothMoveLeft', 'BothMoveRight', 'BothMoveUp', 'BothMoveDown', 'Fade'];
            animationMode = modes[Math.floor(Math.random() * modes.length)];
        }
        this.animateSlides(animationMode);
    }
}


(() => {
    const REQUIRED_PARAMS = [
        'api_host',
        'allocation_type_id',
        'resource_id',
        'tags'
    ];

    class PublicationsWidget {

        constructor (params = {}) {
            this.params = params;
            this._checkParams();

            this.rotation_period = 10;
            this.onLoad = params.onLoad;
            this.offline = params.offline;
            this.followLinks = params.followLinks ? params.followLinks : false;
            this.countImage = 0;
            this.speed = params.speed && +params.speed > 0 ? +params.speed : 0;
            this.mode = params.mode ? params.mode : 'BothMoveLeft',
            this.countError = 0;
            this.getError = 0;
            this.reloadInterval = params.reloadInterval ? params.reloadInterval * 60000 : 600000;
            this.nojs = params.nojs ? params.nojs : false;
            this.slide = null;
            this.materials = [];
            this.currentIndex = null;
            this.domConatainer = null;
            this.domWrapper = null;
        }

        _checkParams () {
            REQUIRED_PARAMS.forEach( (param)=> {
                if (false === this.params.hasOwnProperty(param)) {
                    throw new Error(`Missing required parameter ${param}`)
                }
            })
        }

        _fetch () {
            let localResponse = JSON.parse(sessionStorage.getItem('ads-response'));
            let responseProcessor = (xhr) => {
                let response = JSON.parse(xhr.response);
                response.expires = new Date(xhr.getResponseHeader("Expires"));
                response.string = xhr.response;

                sessionStorage.setItem('ads-response', JSON.stringify(response));

                return response;
            }

            return new Promise((res, rej) => {
                if (localResponse && new Date(localResponse.expires) > new Date()) {
                    res(localResponse);
                } else {
                    let xhr = new XMLHttpRequest()
                    let urlParams = new URLSearchParams()

                    if (this.params.user_hash) {
                        urlParams.append('user', this.params.user_hash)
                    }

                    if (this.params.tags && typeof this.params.tags === 'object') {
                        for (const [key, value] of Object.entries(this.params.tags)) {
                            if (Array.isArray(value)) {
                                value.forEach(v => {
                                    urlParams.append(`tags[${key}][]`, v)
                                });
                            } else {
                                urlParams.append(`tags[${key}]`, value)
                            }
                        }
                    }

                    xhr.open(
                        'GET',
                        `${this.params.api_host}api/v2/a/${this.params.resource_id}/${this.params.allocation_type_id}/view.json?${urlParams.toString()}`
                    )
                    xhr.onload = () => {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            res(responseProcessor(xhr));
                        } else {
                            rej(xhr.statusText);
                        }
                    }

                    xhr.onerror = () => {
                        rej(xhr.statusText)
                    }

                    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
                    xhr.send()
                }
            })
                .then((responseObj) => {
                    this.rotation_period = responseObj.rotation_period * 1000;
                    this.materials = responseObj.materials;
                    if (typeof this.onLoad === 'function') {
                        this.onLoad(responseObj.string);
                    }
                })
        }

        _runScripts (el) {
            let scripts =  el.getElementsByTagName('script');
            let scripts_array = Array.prototype.slice.call(scripts);
            
            scripts_array.forEach( (script) => {
                eval(script.innerHTML)
            })
        }

        _reload(el) {
            let $this = this;
            this.intervalReload = setTimeout( function reload() {
                $this.render(el);
                $this.intervalReload = setTimeout(reload, $this.reloadInterval);
            }, $this.reloadInterval);
        }

        _initHtml(el) {
            this.domContainer = el.querySelector('.swiper-container') ? el.querySelector('.swiper-container') : null;

            if(!this.domContainer) {
                this.domContainer = document.createElement('div');
                this.domContainer.className = 'swiper-container';
                this.domContainer.style.display = 'none';
                el.appendChild(this.domContainer);
            } else {
                this.domContainer.innerHTML = '';
            }

            this.domWrapper = document.createElement('div');
            this.domWrapper.className = 'swiper-wrapper';
            this.domWrapper.innerHTML = '';

            this.domContainer.appendChild(this.domWrapper);

            clearInterval(this.intervalSwipe);
            clearInterval(this.intervalReload);
        }

        render (el) {
            this._initHtml(el);
            this._fetch()
                .then(this._show.bind(this))
                .catch((err) => {
                    console.error('PW: render catch', err);
                    if (typeof this.offline === 'function') {
                        console.warn('PW: going OFFLINE')
                        this.offline();
                    }
                    this._reload(el);
                });
            this._reload(el);
            this._runScripts(el);
        }

        stop(el) {
            clearInterval(this.intervalReload);
            clearInterval(this.intervalSwipe);
            
            let swiperContainer = document.querySelector('.swiper-container') ? document.querySelector('.swiper-container') : null;
            
            if(swiperContainer) {
                el.removeChild(swiperContainer);
            }
        }

        _getRandomInt(min, max) {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min)) + min;
        }

        /**
         * Создаёт DOM для слайда (провоцируя загрузку картинки)
         *
         * @param int materialIndex
         * @param bool active instantly activate slide
         */
        _prepareSlide(materialIndex, active) {
            let material = this.materials[materialIndex];
            if (material.content && !material.dom) {
                let dom = document.createElement('div');
                dom.innerHTML = material.content;
                let linksList = Array.prototype.slice.call(dom.querySelectorAll('a'));
                linksList.forEach( link => {
                    link.setAttribute('rel', 'nofollow');
                    if(!this.followLinks) {
                        link.style.pointerEvents = 'none';
                    }
                })

                let imgList = Array.prototype.slice.call(dom.querySelectorAll('img'));
                imgList.forEach(img => {
                    img.onerror = () => {
                        console.error('img error', img);
                        this.materials.splice(materialIndex, 1);
                    };
                });

                let swiperSlide = document.createElement('div');
                swiperSlide.className = `swiper-slide ${active ? '' : 'inactive'}`;

                let swiperSlideImage = document.createElement('div');
                swiperSlideImage.className = `swiper-slide__image`;
                swiperSlideImage.innerHTML = dom.innerHTML;

                swiperSlide.appendChild(swiperSlideImage);
                this.domWrapper.appendChild(swiperSlide);

                material.dom = swiperSlide;
            }
        }

        _show() {
            if (this.materials.length > 0 && this.domContainer) {
                this.currentIndex = this._getRandomInt(0, this.materials.length);
                let nextIndex = (this.currentIndex + 1) % this.materials.length;
                this._prepareSlide(this.currentIndex, true)
                this._prepareSlide(nextIndex);

                this.domContainer.style.display = 'block';
            }

            if(this.materials.length > 1) {
                this.slide = new CHESLIDESHOW({
                    slideIndex: this.currentIndex,
                    slidePool: this.materials,
                    slideExtractor: function (poolItem) { return poolItem.dom; },
                    speed: this.speed,
                    mode: this.mode
                });

                let $this = this; 
                this.intervalSwipe = setTimeout( function tick() {
                    $this.slide.nextSlide();
                    $this.currentIndex = ($this.currentIndex + 1) % $this.materials.length;
                    let nextIndex = ($this.currentIndex + 1) % $this.materials.length;
                    $this._prepareSlide(nextIndex);

                    $this.intervalSwipe = setTimeout(tick, $this.rotation_period);
                }, $this.rotation_period);
            } else if (this.materials.length < 1) {
                if (typeof this.offline === 'function') {
                    console.warn('PW: going OFFLINE')
                    this.offline();
                }
            }
        }

        _hide() {
            if (this.domContainer) {
                this.domContainer.style.display = 'none';
            }
            clearInterval(this.intervalSwipe)
        }
    }

    window.PublicationsWidget = PublicationsWidget
    return PublicationsWidget
})()
