import("https://cdn.jsdelivr.net/npm/@mercuryworkshop/epoxy-tls/full/epoxy-bundled.min.js").then((et) => et.default().then(() => {
    const options = new et.EpoxyClientOptions({
        user_agent: navigator.userAgent,
        wisp_v2: true,
        udp_extension_required: true
    });
    const client = new et.EpoxyClient("wss://wisp.mercurywork.shop", options);

    class proxyXHR extends EventTarget {
        UNSENT = 0;
        OPENED = 1;
        HEADERS_RECEIVED = 2;
        LOADING = 3;
        DONE = 4;

        #ready_state; //internal readystate value
        #response; //a response object 
        #response_data; //an arraybuffer containing the response data
        #mime_type; //internal mime type value
        #upload; //internal XMLHttpRequestUpload object
        #req_url; //internal store for request url
        #req_options; //internal request options dict
        #aborted;
        #base_url; //base URL for relative URLs

        constructor(baseURL) {
            super();
            this.#init_internal();
            this.#mime_type = null;
            this.#base_url = baseURL;

            this.timeout = 0;
            this.responseType = "";
            this.withCredentials = false;

            this.#setup_listeners(["abort", "error", "load", "loadend", "loadstart", "progress", "readystatechange", "timeout"], this);
            this.#setup_listeners(["abort", "error", "load", "loadend", "loadstart", "progress", "timeout"], this.upload);
        }

        #setup_listeners(event_names, target) {
            for (let event_name of event_names) {
                target["on" + event_name] = null;
            }
        }

        #init_internal() {
            this.#ready_state = 0;
            this.#response = null;
            this.#response_data = null;
            this.#req_url = null;
            this.#req_options = {};
            this.#aborted = false;
            this.#upload = new EventTarget();
        }

        #emit_event(event, target) {
            if (!target) {
                this.#emit_event(event, this);
                this.#emit_event(event, this.#upload);
                return;
            }
            target.dispatchEvent(event);
            try {
                if (typeof target["on" + event.type] === "function")
                    target["on" + event.type](event);
            } catch (e) {
                console.error(e);
            }
        }

        abort() {
            this.#aborted = true;
            this.readyState = this.UNSENT;
            this.#response = null;
            this.#emit_event(new Event("abort"));
            this.#emit_event(new Event("abort"), this.#upload);
        }

        getAllResponseHeaders() {
            if (!this.#response) return "";
            let result = "";
            for (let [key, value] of this.#response.headers) {
                result += `${key}: ${value}\r\n`;
            }
            return result;
        }

        getResponseHeader(header_name) {
            if (!this.#response) return "";
            return this.#response.headers.get(header_name);
        }

        open(method, url, async, user, password) {
            if (async ===false) //erroring here is actually permitted by spec
                throw new DOMException("InvalidAccessError");

            this.#init_internal();
            this.readyState = this.OPENED;
            this.#req_url = new URL(url, this.#base_url);
            this.#req_url.username = user || "";
            this.#req_url.password = password || "";
            this.#req_options.headers = {};
            this.#req_options.method = method.toUpperCase();
        }

        overrideMimeType(mime_type) {
            this.#mime_type = mime_type;
        }

        send(body) {
            if (this.#req_options.method === "GET")
                body = undefined;

            if (this.timeout) {
                setTimeout(() => {
                    if (this.readyState !== this.DONE)
                        this.abort();
                }, this.timeout);
            }
            this.#req_options.body = body || undefined;

            (async () => {
                try {
                    this.#response = await client.fetch(this.#req_url, this.#req_options);
                    this.readyState = this.HEADERS_RECEIVED;
                    this.readyState = this.LOADING;

                    if (this.#aborted) return;
                    this.#emit_event(new ProgressEvent("loadstart"));
                    this.#response_data = await this.#response.arrayBuffer();
                    this.#emit_event(new ProgressEvent("progress"));
                    this.readyState = this.DONE;
                    this.#emit_event(new ProgressEvent("load"));
                } catch (e) {
                    this.#emit_event(new ProgressEvent("error"));
                }
                this.#emit_event(new ProgressEvent("loadend"));
            })();
        }

        setRequestHeader(header, value) {
            if (!this.#req_options.headers) this.#req_options.headers = {};
            this.#req_options.headers[header] = value;
        }

        set readyState(value) {
            if (value !== this.#ready_state) {
                this.#ready_state = value;
                this.#emit_event(new Event("readystatechange"));
            }
        }

        get readyState() {
            return this.#ready_state;
        }

        get response() {
            if (this.#response_data === null)
                return undefined;
            if (this.responseType === "arraybuffer") {
                try {
                    let dest = new ArrayBuffer(this.#response_data.byteLength);
                    new Uint8Array(dest).set(new Uint8Array(this.#response_data));
                    return dest;
                } catch (e) {
                    return null;
                }
            } else if (this.responseType === "blob") {
                try {
                    return new Blob([this.#response_data]);
                } catch (e) {
                    return null;
                }
            } else if (this.responseType === "document") {
                return this.responseXML;
            } else if (this.responseType === "json") {
                if (this.#response_data === null)
                    return null;
                try {
                    return JSON.parse(this.responseText);
                } catch (e) {
                    return null;
                }
            } else {
                return this.responseText;
            }
        }

        get responseText() {
            if (!this.#response_data) return "";
            return new TextDecoder().decode(this.#response_data);
        }

        get responseURL() {
            if (!this.#response) return "";
            return this.#response.url;
        }

        get responseXML() {
            if (this.responseType !== "document" && this.responseType !== "")
                throw new DOMException("InvalidStateError");
            if (this.#response === null || this.#response_data === null)
                return null;
            return new DOMParser().parseFromString(this.responseText, this.#mime_type || "text/html");
        }

        get status() {
            if (!this.#response) return 0;
            return this.#response.status;
        }

        get statusText() {
            if (!this.#response) return "";
            return this.#response.statusText;
        }

        get upload() {
            return this.#upload;
        }
    }

    const URLAttributes = {
        action: ["FORM"],
        cite: ["BLOCKQUOTE", "DEL", "INS", "Q"],
        data: ["OBJECT"],
        formAction: ["BUTTON", "INPUT"],
        href: ["AREA", "BASE", "LINK"],
        poster: ["VIDEO"],
        src: ["AUDIO", "EMBED", "IFRAME", "IMG", "INPUT", "SCRIPT", "SOURCE", "TRACK", "VIDEO"]
    };
    function replaceAttrs(doc, frameURL) {
        doc.querySelectorAll("*").forEach((el) => {
            for (const [attr, els] of Object.entries(URLAttributes)) {
                if (el.tagName === "A" && attr === "href") {
                    var newURL = `javascript:redirect(\`${new URL(el.getAttribute(attr), frameURL).href}\`)`;
                } else if (el.hasAttribute(attr) && (els.includes(el.tagName) || els == null)) {
                    var newURL = new URL(el.getAttribute(attr), frameURL).href;
                } else {
                    continue;
                }
                if (newURL !== el.getAttribute(attr)) {
                    el.setAttribute(attr, newURL);
                }
            }
        });
    }

    const frameScript = ""; /* `
        console.log(XMLHttpRequest);
        console.log(fetch);
        console.log(replaceAttrs);
    `; */

    function proxyFrame(frameElement, frameURL) {
        client.fetch(frameURL).then((res) => res.text().then((html) => {
            const doc = new DOMParser().parseFromString(html, "text/html");
            replaceAttrs(doc, frameURL);
        
            const script = document.createElement("script");
            script.textContent = frameScript;

            doc.head.insertBefore(script, doc.head.firstChild);
            frameElement.srcdoc = doc.documentElement.outerHTML;

            const proxyFuncs = {
                XMLHttpRequest: class extends proxyXHR {
                    constructor() {
                        super(frameURL);
                    }
                },
                fetch: client.fetch.bind(client),
                replaceAttrs: replaceAttrs.bind(globalThis, doc, frameURL),
                redirect: (url) => proxyFrame(frameElement, url)
            }
            document.body.appendChild(frame);
            for (const [orig, proxy] of Object.entries(proxyFuncs)) {
                frame.contentWindow[orig] = proxy;
            }
        }, (err) => console.error("Error reading response text:", err)), (err) => console.error("Error fetching URL:", err));
    }

    const frame = document.createElement("iframe");
    document.body.appendChild(frame);
    proxyFrame(frame, new URLSearchParams(window.location.search).get("url") || "https://www.apple.com/");
}, (err) => console.error("Error initializing epoxy-tls:", err)), (err) => console.error("Error loading epoxy-tls:", err));