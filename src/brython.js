if (typeof _epoxyPolyfillClient === "undefined") {
    console.log("loading epoxy-tls from Brython polyfill");
    var _epoxyPolyfillClient = null, _epoxyPolyfillQueue = [];
    import("https://cdn.jsdelivr.net/npm/@mercuryworkshop/epoxy-tls/full/epoxy-bundled.min.js").then((et) => et.default().then(() => {
        const options = new et.EpoxyClientOptions({
            user_agent: navigator.userAgent,
            wisp_v2: true,
            udp_extension_required: true
        });
        _epoxyPolyfillClient = new et.EpoxyClient("wss://wisp.mercurywork.shop", options);
        while (_epoxyPolyfillQueue.length > 0) {
            _epoxyPolyfillQueue.shift()();
        }
        console.log("epoxy-tls loaded successfully")
    }, (err) => console.error("Error initializing epoxy-tls:", err)), (err) => console.error("Error loading epoxy-tls:", err));
}

{
let oldBrowser = $B.imported.browser;
$B.imported.browser = new Proxy(oldBrowser, {
    set(target, prop, value) {
        target[prop] = value;
        if (prop == "ajax" && $B.imported.browser.ajax?.ajax?.$factory !== undefined) {
            $B.imported.browser = oldBrowser;
            const ajaxCls = $B.imported.browser.ajax.ajax;
            ajaxCls.$factory = function() {
                var res = {
                    __class__: ajaxCls,
                    __dict__: $B.empty_dict(),
                    headers: {}
                };
                res.js = new class extends EventTarget {
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

                    constructor() {
                        super();
                        this.#init_internal();
                        this.#mime_type = null;

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
                        if (async === false) //erroring here is actually permitted by spec
                            throw new DOMException("InvalidAccessError");

                        this.#init_internal();
                        this.readyState = this.OPENED;
                        this.#req_url = new URL(url, location.href);
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

                        try {
                            const fetchReq = () => {_epoxyPolyfillClient.fetch(this.#req_url, this.#req_options).then((res) => {
                                this.#response = res;
                                this.readyState = this.HEADERS_RECEIVED;
                                this.readyState = this.LOADING;

                                if (this.#aborted) return;
                                this.#emit_event(new ProgressEvent("loadstart"));
                                this.#response.arrayBuffer().then((data) => {
                                    this.#response_data = data;
                                    this.#emit_event(new ProgressEvent("progress"));
                                    this.readyState = this.DONE;
                                    this.#emit_event(new ProgressEvent("load"));
                                    this.#emit_event(new ProgressEvent("loadend"));
                                });
                            })};
                            _epoxyPolyfillClient != null ? fetchReq() : _epoxyPolyfillQueue.push(fetchReq);
                        } catch (e) {
                            this.#emit_event(new ProgressEvent("error"));
                        }
                    }

                    setRequestHeader(header, value) {
                        if (!this.#req_options.headers) this.#req_options.headers = {};
                        this.#req_options.headers[header] = value;
                    }

                    set readyState(value) {
                        if (value !== this.#ready_state) {
                            this.#ready_state = value;
                            if (this.responseType == "" || this.responseType == "text") {
                                res.js.text = this.responseText;
                            }
                            let timer = this.$requestTimer;
                            if (value == 0 && this.onuninitialized) {
                                this.onuninitialized(res);
                            } else if (value == 1 && this.onloading) {
                                this.onloading(res);
                            } else if (value == 2 && this.onloaded) {
                                this.onloaded(res);
                            } else if (value == 3 && this.oninteractive) {
                                this.oninteractive(res);
                            } else if (value == 4 && this.oncomplete) {
                                if (timer !== null)
                                    window.clearTimeout(timer);
                                this.oncomplete(res);
                            }
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
                return res;
            };
        }
        return true;
    }
});
}