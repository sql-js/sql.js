### Worker快速使用 ###
> cdn使用阿里云 https://npmmirror.com/  
> IOS版本要求15++  
> 如果版本更新修改 SQLite3.js  
> 自定义响应方法修改 WorkerAppSQLite.js 中的 `methods = new Map(...);`  
> 推荐使用serviceWorker缓存cdn文件,避免长时间加载  
> 推荐使用场景如`JQ-easyui`这种仿生App,异步构建页面.如果直接显示则需要在serviceWorker中使用,缺点你也懂得,serviceWorker中不能垃圾回收,必须常驻加载SQLite.
```javascript
import './changeWorker.js';
//创建表结构
const tablelist = {
        data: {
            id: 'integer primary key autoincrement',
            title: 'char',
            type: 'char',
            url: 'char',
            img: 'char',
            time:'char',
            source: 'char',
        },
        tag: {
            name: 'char',
            num: 'int'
    }
};
//设置 保存文件名
const sqlfile = 'my.sqlite3';

async openSQL() {
    const worker = await (new Worker(self.jspath + 'Worker/WorkerAppSQLite.js', { name: 'SQLite-worker' }).initMessage());
    await worker.postMethod('setFile',sqlfile);
    if (!(await worker.postMethod('install', true))) {
        await worker.postMethod('createList',this.tablelist);
        await worker.postMethod('savedata')
    }
    await worker.publicMethod();
    return worker;
}

const worker = await this.openSQL(); // 创建并初始化
console.log(worker.methods.key()); //显示所有公共方法 具体请看SQLite3.js
console.log(await worker.callMethod('selectSQL','data')); //输出所有data数据

await worker.getFeedback({
    method:'importFile',
    result:file,//导入数据文件 SQLite3文件 或者 json 数据 支持zip压缩文件
    password:undefined,//可选 zip解压密码
    mode:0,//or 1
    tablelist,
});
worker.postMethod('exitworker'); //关闭并退出worker

```

### 关于分享/下载下载 ###
> 因为是以caches方式保存,如果使用了serviceWorker,可以实现虚拟下载

```javascript
//前台

function postdown(action,param){
        let elm = document.createElement('form');
        elm.hidden = true;
        elm.action = action;
        elm.name = 'postdown';
        elm.method = 'POST';
        elm.enctype = 'text/plain';
        //elm.target = '_blank';
        elm.innerHTML = Object.entries(param).map(entry=>`<input type="hidden" name="${entry[0]}" value="${entry[1]}">`).join('');
        document.body.appendChild(elm);
        elm.submit();
        //elm.remove();
}
postdown(sqlfile,{cache_name:'cache-worker'});

//serviceWorker.js拦截
//self.addEventListener('fetch',function(event){
const request = event.request;
if(request.method=='POST'){
    if(request.headers.get('content-type') == 'text/plain'){
        return event.respondWith(
            new Promise(async back=>{
                const response = request.clone();
                const text = new URLSearchParams((await response.text()).replace(/[\r\n]+/,'&'));
                const cachename = text.get('cache_name');
                if(cachename){
                    if(await caches.has(cachename)){
                        const cache = await caches.open(cachename);
                        const response =  await cache.match(request.url);
                        if(response){
                            back(response);
                        }
                    }
                    back(new Response(undefined,{status:404}));
                }
                back(return fetch(request));
            });
        );
    }
}
//});
```