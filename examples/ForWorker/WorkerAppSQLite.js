importScripts('./WorkerApp.js');
importScripts('./changeWorker.js');
importScripts('./SQLite3.js');
const AppSQL = new class WorkerAppSQLite extends WorkerApp {
    constructor() {
        super('sql-lite');
        const App = this;
        App.datafile = 'data.sqlite3';
        App.functions.set('onInitialized', async function (back) {
            await SQLite3Ready;
            back(true);
        });
        App.onRun();
    }
    methods = new Map(
        Object.entries({
            isCreate(data, port) {
                return this.database instanceof self.SQLite3;
            },
            async setFile(data, port) {
                this.datafile = data.result;
                return await this.callMethod('isFile');
            },
            async isFile() {
                return await this.cache_has(this.datafile);

            },
            async install(data) {
                this.callMethod('SQLite_setMethod');
                if (data.result === true) {
                    let u8 = await this.cache_read(this.datafile);
                    if (u8 instanceof Uint8Array && u8.byteLength>1) {
                        let mime2 = new TextDecoder().decode(u8.slice(0, 6));
                        if (mime2 != 'SQLite') {
                            u8 = undefined;
                        }
                    }else{
                        u8 = undefined;
                    }
                    this.database = new self.SQLite3(u8);
                    if (!u8) return false;
                } else if (data.result && typeof data.result === 'string') {
                    let response = await fetch(data.result).catch(e => undefined);
                    if (response && response.status == 200) response = new Uint8Array(await response.arrayBuffer());
                    this.database = new self.SQLite3(response);
                    return response ? true : false;
                } else {
                    this.database = new self.SQLite3(data.result);
                    return data.result ? true : false;
                }
                return true;
            },
            async reInstall(data) {
                this.callMethod('database_close');
                if (data.result && data.result.byteLength) {
                    this.database = new self.SQLite3(data.result);
                } else {
                    let u8 = await this.cache_read(this.datafile);
                    this.database = new self.SQLite3(u8);
                }
                return true;
            },
            SQLite_setMethod() {
                ['run', 'exec'].concat(Reflect.ownKeys(self.SQLite3.prototype)).forEach(v => {
                    if(v=>v.indexOf('_')===-1&&v!='constructor'){
                        this.methods.set(v, new Function('data', 'port', 'return this.database.' + v + '.apply(this.database,data.result instanceof Array?data.result:[data.result])'));
                    }
                })
            },
            publicMethod() {
                return Array.from(this.methods.keys()).filter(v=>v.indexOf('_')===-1);
            },
            async closeworker(data, port) {
                port.postMessage({
                    id: data.id,
                    result: true
                });
                self.close();
                throw 'close';
            },
            async savedata(){
                return await this.cache_write(this.datafile, this.database.export(), 'sqlite3')?true:false;
            },
            database_close(){
                this.database&&this.database.close();
            },
            async save2exit(data, port) {
                await this.callMethod('savedata');
                this.callMethod('database_close');
                port.postMessage({
                    id: data.id,
                    result: true
                });
                self.close();
                throw 'close';
            },
            async exitworker(data, port) {
                this.callMethod('database_close');
                port.postMessage({
                    id: data.id,
                    result: true
                });
                self.close();
                throw 'close';
            },
            clear2exit(data, port) {
                this.callFunc('cache_remove', this.datafile);
                this.callMethod('database_close');
                port.postMessage({
                    id: data.id,
                    result: true
                });
                self.close();
                throw 'close';
            },
            async importFile(data, port) {
                console.log(data);
                const file = data.result;
                const mode = data.mode;
                const tablelist = data.tablelist;
                const password = data.password;
                const mime = await (file.slice(0, 4).text());
                const keylist = Object.keys(tablelist.data);
                if (mime == 'PK') {
                    const datas = await this.unzip(file,password);
                    if (datas && datas.size) {
                        for (let item of datas) {
                            await this.callMethod('import_sql_buf', item[1], mode, keylist);
                        }
                    }
                } else {
                    await this.callMethod('import_sql_buf', new Uint8Array(await file.arrayBuffer()), mode, keylist);
                }
                return await this.callMethod('savedata');
            },
            async import_sql_buf(buf, mode, keylist) {
                let mime = new TextDecoder().decode(buf.slice(0, 6));
                if (mime == 'SQLite') {
                    await this.cache_write(sqlfile, file, 'sqlite3');
                } else if (mime.charAt(0) == '{' || mime.charAt(0) == '[') {
                    let json = JSON.parse(new TextDecoder().decode(buf));
                    if (json && json.constructor === Object) {
                        json = Object.values(json);
                    }
                    this.callMethod('import_sql_json', json, mode, keylist);
                }

            },
            import_sql_json(json, mode, keylist) {
                let keys = mode === 1 ? keylist.slice(1) : keylist;
                let sqlstr = 'INSERT INTO `data` (' + keys.map(v => '`' + v + '`').join(',') + ') VALUES (' + (keys.map(v => '?').join(',')) + ')';
                for (let item of json) {
                    const sqlarr = [];
                    keys.forEach(v => {
                        sqlarr.push(item[v] || '')
                    });
                    if (mode === 0 && item['id']) {
                        this.database.run('DELETE FROM `data` WHERE `id` = ?', [item['id']]);
                    }
                    this.database.run(sqlstr, sqlarr);
                }
            }
        })
    );
}