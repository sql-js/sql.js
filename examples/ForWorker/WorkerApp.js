class WorkerApp {
    feedback = new Map;
    methods = new Map;
    shareports = [];
    isLocal = /(127\.0\.0\.1|localhost|local\.nenge\.net)/.test(location.host) || /(cdn|npm)/.test(location.host);
    cache_name = 'cache-worker';
    idb_name = 'worker-datas';
    constructor(name) {
        this.idb_table = name || 'files';
        this.callFunc('get_root');
    }
    isOrigin(url) {
        return url.indexOf(location.origin) !== -1
    }
    isMethod(method) {
        return this.methods && this.methods.has(method);
    }
    callMethod(method, ...arg) {
        if (this.isMethod(method)) {
            return this.methods.get(method).apply(this, arg);
        }
    }
    isFeedback(method) {
        return this.feedback && this.feedback.has(method);
    }
    async callFeedback(method, ...arg) {
        if (this.isFeedback(method)) {
            let result = this.feedback.get(method).apply(this, arg);
            if (result instanceof Promise) {
                result = await result;
            }
            this.feedback.delete(workerId);
            return result;
        }
    }
    callFunc(method, ...arg) {
        const func = this.functions.get(method);
        if (func instanceof Function) {
            return func.apply(this, arg);
        }
        return func;
    }
    get state() {
        return true;
    }
    set state(bool) {

    }
    onRun() {
        if (self.postMessage) {
            self.addEventListener('message', e => this.onMessage(e));
            this.callFunc('onInitialized',()=>this.callFunc('complete',self));
        } else {
            self.addEventListener('connect',e => this.callFunc('set_share_port', e));
        }
    }
    /**
     * @param {MessageEvent} e 
     * @returns 
     */
    async onMessage(e) {
        const data = e.data;
        const port = e.source || e.target;
        if (data && data.constructor === Object) {
            if (await this.onMethodBack(data, port)) return;
            if (this.onFeedBack(data, port)) return;
        }
        if (this.onMedthod instanceof Function) return this.onMedthod(data, port);
    }
    onFeedBack(data, port) {
        const id = data.workerId || data.id;
        if (this.isFeedback(id)) {
            this.callFeedback(id, data, port);
            return true;
        }
    }
    async onMethodBack(data, port) {
        const method = data.method;
        if (this.isMethod(method)) {
            const result = await this.callMethod(method, data, port);
            const transf = [];
            if (result !== undefined) {
                if (result.byteLength) {
                    transf.push(result.buffer || result);
                }
                if (data.id) {
                    port.postMessage({ id: data.id, result }, transf);
                }
                if (data.workerId) {
                    port.postMessage({ workerId: data.workerId, result }, transf);
                }
            }
            return true;
        }
    }
    async getMessage(port, result, method) {
        return await this.getFeedback(port, { result, method });
    }
    addFeedback(id, back, error) {
        this.feedback.set(id, function (data) {
            if (data.error && error instanceof Function) return error(data.error);
            if (back instanceof Function) return back(data.result);
        });
    }
    async getFeedback(port, result, transf) {
        return new Promise((back, error) => {
            const workerId = this.callFunc('uuid');
            this.addFeedback(workerId, back, error);
            result.workerId = workerId;
            port.postMessage(result, transf);
        });
    }
    /**
     * 写入内容
     * @param {string} name 
     * @param {*} contents 
     * @param {string|undefined}} mime 
     * @param {string|undefined} cachename
     * @returns 
     */
    async cache_write(name, contents, mime, cachename) {
        return await this.callFunc('cache_write', name, contents, mime, cachename);
    }
    /**
     * 读取内容
     * @param {string} name 
     * @param {string|undefined} type
     * @param {string|undefined} cachename
     * @returns 
     */
    async cache_read(name, type, cachename) {
        return await this.callFunc('cache_read', name, type, cachename);
    }
    async cache_has(name, cachename) {
        return await this.callFunc('cache_has', name, cachename);
    }
    async unzip(file, password) {
        if (typeof file === 'string') {
            let response = await fetch(file);
            if (!response || response.status != 200) {
                throw response.statusText;
            }
            file = await response.blob();
        }
        return new Promise((back, error) => {
            const work = new Worker(this.worker_root + 'WorkerAppZip.js');
            work.addEventListener('message', event => {
                const data = event.data;
                const work = event.target;
                if (data.workerId && data.password != undefined) {
                    work.postMessage({ result: false, workerId: data.workerId });
                } else if (data.ready === true) {
                    back(data.result);
                } else if (data.error) {
                    error(data.error);
                    work.terminate();
                }
            });
            work.postMessage({ method: 'unpack', id: 2, result: file, password, mode: true });
        });
    }
    async hasItem(name) {
        return await this.callFunc('idb_hasItem', name);
    }
    async getItem(name) {
        return await this.callFunc('idb_getItem', name);
    }
    async setItem(name, contents) {
        return await this.callFunc('idb_setItem', name, contents);
    }
    functions = new Map(Object.entries({
        /**
         * 写入内容
         * @param {string} name 
         * @param {*} contents 
         * @param {string|undefined}} mime 
         * @param {string|undefined} cachename
         * @returns 
         */
        async cache_write(name, contents, mime, cachename) {
            let type;
            switch (mime) {
                case 'html':
                case 'text':
                case 'javascript':
                    type = 'text/' + mime;
                    break;
                case 'png':
                case 'webp':
                    type = 'image/' + mime;
                    break;
                case 'sqlite3':
                    type = 'application/vnd.' + mime;
                    break;
                default:
                    type = mime && mime.split('/').length > 1 ? mime : 'application/octet-stream';
                    break;
            }
            return this.callFunc('cache_put', name, new File([contents], name, { type }), cachename);
        },
        /**
         * 读取内容
         * @param {string} name 
         * @param {string|undefined} type
         * @param {string|undefined} cachename
         * @returns 
         */
        async cache_read(name, type, cachename) {
            let response = await this.callFunc('cache_response', name, cachename);
            if (response instanceof Response) {
                switch (type) {
                    case 'text':
                        return response.text();
                        break;
                    case 'json':
                        return response.json();
                        break;
                    case 'blob':
                        return response.blob();
                        break;
                    case 'buffer':
                        return response.arrayBuffer();
                        break;
                    default:
                        return new Uint8Array(await response.arrayBuffer());
                        break;
                }
            }
            return;
        },
        async cache_has(name, cachename) {
            return await this.callFunc('cache_response', name, cachename) instanceof Response ? true : false;
        },

        /**
         * 读取Response内容
         * @param {string} name 
         * @param {string|undefined} cachename
         * @returns 
         */
        async cache_response(name, cachename) {
            const cache = await this.callFunc('cache_open', cachename);
            return cache && cache.match(location.origin + '/' + name);
        },
        /**
         * 删除Response内容
         * @param {string} name 
         * @param {string|undefined} cachename
         * @returns 
         */
        async cache_remove(name, cachename) {
            const cache = await this.callFunc('cache_open', cachename);
            return cache ? cache.delete(location.origin + '/' + name) : false;
        },
        async cache_open(cachename, write) {
            const cacheName = cachename || this.cache_name;
            if (write || await caches.has(cacheName)) {
                return caches.open(cacheName);
            }
        },
        /**
         * 缓存储存 写入BLOB
         * @param {string} name 
         * @param {Blob} file 
         * @param {string|undefined} cachename 
         * @returns 
         */
        async cache_put(name, file, cachename) {
            const cache = await await this.callFunc('cache_open', cachename, !0);
            return await cache.put(
                location.origin + '/' + name,
                new Response(
                    file,
                    {
                        status: 200,
                        statusText: 'ok',
                        headers: {
                            'Content-Length': file.size,
                            'content-type': file.type,
                        }
                    }
                )
            ),true;
        },
        async idb_open(version) {
            if (this.idb instanceof Promise) return await this.idb;
            if (!this.idb) {
                this.idb = new Promise(resolve => {
                    let req = indexedDB.open(this.idb_name, version);
                    req.addEventListener("upgradeneeded", e => {
                        const db = req.result;
                        if (!db.objectStoreNames.contains(this.idb_table)) {
                            const store = db.createObjectStore(this.idb_table);
                            store.createIndex('timestamp', 'timestamp', { "unique": false });
                        }
                    }, { once: true });
                    req.addEventListener('success', async e => {
                        const db = req.result;
                        if (!db.objectStoreNames.contains(this.idb_table)) {
                            let version = db.version += 1;
                            db.close();
                            return resolve(await this.callFunc('idb_open', version));
                        }
                        return resolve(db);
                    }, { once: true });
                });
            }
            return this.idb;
        },
        async idb_selectStore(ReadMode) {
            const db = await this.callFunc('idb_open');
            const transaction = db.transaction([this.idb_table], ReadMode ? 'readonly' : "readwrite");
            return transaction.objectStore(this.idb_table);
        },
        async idb_readyOnly() {
            return this.callFunc('idb_selectStore', !0);
        },
        async idb_readyWrite() {
            return this.callFunc('idb_selectStore');
        },
        async idb_readItem(name) {
            return new Promise(async (resolve, reject) => {
                const transaction = await this.callFunc('idb_readyOnly');
                const request = transaction.get(name);
                request.onsuccess = function () {
                    resolve(this.result);
                }
                request.onerror = function (e) {
                    reject(this.result);
                }
            });

        },
        async idb_hasItem(name) {
            return new Promise(async (resolve, reject) => {
                const transaction = await this.callFunc('idb_readyOnly');
                const request = transaction.getKey(name);
                request.onsuccess = function () {
                    resolve(this.result == name);
                }
                request.onerror = function (e) {
                    reject(this.result);
                }
            });
        },
        async idb_getItem(name) {
            const result = await this.callFunc('idb_readItem', name);
            return result && result.contents || result;
        },
        async idb_setItem(name, contents) {
            return new Promise(async (resolve, reject) => {
                const transaction = await this.callFunc('idb_readyWrite');
                const request = transaction.put({ contents, timestamp: new Date }, name);
                request.onsuccess = function () {
                    resolve(this.result)
                }
                request.onerror = function (e) {
                    reject(this.result);
                }
            });
        },
        async idb_removeItem(name) {
            return new Promise(async (resolve, reject) => {
                const transaction = await this.callFunc('idb_readyWrite');
                const request = transaction.delete(name);
                request.onsuccess = function () {
                    resolve(this.result == name);
                }
                request.onerror = function (e) {
                    reject(this.result);
                }
            });
        },
        async idb_fetch(url) {
            let contents = await this.callFunc('getItem', url);
            if (!contents) {
                let response = await fetch(url);
                if (response && response.status == 200) {
                    contents = /\.wasm$/.test(url) ? new Uint8Array(await response.arrayBuffer()) : await response.blob();
                    this.setItem(url, contents);
                } else {
                    throw 'file error';
                }
            }
            return contents;
        },
        get_root() {
            this.worker_root = self.location.href.split('/').slice(0, -1).join('/') + '/';
            this.js_root = self.location.href.split('/').slice(0, -2).join('/') + '/';
        },
        uuid() {
            return crypto ? crypto.randomUUID() : btoa(performance.now() + Math.random());
        },
        async set_share_port(e, fn) {
            e.source.onmessage = e => this.onMessage(e);
            this.callFunc('onInitialized',()=>this.callFunc('complete',e.source));
        },
        complete(port){
            port.postMessage('complete');
        }
    }));
}