importScripts('./WorkerApp.js');
importScripts('https://registry.npmmirror.com/@zip.js/zip.js/2.7.47/files/dist/zip.min.js');
new class WorkerAppZip extends WorkerApp {
    constructor() {
        super('zip-worker');
        this.onRun();
    }
    /**
     * 创建GB2312编码集
     * @returns 
     */
    GB_byte() {
        let ranges = [
            [0xA1, 0xA9, 0xA1, 0xFE],
            [0xB0, 0xF7, 0xA1, 0xFE],
            [0x81, 0xA0, 0x40, 0xFE],
            [0xAA, 0xFE, 0x40, 0xA0],
            [0xA8, 0xA9, 0x40, 0xA0],
            [0xAA, 0xAF, 0xA1, 0xFE],
            [0xF8, 0xFE, 0xA1, 0xFE],
            [0xA1, 0xA7, 0x40, 0xA0],
        ];
        let codes = new Uint16Array(23940);
        let i = 0;
        for (let [b1Begin, b1End, b2Begin, b2End] of ranges) {
            for (let b2 = b2Begin; b2 <= b2End; b2++) {
                if (b2 !== 0x7F) {
                    for (let b1 = b1Begin; b1 <= b1End; b1++) {
                        codes[i++] = b2 << 8 | b1;
                    }
                }
            }
        }
        let table = new Uint16Array(65536);
        let gbkstr = new TextDecoder('gbk').decode(codes.buffer);
        for (let i = 0; i < gbkstr.length; i++) {
            table[gbkstr.codePointAt(i)] = codes[i];
        }
        gbkstr = null;
        codes = null;
        return table;
    }
    /**
     * 把字符变为GB2312编码二进制
     * @param {*} str 
     * @returns 
     */
    GB_encode(str) {
        if (!this.gb2312) {
            this.gb2312 = this.GB_byte();
        }
        let buf = [];
        for (let i = 0; i < str.length; i++) {
            const code = str.charCodeAt(i);
            if (code < 0x80) {
                buf.push(code);
                continue;
            }
            const gbk = this.gb2312.at(code);
            if (gbk) {
                buf.push(gbk, gbk >> 8);
            } else if (code === 8364) {
                buf.push(0x80);
            } else {
                buf.push(63);
            }
        }
        return new Uint8Array(buf);
    }
    onMedthod(data, port) {
        if (data instanceof Array || data && data.constructor === Object) {
            return this.callMethod('toblob', data, port);
        } else if (data && data.buffer || data instanceof Blob || data instanceof Uint8Array) {
            return this.callMethod('unpack', data, port);
        }
    }
    methods = new Map(
        Object.entries({
            async unpack(data, port) {
                let { result, password, id, encode, mode } = data;
                const ReaderList = await new zip.ZipReader(new zip.BlobReader(result instanceof Blob ? result : new Blob([result]))).getEntries({
                    decodeText(buf, encoding) {
                        let text = new TextDecoder('utf-8').decode(buf);
                        let newbuf = new TextEncoder().encode(text);
                        return newbuf.byteLength > buf.byteLength ? new TextDecoder('gb18030').decode(buf) : text;
                    }
                }).catch(e => null);
                if (ReaderList) {
                    const getData = (entry) => {
                        let rawPassword;
                        if (entry.encrypted) {
                            if (password) {
                                if (password instanceof ArrayBuffer) password = new Uint8Array(password);
                                rawPassword = password instanceof Uint8Array ? password : entry.filenameUTF8 == false ? this.GB_encode(password) : undefined;
                            }
                        }
                        return entry.getData(new zip.Uint8ArrayWriter(), {
                            rawPassword,
                            password: password && !rawPassword && entry.encrypted ? password : undefined,
                            onprogress: (current, total) => port.postMessage({ current, total, file: entry.filename })
                        }).catch(async e => {
                            let msg = e.message;
                            if (password === false) return;
                            if (msg == zip.ERR_INVALID_PASSWORD || msg == zip.ERR_ENCRYPTED) {
                                if (password instanceof Uint8Array) password = new TextDecoder('gbk').decode(password);
                                password = await this.getFeedback(port, { method: 'password', password: password || '' });
                                if (password) {
                                    if (entry.filenameUTF8 == false) password = this.GB_encode(password);
                                    return await getData(entry);
                                } else {
                                    password = false;
                                }
                            }
                        });
                    }
                    if (mode) {
                        let newresult = new Map();
                        let buffers = [];
                        for (let entry of ReaderList) {
                            if (entry.directory) continue;
                            let data = await getData(entry);
                            if (data) {
                                newresult.set(entry.filename, data);
                                buffers.push(data.buffer);
                            }
                        }
                        port.postMessage({
                            result: newresult,
                            ready: true,
                            id
                        }, buffers);
                        port.close();
                        return;
                    } else {
                        for (let entry of ReaderList) {
                            if (entry.directory) continue;
                            let data = await getData(entry);
                            if (data) {
                                port.postMessage({
                                    result: data,
                                    file: entry.filename,
                                    ready: false,
                                    id
                                }, [data.buffer]);
                            }
                        }
                    }
                }
                port.postMessage({
                    result: false,
                    ready: true,
                    id
                });
                port.close();
            },
            async toblob(data, port) {
                let { result, password, id, encode, filename } = data;
                if (!filename) filename = 'example';
                const zipFileWriter = new zip.BlobWriter('application/x-zip-compressed');
                const zipWriter = new zip.ZipWriter(zipFileWriter);
                if (result && result.constructor === Object) result = new Map(Object.entries(result));
                await Promise.all(Array.from(result, file => {
                    if (file instanceof Blob) {
                        zipWriter.add(
                            file.name,
                            new zip.BlobReader(file),
                            {
                                onprogress: (current, total) => port.postMessage({ current, total, file: file.name, id }),
                                password
                            }
                        )
                    } else if (file instanceof Array) {
                        zipWriter.add(
                            file[0],
                            new zip.BlobReader(file[1] instanceof Blob ? file[1] : new Blob([file[1]])),
                            {
                                onprogress: (current, total) => port.postMessage({ current, total, file: file[0], id }),
                                password
                            }
                        )
                    }
                }));
                await zipWriter.close();
                let file = new File([await zipFileWriter.getData()], filename + '.zip');
                port.postMessage({ result: file, id });
                port.close();
            },
            async open(data, port) {
                this.zipWriter = new zip.ZipWriter(new zip.BlobWriter());
                return true;
            },
            async add(data, port) {
                this.zipWriter = new zip.ZipWriter(new zip.BlobWriter());
                if (data.result instanceof Blob) {
                    await this.zipWriter.add(data.result.name, new zip.BlobReader(data.result));
                } else {
                    await this.zipWriter.add(data.filename, new zip.Uint8ArrayrReader(data.result));
                }
                return true;
            },
            async close(data, port) {
                await this.zipWriter.close();
                let file = new File([await zipFileWriter.getData()], filename + '.zip', { type: 'application/x-zip-compressed' });
                port.postMessage({ result: file, id: data.id }, [file]);
            },
            publicMethod() {
                return ['upack', 'toblob', 'open', 'add', 'close'];
            }

        })
    );
}