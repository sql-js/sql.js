
// We are modularizing this manually because the current modularize setting in Emscripten has some issues:
// https://github.com/kripken/emscripten/issues/5820
// In addition, When you use emcc's modularization, it still expects to export a global object called `Module`,
// which is able to be used/called before the WASM is loaded.
// The modularization below exports a promise that loads and resolves to the actual sql.js module.
// That way, this module can't be used before the WASM is finished loading.

// We are going to define a function that a user will call to start loading initializing our Sql.js library
// However, that function might be called multiple times, and on subsequent calls, we don't actually want it to instantiate a new instance of the Module
// Instead, we want to return the previously loaded module

// TODO: Make this not declare a global if used in the browser
var initSqlJsPromise = undefined;

var initSqlJs = function (moduleConfig) {

    if (initSqlJsPromise){
      return initSqlJsPromise;
    }
    // If we're here, we've never called this function before
    initSqlJsPromise = new Promise(function (resolveModule, reject) {

        // We are modularizing this manually because the current modularize setting in Emscripten has some issues:
        // https://github.com/kripken/emscripten/issues/5820

        // The way to affect the loading of emcc compiled modules is to create a variable called `Module` and add
        // properties to it, like `preRun`, `postRun`, etc
        // We are using that to get notified when the WASM has finished loading.
        // Only then will we return our promise

        // If they passed in a moduleConfig object, use that
        // Otherwise, initialize Module to the empty object
        var Module = typeof moduleConfig !== 'undefined' ? moduleConfig : {};

        // EMCC only allows for a single onAbort function (not an array of functions)
        // So if the user defined their own onAbort function, we remember it and call it
        var originalOnAbortFunction = Module['onAbort'];
        Module['onAbort'] = function (errorThatCausedAbort) {
            reject(new Error(errorThatCausedAbort));
            if (originalOnAbortFunction){
              originalOnAbortFunction(errorThatCausedAbort);
            }
        };

        Module['postRun'] = Module['postRun'] || [];
        Module['postRun'].push(function () {
            // When Emscripted calls postRun, this promise resolves with the built Module
            resolveModule(Module);
        });

        // There is a section of code in the emcc-generated code below that looks like this:
        // (Note that this is lowercase `module`)
        // if (typeof module !== 'undefined') {
        //     module['exports'] = Module;
        // }
        // When that runs, it's going to overwrite our own modularization export efforts in shell-post.js!
        // The only way to tell emcc not to emit it is to pass the MODULARIZE=1 or MODULARIZE_INSTANCE=1 flags,
        // but that carries with it additional unnecessary baggage/bugs we don't want either.
        // So, we have three options:
        // 1) We undefine `module`
        // 2) We remember what `module['exports']` was at the beginning of this function and we restore it later
        // 3) We write a script to remove those lines of code as part of the Make process.
        //
        // Since those are the only lines of code that care about module, we will undefine it. It's the most straightforward
        // of the options, and has the side effect of reducing emcc's efforts to modify the module if its output were to change in the future.
        // That's a nice side effect since we're handling the modularization efforts ourselves
        module = undefined;

        // The emcc-generated code and shell-post.js code goes below,
        // meaning that all of it runs inside of this promise. If anything throws an exception, our promise will abort
var k;k||=typeof Module != 'undefined' ? Module : {};var aa=!!globalThis.window,ba=!!globalThis.WorkerGlobalScope,ca=globalThis.process?.versions?.node&&globalThis.process?.type!="renderer";
k.onRuntimeInitialized=function(){function a(f,h){lb(f,h instanceof Error?h.message:String(h),-1)}function b(f,h){switch(typeof h){case "boolean":dc(f,h?1:0);break;case "number":ec(f,h);break;case "string":fc(f,h,l(h),-1);break;case "object":if(h===null)mb(f);else if(h.length!=null){var p=da(h.length);t.set(h,p);hc(f,p,h.length,-1);x(p)}else lb(f,"Wrong API use : tried to return a value of an unknown type ("+h+").",-1);break;default:mb(f)}}function d(f,h){for(var p=[],r=0;r<f;r+=1){var u=z(h+4*r,
"i32"),w=ic(u);if(w===1||w===2)u=jc(u);else if(w===3)w=nb(u),u=kc(u),u=B(u,w,!0);else if(w===4){w=u;u=nb(w);w=lc(w);for(var E=new Uint8Array(u),J=0;J<u;J+=1)E[J]=t[w+J];u=E}else u=null;p.push(u)}return p}function c(f,h){this.Qa=f;this.db=h;this.Pa=1;this.nb=[]}function e(f,h){this.db=h;this.gb=ea(f);if(this.gb===null)throw Error("Unable to allocate memory for the SQL string");this.mb=this.gb;this.Ya=this.sb=null}function g(f){this.filename="dbfile_"+(4294967295*Math.random()>>>0);if(f!=null){var h=
this.filename,p="/",r=h;p&&(p=typeof p=="string"?p:fa(p),r=h?ha(p+"/"+h):p);h=ia(!0,!0);r=ja(r,h);f&&(typeof f=="string"&&(f=ka(f)),f.subarray||(f=new Uint8Array(f)),la(r,h|146),p=na(r,577),oa(p,f,0,f.length,0),pa(p),la(r,h))}this.handleError(y(this.filename,v));this.db=z(v,"i32");qb(this.db);this.hb={};this.Ta=new Map}function n(f,h){return f.replace(/[A-Z]/g,function(p){return p.toLowerCase()})+":"+h}function q(f){f.forEach(qa)}var v=C(4),m=k.cwrap,y=m("sqlite3_open","number",["string","number"]),
A=m("sqlite3_close_v2","number",["number"]),rb=m("sqlite3_exec","number",["number","number","number","number","number"]),nc=m("sqlite3_changes","number",["number"]),oc=m("sqlite3_sql","string",["number"]),pc=m("sqlite3_normalized_sql","string",["number"]),Pa=m("sqlite3_prepare_v2","number",["number","number","number","number","number"]),qc=m("sqlite3_bind_text","number",["number","number","number","number","number"]),sb=m("sqlite3_bind_blob","number",["number","number","number","number","number"]),
rc=m("sqlite3_bind_double","number",["number","number","number"]),sc=m("sqlite3_bind_int","number",["number","number","number"]),tc=m("sqlite3_bind_parameter_index","number",["number","string"]),uc=m("sqlite3_step","number",["number"]),vc=m("sqlite3_errmsg","string",["number"]),wc=m("sqlite3_column_count","number",["number"]),xc=m("sqlite3_data_count","number",["number"]),yc=m("sqlite3_column_double","number",["number","number"]),zc=m("sqlite3_column_text","number",["number","number"]),Ac=m("sqlite3_column_blob",
"number",["number","number"]),tb=m("sqlite3_column_bytes","number",["number","number"]),Bc=m("sqlite3_column_type","number",["number","number"]),Cc=m("sqlite3_column_name","string",["number","number"]),Dc=m("sqlite3_reset","number",["number"]),Ec=m("sqlite3_clear_bindings","number",["number"]),Fc=m("sqlite3_finalize","number",["number"]),ub=m("sqlite3_create_function_v2","number","number string number number number number number number number".split(" ")),ic=m("sqlite3_value_type","number",["number"]),
nb=m("sqlite3_value_bytes","number",["number"]),kc=m("sqlite3_value_text","number",["number"]),lc=m("sqlite3_value_blob","number",["number"]),jc=m("sqlite3_value_double","number",["number"]),ec=m("sqlite3_result_double","",["number","number"]),mb=m("sqlite3_result_null","",["number"]),fc=m("sqlite3_result_text","",["number","string","number","number"]),hc=m("sqlite3_result_blob","",["number","number","number","number"]),dc=m("sqlite3_result_int","",["number","number"]),lb=m("sqlite3_result_error",
"",["number","string","number"]),vb=m("sqlite3_aggregate_context","number",["number","number"]),qb=m("RegisterExtensionFunctions","number",["number"]),wb=m("sqlite3_update_hook","number",["number","number","number"]);c.prototype.bind=function(f){if(!this.Qa)throw"Statement closed";this.reset();return Array.isArray(f)?this.Kb(f):f!=null&&typeof f==="object"?this.Lb(f):!0};c.prototype.step=function(){if(!this.Qa)throw"Statement closed";this.Pa=1;var f=uc(this.Qa);switch(f){case 100:return!0;case 101:return!1;
default:throw this.db.handleError(f);}};c.prototype.Db=function(f){f==null&&(f=this.Pa,this.Pa+=1);return yc(this.Qa,f)};c.prototype.Tb=function(f){f==null&&(f=this.Pa,this.Pa+=1);if(typeof BigInt!=="function")throw Error("BigInt is not supported");return BigInt(this.Eb(f))};c.prototype.Eb=function(f){f==null&&(f=this.Pa,this.Pa+=1);var h=zc(this.Qa,f);f=tb(this.Qa,f);return B(h,f,!0)};c.prototype.getBlob=function(f){f==null&&(f=this.Pa,this.Pa+=1);var h=tb(this.Qa,f);f=Ac(this.Qa,f);for(var p=new Uint8Array(h),
r=0;r<h;r+=1)p[r]=t[f+r];return p};c.prototype.get=function(f,h){h=h||{};f!=null&&this.bind(f)&&this.step();f=[];for(var p=xc(this.Qa),r=0;r<p;r+=1)switch(Bc(this.Qa,r)){case 1:var u=h.useBigInt?this.Tb(r):this.Db(r);f.push(u);break;case 2:f.push(this.Db(r));break;case 3:f.push(this.Eb(r));break;case 4:f.push(this.getBlob(r));break;default:f.push(null)}return f};c.prototype.qb=function(){for(var f=[],h=wc(this.Qa),p=0;p<h;p+=1)f.push(Cc(this.Qa,p));return f};c.prototype.Cb=function(f,h){var p=this.get(f,
h);f=this.qb();return Object.fromEntries(f.map(function(r,u){return[r,p[u]]}))};c.prototype.Xb=function(){return oc(this.Qa)};c.prototype.Ub=function(){return pc(this.Qa)};c.prototype.run=function(f){f!=null&&this.bind(f);this.step();return this.reset()};c.prototype.yb=function(f,h){h==null&&(h=this.Pa,this.Pa+=1);var p=ea(f);this.nb.push(p);this.db.handleError(qc(this.Qa,h,p,l(f),0))};c.prototype.Jb=function(f,h){h==null&&(h=this.Pa,this.Pa+=1);var p=da(f.length);t.set(f,p);this.nb.push(p);this.db.handleError(sb(this.Qa,
h,p,f.length,0))};c.prototype.xb=function(f,h){h==null&&(h=this.Pa,this.Pa+=1);this.db.handleError((f===(f|0)?sc:rc)(this.Qa,h,f))};c.prototype.Mb=function(f){f==null&&(f=this.Pa,this.Pa+=1);sb(this.Qa,f,0,0,0)};c.prototype.zb=function(f,h){h==null&&(h=this.Pa,this.Pa+=1);switch(typeof f){case "string":this.yb(f,h);return;case "number":this.xb(f,h);return;case "bigint":this.yb(f.toString(),h);return;case "boolean":this.xb(f+0,h);return;case "object":if(f===null){this.Mb(h);return}if(f.length!=null){this.Jb(f,
h);return}}throw"Wrong API use : tried to bind a value of an unknown type ("+f+").";};c.prototype.Lb=function(f){var h=this;Object.keys(f).forEach(function(p){var r=tc(h.Qa,p);r!==0&&h.zb(f[p],r)});return!0};c.prototype.Kb=function(f){for(var h=0;h<f.length;h+=1)this.zb(f[h],h+1);return!0};c.prototype.reset=function(){this.freemem();return Ec(this.Qa)===0&&Dc(this.Qa)===0};c.prototype.freemem=function(){for(var f;(f=this.nb.pop())!==void 0;)x(f)};c.prototype.Za=function(){this.freemem();var f=Fc(this.Qa)===
0;delete this.db.hb[this.Qa];this.Qa=0;return f};e.prototype.next=function(){if(this.gb===null)return{done:!0};this.Ya!==null&&(this.Ya.Za(),this.Ya=null);if(!this.db.db)throw this.ib(),Error("Database closed");var f=ra(),h=C(4);sa(v);sa(h);try{this.db.handleError(Pa(this.db.db,this.mb,-1,v,h));this.mb=z(h,"i32");var p=z(v,"i32");if(p===0)return this.ib(),{done:!0};this.Ya=new c(p,this.db);this.db.hb[p]=this.Ya;return{value:this.Ya,done:!1}}catch(r){throw this.sb=B(this.mb),this.ib(),r;}finally{ta(f)}};
e.prototype.ib=function(){x(this.gb);this.gb=null};e.prototype["return"]=function(){this.Ya!==null&&(this.Ya.Za(),this.Ya=null);this.ib();return{done:!0}};e.prototype.Vb=function(){return this.sb!==null?this.sb:B(this.mb)};typeof Symbol==="function"&&typeof Symbol.iterator==="symbol"&&(e.prototype[Symbol.iterator]=function(){return this});g.prototype.run=function(f,h){if(!this.db)throw"Database closed";if(h){f=this.tb(f,h);try{f.step()}finally{f.Za()}}else{f=ea(f);try{this.handleError(rb(this.db,
f,0,0,v))}finally{x(f)}}return this};g.prototype.exec=function(f,h,p){if(!this.db)throw"Database closed";var r=ra(),u=null,w=null,E=null;try{E=w=ea(f);var J=C(4);for(f=[];z(E,"i8")!==0;){sa(v);sa(J);this.handleError(Pa(this.db,E,-1,v,J));var X=z(v,"i32");E=z(J,"i32");if(X!==0){var F=null;u=new c(X,this);for(h!=null&&u.bind(h);u.step();)F===null&&(F={columns:u.qb(),values:[]},f.push(F)),F.values.push(u.get(null,p));u.Za()}}return f}catch(Q){throw u&&u.Za(),Q;}finally{w&&x(w),ta(r)}};g.prototype.Qb=
function(f,h,p,r,u){typeof h==="function"&&(r=p,p=h,h=void 0);f=this.tb(f,h);try{for(;f.step();)p(f.Cb(null,u))}finally{f.Za()}if(typeof r==="function")return r()};g.prototype.tb=function(f,h){f=ea(f);try{sa(v),this.handleError(Pa(this.db,f,-1,v,0))}finally{x(f)}f=z(v,"i32");if(f===0)throw"Nothing to prepare";var p=new c(f,this);h!=null&&p.bind(h);return this.hb[f]=p};g.prototype.Yb=function(f){return new e(f,this)};g.prototype.Sb=function(){Object.values(this.hb).forEach(function(h){h.Za()});this.Ta.forEach(q);
this.Ta.clear();this.handleError(A(this.db));var f=ua(this.filename);this.handleError(y(this.filename,v));this.db=z(v,"i32");qb(this.db);return f};g.prototype.close=function(){this.db!==null&&(Object.values(this.hb).forEach(function(f){f.Za()}),this.Ta.forEach(q),this.Ta.clear(),this.ab&&(qa(this.ab),this.ab=void 0),this.handleError(A(this.db)),va("/"+this.filename),this.db=null)};g.prototype.handleError=function(f){if(f===0)return null;f=vc(this.db);throw Error(f);};g.prototype.Wb=function(){return nc(this.db)};
g.prototype.Pb=function(f,h){var p=n(f,h.length);this.Ta.has(p)&&(q(this.Ta.get(p)),this.Ta.delete(p));var r=wa(function(u,w,E){w=d(w,E);try{var J=h.apply(null,w)}catch(X){a(u,X);return}b(u,J)},"viii");this.Ta.set(p,[r]);this.handleError(ub(this.db,f,h.length,1,0,r,0,0,0));return this};g.prototype.Ob=function(f,h){function p(F){E.has(F)||E.set(F,r());return E.get(F)}var r=h.init||function(){return null},u=h.finalize||function(F){return F},w=h.step;if(!w)throw"An aggregate function must have a step function in "+
f;var E=new Map;h=n(f,w.length-1);this.Ta.has(h)&&(q(this.Ta.get(h)),this.Ta.delete(h));var J=wa(function(F,Q,Qa){var ma=vb(F,1),Ra=p(ma);Q=d(Q,Qa);Ra=[Ra].concat(Q);try{E.set(ma,w.apply(null,Ra))}catch(Hc){E.delete(ma),a(F,Hc)}},"viii"),X=wa(function(F){var Q=vb(F,1);try{var Qa=u(p(Q))}catch(ma){E.delete(Q);a(F,ma);return}b(F,Qa);E.delete(Q)},"vi");this.Ta.set(h,[J,X]);this.handleError(ub(this.db,f,w.length-1,1,0,0,J,X,0));return this};g.prototype.dc=function(f){this.ab&&(wb(this.db,0,0),qa(this.ab),
this.ab=void 0);if(!f)return this;this.ab=wa(function(h,p,r,u,w){switch(p){case 18:h="insert";break;case 23:h="update";break;case 9:h="delete";break;default:throw"unknown operationCode in updateHook callback: "+p;}r=B(r);u=B(u);if(w>Number.MAX_SAFE_INTEGER)throw"rowId too big to fit inside a Number";f(h,r,u,Number(w))},"viiiij");wb(this.db,this.ab,0);return this};c.prototype.bind=c.prototype.bind;c.prototype.step=c.prototype.step;c.prototype.get=c.prototype.get;c.prototype.getColumnNames=c.prototype.qb;
c.prototype.getAsObject=c.prototype.Cb;c.prototype.getSQL=c.prototype.Xb;c.prototype.getNormalizedSQL=c.prototype.Ub;c.prototype.run=c.prototype.run;c.prototype.reset=c.prototype.reset;c.prototype.freemem=c.prototype.freemem;c.prototype.free=c.prototype.Za;e.prototype.next=e.prototype.next;e.prototype.getRemainingSQL=e.prototype.Vb;g.prototype.run=g.prototype.run;g.prototype.exec=g.prototype.exec;g.prototype.each=g.prototype.Qb;g.prototype.prepare=g.prototype.tb;g.prototype.iterateStatements=g.prototype.Yb;
g.prototype["export"]=g.prototype.Sb;g.prototype.close=g.prototype.close;g.prototype.handleError=g.prototype.handleError;g.prototype.getRowsModified=g.prototype.Wb;g.prototype.create_function=g.prototype.Pb;g.prototype.create_aggregate=g.prototype.Ob;g.prototype.updateHook=g.prototype.dc;k.Database=g};var xa="./this.program",ya=(a,b)=>{throw b;},za=globalThis.document?.currentScript?.src;typeof __filename!="undefined"?za=__filename:ba&&(za=self.location.href);var Aa="",Ba,Ca;
if(ca){var fs=require("node:fs");Aa=__dirname+"/";Ca=a=>{a=Da(a)?new URL(a):a;return fs.readFileSync(a)};Ba=async a=>{a=Da(a)?new URL(a):a;return fs.readFileSync(a,void 0)};process.argv.length>1&&(xa=process.argv[1].replace(/\\/g,"/"));process.argv.slice(2);typeof module!="undefined"&&(module.exports=k);ya=(a,b)=>{process.exitCode=a;throw b;}}else if(aa||ba){try{Aa=(new URL(".",za)).href}catch{}ba&&(Ca=a=>{var b=new XMLHttpRequest;b.open("GET",a,!1);b.responseType="arraybuffer";b.send(null);return new Uint8Array(b.response)});
Ba=async a=>{if(Da(a))return new Promise((d,c)=>{var e=new XMLHttpRequest;e.open("GET",a,!0);e.responseType="arraybuffer";e.onload=()=>{e.status==200||e.status==0&&e.response?d(e.response):c(e.status)};e.onerror=c;e.send(null)});var b=await fetch(a,{credentials:"same-origin"});if(b.ok)return b.arrayBuffer();throw Error(b.status+" : "+b.url);}}var Ea=console.log.bind(console),D=console.error.bind(console),Fa,Ga=!1,Ha,Da=a=>a.startsWith("file://");
function Ia(){if(!t?.buffer?.resizable){var a=Ja.buffer;t=new Int8Array(a);Ka=new Int16Array(a);G=new Uint8Array(a);H=new Int32Array(a);I=new Uint32Array(a);La=new Float32Array(a);Ma=new Float64Array(a);K=new BigInt64Array(a)}}function Na(){var a=k.preRun;a&&(typeof a=="function"&&(a=[a]),Oa.push(...a));for(a=Oa;a.length>0;)a.shift()(k)}function Sa(){var a=k.postRun;a&&(typeof a=="function"&&(a=[a]),Ta.push(...a));for(a=Ta;a.length>0;)a.shift()(k)}
function Ua(a){k.onAbort?.(a);a=`Aborted(${a})`;D(a);Ga=!0;throw new WebAssembly.RuntimeError(a+". Build with -sASSERTIONS for more info.");}var Va;async function Wa(a){if(!Fa)try{var b=await Ba(a);return new Uint8Array(b)}catch{}if(a==Va&&Fa)a=new Uint8Array(Fa);else if(Ca)a=Ca(a);else throw"both async and sync fetching of the wasm failed";return a}
async function Xa(a,b){try{var d=await Wa(a);return await WebAssembly.instantiate(d,b)}catch(c){D(`failed to asynchronously prepare wasm: ${c}`),Ua(c)}}async function Ya(a){var b=Va;if(!Fa&&!Da(b)&&!ca)try{var d=fetch(b,{credentials:"same-origin"});return await WebAssembly.instantiateStreaming(d,a)}catch(c){D(`wasm streaming compile failed: ${c}`),D("falling back to ArrayBuffer instantiation")}return Xa(b,a)}
class Za{name="ExitStatus";constructor(a){this.message=`Program terminated with exit(${a})`;this.status=a}}
var t,Ta=[],Oa=[],$a=!0,ab=new TextDecoder,bb=(a,b,d,c)=>{d=b+d;if(c)return d;for(;a[b]&&!(b>=d);)++b;return b},G,B=(a,b,d)=>a?ab.decode(G.subarray(a,bb(G,a,b,d))):"",cb=(a,b)=>{for(var d=0,c=a.length-1;c>=0;c--){var e=a[c];e==="."?a.splice(c,1):e===".."?(a.splice(c,1),d++):d&&(a.splice(c,1),d--)}if(b)for(;d;d--)a.unshift("..");return a},ha=a=>{var b=a.charAt(0)==="/",d=a.slice(-1)==="/";(a=cb(a.split("/").filter(c=>!!c),!b).join("/"))||b||(a=".");a&&d&&(a+="/");return(b?"/":"")+a},db=a=>{var b=/^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/.exec(a).slice(1);
a=b[0];b=b[1];if(!a&&!b)return".";b&&=b.slice(0,-1);return a+b},eb=a=>a&&a.match(/([^\/]+|\/)\/*$/)[1],fb=()=>{if(ca){var a=require("node:crypto");return b=>(a.randomFillSync(b),0)}return b=>(crypto.getRandomValues(b),0)},gb=a=>(gb=fb())(a),hb=(...a)=>{for(var b="",d=!1,c=a.length-1;c>=-1&&!d;c--){d=c>=0?a[c]:"/";if(typeof d!="string")throw new TypeError("Arguments to path.resolve must be strings");if(!d)return"";b=d+"/"+b;d=d.charAt(0)==="/"}b=cb(b.split("/").filter(e=>!!e),!d).join("/");return(d?
"/":"")+b||"."},ib=a=>{var b=bb(a,0);return ab.decode(a.buffer?a.subarray(0,b):new Uint8Array(a.slice(0,b)))},jb=[],l=a=>{for(var b=0,d=0;d<a.length;++d){var c=a.charCodeAt(d);c<=127?b++:c<=2047?b+=2:c>=55296&&c<=57343?(b+=4,++d):b+=3}return b},L=(a,b,d,c)=>{if(!(c>0))return 0;var e=d;c=d+c-1;for(var g=0;g<a.length;++g){var n=a.codePointAt(g);if(n<=127){if(d>=c)break;b[d++]=n}else if(n<=2047){if(d+1>=c)break;b[d++]=192|n>>6;b[d++]=128|n&63}else if(n<=65535){if(d+2>=c)break;b[d++]=224|n>>12;b[d++]=
128|n>>6&63;b[d++]=128|n&63}else{if(d+3>=c)break;b[d++]=240|n>>18;b[d++]=128|n>>12&63;b[d++]=128|n>>6&63;b[d++]=128|n&63;g++}}b[d]=0;return d-e},ka=a=>{var b=Array(l(a)+1);a=L(a,b,0,b.length);b.length=a;return b},kb=[];function ob(a,b){kb[a]={input:[],output:[],fb:b};pb(a,xb)}
var xb={open(a){var b=kb[a.node.rdev];if(!b)throw new M(43);a.tty=b;a.seekable=!1},close(a){a.tty.fb.fsync(a.tty)},fsync(a){a.tty.fb.fsync(a.tty)},read(a,b,d,c){if(!a.tty||!a.tty.fb.Fb)throw new M(60);for(var e=0,g=0;g<c;g++){try{var n=a.tty.fb.Fb(a.tty)}catch(q){throw new M(29);}if(n===void 0&&!e)throw new M(6);if(n===null||n===void 0)break;e++;b[d+g]=n;if(n===10)break}e&&(a.node.atime=Date.now());return e},write(a,b,d,c){if(!a.tty||!a.tty.fb.ub)throw new M(60);try{for(var e=0;e<c;e++)a.tty.fb.ub(a.tty,
b[d+e])}catch(g){throw new M(29);}c&&(a.node.mtime=a.node.ctime=Date.now());return e}},yb={Fb(){a:{if(!jb.length){var a=null;if(ca){var b=Buffer.alloc(256),d=0;try{d=fs.readSync(process.stdin.fd,b,0,256)}catch(c){if(c.toString().includes("EOF"))d=0;else throw c;}d>0&&(a=b.toString("utf-8",0,d))}else globalThis.window?.prompt&&(a=window.prompt("Input: "),a!==null&&(a+="\n"));if(!a){a=null;break a}jb=ka(a)}a=jb.shift()}return a},ub(a,b){b===null||b===10?(Ea(ib(a.output)),a.output=[]):b!=0&&a.output.push(b)},
fsync(a){a.output?.length>0&&(Ea(ib(a.output)),a.output=[])},mc(){return{hc:25856,kc:5,fc:191,jc:35387,ec:[3,28,127,21,4,0,1,0,17,19,26,0,18,15,23,22,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]}},nc(){return 0},oc(){return[24,80]}},zb={ub(a,b){b===null||b===10?(D(ib(a.output)),a.output=[]):b!=0&&a.output.push(b)},fsync(a){a.output?.length>0&&(D(ib(a.output)),a.output=[])}},N={Wa:null,$a(){return N.createNode(null,"/",16895,0)},createNode(a,b,d,c){if((d&61440)===24576||(d&61440)===4096)throw new M(63);N.Wa||
(N.Wa={dir:{node:{Ua:N.Ma.Ua,Xa:N.Ma.Xa,lookup:N.Ma.lookup,jb:N.Ma.jb,rename:N.Ma.rename,unlink:N.Ma.unlink,rmdir:N.Ma.rmdir,readdir:N.Ma.readdir,symlink:N.Ma.symlink},stream:{Va:N.Na.Va}},file:{node:{Ua:N.Ma.Ua,Xa:N.Ma.Xa},stream:{Va:N.Na.Va,read:N.Na.read,write:N.Na.write,kb:N.Na.kb,lb:N.Na.lb}},link:{node:{Ua:N.Ma.Ua,Xa:N.Ma.Xa,readlink:N.Ma.readlink},stream:{}},Ab:{node:{Ua:N.Ma.Ua,Xa:N.Ma.Xa},stream:Ab}});d=Bb(a,b,d,c);O(d.mode)?(d.Ma=N.Wa.dir.node,d.Na=N.Wa.dir.stream,d.Ra={}):(d.mode&61440)===
32768?(d.Ma=N.Wa.file.node,d.Na=N.Wa.file.stream,d.Sa=0,d.Ra=N.Rb??(N.Rb=new Uint8Array(0))):(d.mode&61440)===40960?(d.Ma=N.Wa.link.node,d.Na=N.Wa.link.stream):(d.mode&61440)===8192&&(d.Ma=N.Wa.Ab.node,d.Na=N.Wa.Ab.stream);d.atime=d.mtime=d.ctime=Date.now();a&&(a.Ra[b]=d,a.atime=a.mtime=a.ctime=d.atime);return d},Ma:{Ua(a){var b={};b.dev=(a.mode&61440)===8192?a.id:1;b.ino=a.id;b.mode=a.mode;b.nlink=1;b.uid=0;b.gid=0;b.rdev=a.rdev;O(a.mode)?b.size=4096:(a.mode&61440)===32768?b.size=a.Sa:(a.mode&61440)===
40960?b.size=a.link.length:b.size=0;b.atime=new Date(a.atime);b.mtime=new Date(a.mtime);b.ctime=new Date(a.ctime);b.atimeMs=a.atime;b.mtimeMs=a.mtime;b.ctimeMs=a.ctime;b.blksize=4096;b.blocks=Math.ceil(b.size/b.blksize);return b},Xa(a,b){for(var d of["mode","atime","mtime","ctime"])b[d]!=null&&(a[d]=b[d]);b.size!==void 0&&(b=b.size,a.Sa!=b&&(d=a.Ra,a.Ra=new Uint8Array(b),a.Ra.set(d.subarray(0,Math.min(b,a.Sa))),a.Sa=b))},lookup(){N.ob||(N.ob=new M(44),N.ob.stack="<generic error, no stack>");throw N.ob;
},jb(a,b,d,c){return N.createNode(a,b,d,c)},rename(a,b,d){try{var c=P(b,d)}catch(g){}if(c&&O(a.mode))for(var e in c.Ra)throw new M(55);delete a.parent.Ra[a.name];b.Ra[d]=a;a.name=d;b.ctime=b.mtime=a.parent.ctime=a.parent.mtime=Date.now()},unlink(a,b){delete a.Ra[b];a.ctime=a.mtime=Date.now()},rmdir(a,b){var d=P(a,b),c;for(c in d.Ra)throw new M(55);delete a.Ra[b];a.ctime=a.mtime=Date.now()},readdir(a){return[".","..",...Object.keys(a.Ra)]},symlink(a,b,d){a=N.createNode(a,b,41471,0);a.link=d;return a},
readlink(a){if((a.mode&61440)!==40960)throw new M(28);return a.link}},Na:{read(a,b,d,c,e){if(e>=a.node.Sa)return 0;c=Math.min(a.node.Sa-e,c);b.set(a.node.Ra.subarray(e,e+c),d);return c},write(a,b,d,c,e,g){b.buffer===t.buffer&&(g=!1);if(!c)return 0;a=a.node;a.mtime=a.ctime=Date.now();if(g)a.Ra=b.subarray(d,d+c),a.Sa=c;else if(a.Sa||e){g=e+c;var n=a.Ra.length;n>=g||(g=Math.max(g,n*(n<1048576?2:1.125)>>>0),n&&(g=Math.max(g,256)),n=a.Ra.subarray(0,a.Sa),a.Ra=new Uint8Array(g),a.Ra.set(n));a.Ra.set(b.subarray(d,
d+c),e);a.Sa=Math.max(a.Sa,e+c)}else a.Ra=b.slice(d,d+c),a.Sa=c;return c},Va(a,b,d){d===1?b+=a.position:d===2&&(a.node.mode&61440)===32768&&(b+=a.node.Sa);if(b<0)throw new M(28);return b},kb(a,b,d,c,e){if((a.node.mode&61440)!==32768)throw new M(43);a=a.node.Ra;if(e&2||a.buffer!==t.buffer){e=!0;c=Math.ceil(b/65536)*65536;var g=Cb(65536,c);g&&G.fill(0,g,g+c);c=g;if(!c)throw new M(48);if(a){if(d>0||d+b<a.length)a.subarray?a=a.subarray(d,d+b):a=Array.prototype.slice.call(a,d,d+b);t.set(a,c)}}else e=!1,
c=a.byteOffset;return{bc:c,Ib:e}},lb(a,b,d,c){N.Na.write(a,b,0,c,d,!1);return 0}}},ia=(a,b)=>{var d=0;a&&(d|=365);b&&(d|=146);return d},Db=null,Eb={},Fb=[],Gb=1,R=[],Hb=!1,Ib=!0,Jb={},M=class{name="ErrnoError";constructor(a){this.Oa=a}},Kb=class{shared={};node=null;get flags(){return this.shared.flags}set flags(a){this.shared.flags=a}get position(){return this.shared.position}set position(a){this.shared.position=a}},Lb=class{Ma={};Na={};cb=null;listeners=null;wb=0;constructor(a,b,d,c){a||=this;this.parent=
a;this.$a=a.$a;this.id=Gb++;this.name=b;this.mode=d;this.rdev=c;this.atime=this.mtime=this.ctime=Date.now()}get read(){return(this.mode&365)===365}set read(a){a?this.mode|=365:this.mode&=-366}get write(){return(this.mode&146)===146}set write(a){a?this.mode|=146:this.mode&=-147}ac(){if(this.listeners){var a;for(b of this.listeners)b.exclusive?(a||=[]).push(b):b.Nb(32);if(a){var b=(this.wb||0)%a.length;this.wb=b+1;a[b].Nb(32)}}}};
function S(a,b={}){if(!a)throw new M(44);b.pb??(b.pb=!0);a.charAt(0)==="/"||(a="//"+a);var d=0;a:for(;d<40;d++){a=a.split("/").filter(q=>!!q);for(var c=Db,e="/",g=0;g<a.length;g++){var n=g===a.length-1;if(n&&b.parent)break;if(a[g]!==".")if(a[g]==="..")if(e=db(e),c===c.parent){a=e+"/"+a.slice(g+1).join("/");d--;continue a}else c=c.parent;else{e=ha(e+"/"+a[g]);try{c=P(c,a[g])}catch(q){if(q?.Oa===44&&n&&b.$b)return{path:e};throw q;}!c.cb||n&&!b.pb||(c=c.cb.root);if((c.mode&61440)===40960&&(!n||b.bb)){if(!c.Ma.readlink)throw new M(52);
c=c.Ma.readlink(c);c.charAt(0)==="/"||(c=db(e)+"/"+c);a=c+"/"+a.slice(g+1).join("/");continue a}}}return{path:e,node:c}}throw new M(32);}function fa(a){for(var b;;){if(a===a.parent)return a=a.$a.Hb,b?a[a.length-1]!=="/"?`${a}/${b}`:a+b:a;b=b?`${a.name}/${b}`:a.name;a=a.parent}}function Mb(a,b){for(var d=0,c=0;c<b.length;c++)d=(d<<5)-d+b.charCodeAt(c)|0;return(a+d>>>0)%R.length}
function Nb(a){var b=Mb(a.parent.id,a.name);if(R[b]===a)R[b]=a.eb;else for(b=R[b];b;){if(b.eb===a){b.eb=a.eb;break}b=b.eb}}function P(a,b){var d=O(a.mode)?(d=Ob(a,"x"))?d:a.Ma.lookup?0:2:54;if(d)throw new M(d);for(d=R[Mb(a.id,b)];d;d=d.eb){var c=d.name;if(d.parent.id===a.id&&c===b)return d}return a.Ma.lookup(a,b)}function Bb(a,b,d,c){a=new Lb(a,b,d,c);b=Mb(a.parent.id,a.name);a.eb=R[b];return R[b]=a}function O(a){return(a&61440)===16384}
function Ob(a,b){return Ib?0:b.includes("r")&&!(a.mode&292)||b.includes("w")&&!(a.mode&146)||b.includes("x")&&!(a.mode&73)?2:0}function Pb(a,b){if(!O(a.mode))return 54;try{return P(a,b),20}catch(d){}return Ob(a,"wx")}function Qb(a,b,d){try{var c=P(a,b)}catch(e){return e.Oa}if(a=Ob(a,"wx"))return a;if(d){if(!O(c.mode))return 54;if(c===c.parent||fa(c)==="/")return 10}else if(O(c.mode))return 31;return 0}function Rb(a){if(!a)throw new M(63);return a}
function T(a){a=Fb[a];if(!a)throw new M(8);return a}function Sb(a,b=-1){a=Object.assign(new Kb,a);if(b==-1)a:{for(b=0;b<=4096;b++)if(!Fb[b])break a;throw new M(33);}a.fd=b;return Fb[b]=a}function Tb(a,b=-1){a=Sb(a,b);a.Na?.lc?.(a);return a}function Ub(a,b,d){var c=a?.Na.Xa;a=c?a:b;c??=b.Ma.Xa;Rb(c);try{c(a,d)}catch(e){if(e instanceof RangeError)throw new M(22);throw e;}}var Ab={open(a){a.Na=Eb[a.node.rdev].Na;a.Na.open?.(a)},Va(){throw new M(70);}};function pb(a,b){Eb[a]={Na:b}}
function Vb(a,b){var d=b==="/";if(d&&Db)throw new M(10);if(!d&&b){var c=S(b,{pb:!1});b=c.path;c=c.node;if(c.cb)throw new M(10);if(!O(c.mode))throw new M(54);}b={type:a,qc:{},Hb:b,Zb:[]};a=a.$a(b);a.$a=b;b.root=a;d?Db=a:c&&(c.cb=b,c.$a&&c.$a.Zb.push(b))}function Wb(a,b,d){var c=S(a,{parent:!0}).node;a=eb(a);if(!a)throw new M(28);if(a==="."||a==="..")throw new M(20);var e=Pb(c,a);if(e)throw new M(e);if(!c.Ma.jb)throw new M(63);return c.Ma.jb(c,a,b,d)}
function ja(a,b=438){return Wb(a,b&4095|32768,0)}function U(a,b=511){return Wb(a,b&1023|16384,0)}function Xb(a,b,d){typeof d=="undefined"&&(d=b,b=438);Wb(a,b|8192,d)}function Yb(a,b){if(!hb(a))throw new M(44);var d=S(b,{parent:!0}).node;if(!d)throw new M(44);b=eb(b);var c=Pb(d,b);if(c)throw new M(c);if(!d.Ma.symlink)throw new M(63);d.Ma.symlink(d,b,a)}
function Zb(a){var b=S(a,{parent:!0}).node;a=eb(a);var d=P(b,a),c=Qb(b,a,!0);if(c)throw new M(c);if(!b.Ma.rmdir)throw new M(63);if(d.cb)throw new M(10);b.Ma.rmdir(b,a);Nb(d)}function va(a){var b=S(a,{parent:!0}).node;if(!b)throw new M(44);a=eb(a);var d=P(b,a),c=Qb(b,a,!1);if(c)throw new M(c);if(!b.Ma.unlink)throw new M(63);if(d.cb)throw new M(10);b.Ma.unlink(b,a);Nb(d)}function $b(a,b=!1){a=S(a,{bb:!b}).node;return Rb(a.Ma.Ua)(a)}
function ac(a,b,d){Ub(a,b,{mode:d&4095|b.mode&-4096,ctime:Date.now(),Bb:!1})}function la(a,b){a=typeof a=="string"?S(a,{bb:!0}).node:a;ac(null,a,b)}function bc(a,b,d){if(O(b.mode))throw new M(31);if((b.mode&61440)!==32768)throw new M(28);var c=Ob(b,"w");if(c)throw new M(c);Ub(a,b,{size:d,timestamp:Date.now()})}function cc(a,b,d,c=!1){a=S(a,{bb:!c});Ub(null,a.node,{atime:b,mtime:d,Bb:c})}
function na(a,b,d=438){if(a==="")throw new M(44);if(typeof b=="string"){var c={r:0,"r+":2,w:577,"w+":578,a:1089,"a+":1090}[b];if(typeof c=="undefined")throw Error(`Unknown file open mode: ${b}`);b=c}d=b&64?d&4095|32768:0;if(typeof a=="object")c=a;else{var e=a.endsWith("/");a=S(a,{bb:!(b&131072),$b:!0});c=a.node;a=a.path}var g=!1;if(b&64)if(c){if(b&128)throw new M(20);}else{if(e)throw new M(31);c=Wb(a,d|511,0);g=!0}if(!c)throw new M(44);(c.mode&61440)===8192&&(b&=-513);if(b&65536&&!O(c.mode))throw new M(54);
if(!g&&(c?(c.mode&61440)===40960?e=32:(e=["r","w","rw"][b&3],b&512&&(e+="w"),e=O(c.mode)&&(e!=="r"||b&576)?31:Ob(c,e)):e=44,e))throw new M(e);b&512&&!g&&(e=c,e=typeof e=="string"?S(e,{bb:!0}).node:e,bc(null,e,0));b&=-131713;e=Sb({node:c,path:fa(c),flags:b,seekable:!0,position:0,Na:c.Na,cc:[],error:!1});e.Na.open&&e.Na.open(e);g&&la(c,d&511);!k.logReadFiles||b&1||a in Jb||(Jb[a]=1,D(`read file: ${a}`));return e}
function pa(a){if(a.fd===null)throw new M(8);a.rb&&(a.rb=null);a.node?.ac();try{a.Na.close&&a.Na.close(a)}catch(b){throw b;}finally{Fb[a.fd]=null}a.fd=null}function mc(a,b,d){if(a.fd===null)throw new M(8);if(!a.seekable||!a.Na.Va)throw new M(70);if(d!=0&&d!=1&&d!=2)throw new M(28);a.position=a.Na.Va(a,b,d);a.cc=[]}
function Gc(a,b,d,c,e){if(c<0||e<0)throw new M(28);if(a.fd===null)throw new M(8);if((a.flags&2097155)===1)throw new M(8);if(O(a.node.mode))throw new M(31);if(!a.Na.read)throw new M(28);var g=typeof e!="undefined";if(!g)e=a.position;else if(!a.seekable)throw new M(70);b=a.Na.read(a,b,d,c,e);g||(a.position+=b);return b}
function oa(a,b,d,c,e){if(c<0||e<0)throw new M(28);if(a.fd===null)throw new M(8);if((a.flags&2097155)===0)throw new M(8);if(O(a.node.mode))throw new M(31);if(!a.Na.write)throw new M(28);a.seekable&&a.flags&1024&&mc(a,0,2);var g=typeof e!="undefined";if(!g)e=a.position;else if(!a.seekable)throw new M(70);b=a.Na.write(a,b,d,c,e,void 0);g||(a.position+=b);return b}
function ua(a){var b={encoding:"binary"};b.flags??(b.flags=0);b.encoding??(b.encoding="binary");b.encoding!=="utf8"&&b.encoding!=="binary"&&Ua(`Invalid encoding type "${b.encoding}"`);var d=na(a,b.flags);a=$b(a).size;var c=new Uint8Array(a);Gc(d,c,0,a,0);b.encoding==="utf8"&&(c=ib(c));pa(d);return c}
function Ic(){var a,b,d;Hb=!0;a??=k.stdin;b??=k.stdout;d??=k.stderr;a?V("stdin",a):Yb("/dev/tty","/dev/stdin");b?V("stdout",null,b):Yb("/dev/tty","/dev/stdout");d?V("stderr",null,d):Yb("/dev/tty1","/dev/stderr");na("/dev/stdin",0);na("/dev/stdout",1);na("/dev/stderr",1)}
function V(a,b,d){a=ha("/dev/"+a);var c=ia(!!b,!!d);V.Gb??(V.Gb=64);var e=V.Gb++<<8|0;pb(e,{open(g){g.seekable=!1},close(){d?.buffer?.length&&d(10)},read(g,n,q,v){for(var m=0,y=0;y<v;y++){try{var A=b()}catch(rb){throw new M(29);}if(A===void 0&&!m)throw new M(6);if(A===null||A===void 0)break;m++;n[q+y]=A}m&&(g.node.atime=Date.now());return m},write(g,n,q,v){for(var m=0;m<v;m++)try{d(n[q+m])}catch(y){throw new M(29);}v&&(g.node.mtime=g.node.ctime=Date.now());return m}});Xb(a,c,e)}var W={},H,I,K;
function Y(a,b,d=!1){if(b.charAt(0)==="/")return b;a=a===-100?"/":T(a).path;if(b.length==0){if(!d)throw new M(44);return a}return a+"/"+b}
function Jc(a,b){I[a>>2]=b.dev;I[a+4>>2]=b.mode;I[a+8>>2]=b.nlink;I[a+12>>2]=b.uid;I[a+16>>2]=b.gid;I[a+20>>2]=b.rdev;K[a+24>>3]=BigInt(b.size);H[a+32>>2]=4096;H[a+36>>2]=b.blocks;var d=b.atimeMs??b.atime.getTime(),c=b.mtimeMs??b.mtime.getTime(),e=b.ctimeMs??b.ctime.getTime();K[a+40>>3]=BigInt(Math.floor(d/1E3));I[a+48>>2]=Math.floor(d%1E3*1E6);K[a+56>>3]=BigInt(Math.floor(c/1E3));I[a+64>>2]=Math.floor(c%1E3*1E6);K[a+72>>3]=BigInt(Math.floor(e/1E3));I[a+80>>2]=Math.floor(e%1E3*1E6);K[a+88>>3]=BigInt(b.ino);
return 0}
var Kc=void 0,Lc=()=>{var a=H[+Kc>>2];Kc+=4;return a},Ka,Mc=0,Nc=[0,31,60,91,121,152,182,213,244,274,305,335],Oc=[0,31,59,90,120,151,181,212,243,273,304,334],Pc={},Qc=a=>{Ha=a;$a||Mc>0||(k.onExit?.(a),Ga=!0);ya(a,new Za(a))},Rc={},Tc=()=>{if(!Sc){var a={USER:"web_user",LOGNAME:"web_user",PATH:"/",PWD:"/",HOME:"/home/web_user",LANG:(globalThis.navigator?.language??"C").replace("-","_")+".UTF-8",_:xa},b;for(b in Rc)Rc[b]===void 0?delete a[b]:a[b]=Rc[b];var d=[];for(b in a)d.push(`${b}=${a[b]}`);Sc=
d}return Sc},Sc,La,Ma;function z(a,b="i8"){b.endsWith("*")&&(b="*");switch(b){case "i1":return t[a];case "i8":return t[a];case "i16":return Ka[a>>1];case "i32":return H[a>>2];case "i64":return K[a>>3];case "float":return La[a>>2];case "double":return Ma[a>>3];case "*":return I[a>>2];default:Ua(`invalid type for getValue: ${b}`)}}
function sa(a){var b="i32";b.endsWith("*")&&(b="*");switch(b){case "i1":t[a]=0;break;case "i8":t[a]=0;break;case "i16":Ka[a>>1]=0;break;case "i32":H[a>>2]=0;break;case "i64":K[a>>3]=BigInt(0);break;case "float":La[a>>2]=0;break;case "double":Ma[a>>3]=0;break;case "*":I[a>>2]=0;break;default:Ua(`invalid type for setValue: ${b}`)}}
var Uc=(a,b,d,c)=>{var e={string:m=>{var y=0;if(m!==null&&m!==void 0&&m!==0){y=l(m)+1;var A=C(y);L(m,G,A,y);y=A}return y},array:m=>{var y=C(m.length);t.set(m,y);return y}};a=k["_"+a];var g=[],n=0;if(c)for(var q=0;q<c.length;q++){var v=e[d[q]];v?(n||=ra(),g[q]=v(c[q])):g[q]=c[q]}d=a(...g);return d=function(m){n&&ta(n);return b==="string"?B(m):b==="boolean"?!!m:m}(d)},ea=a=>{var b=l(a)+1,d=da(b);d&&L(a,G,d,b);return d},Vc,Wc=[],qa=a=>{Vc.delete(Z.get(a));Z.set(a,null);Wc.push(a)},Xc=a=>{var b=a.length;
return[b%128|128,b>>7,...a]},Yc={i:127,p:127,j:126,f:125,d:124,e:111},Zc=a=>Xc(Array.from(a,b=>Yc[b])),wa=(a,b)=>{if(!Vc){Vc=new WeakMap;var d=Z.length;if(Vc)for(var c=0;c<0+d;c++){var e=Z.get(c);e&&Vc.set(e,c)}}if(d=Vc.get(a)||0)return d;d=Wc.length?Wc.pop():Z.grow(1);try{Z.set(d,a)}catch(g){if(!(g instanceof TypeError))throw g;b=Uint8Array.of(0,97,115,109,1,0,0,0,1,...Xc([1,96,...Zc(b.slice(1)),...Zc(b[0]==="v"?"":b[0])]),2,7,1,1,101,1,102,0,0,7,5,1,1,102,0,0);b=new WebAssembly.Module(b);b=(new WebAssembly.Instance(b,
{e:{f:a}})).exports.f;Z.set(d,b)}Vc.set(a,d);return d};R.length=4096;Vb(N,"/");U("/tmp");U("/home");U("/home/web_user");(function(){U("/dev");pb(259,{read:()=>0,write:(c,e,g,n)=>n,Va:()=>0});Xb("/dev/null",259);ob(1280,yb);ob(1536,zb);Xb("/dev/tty",1280);Xb("/dev/tty1",1536);var a=new Uint8Array(1024),b=0,d=()=>{b||(gb(a),b=a.byteLength);return a[--b]};V("random",d);V("urandom",d);U("/dev/shm");U("/dev/shm/tmp")})();
(function(){U("/proc");var a=U("/proc/self");U("/proc/self/fd");Vb({$a(){var b=Bb(a,"fd",16895,73);b.Na={Va:N.Na.Va};b.Ma={lookup(d,c){d=+c;var e=T(d);d={parent:null,$a:{Hb:"fake"},Ma:{readlink:()=>e.path},id:d+1};return d.parent=d},readdir(){return Array.from(Fb.entries()).filter(([,d])=>d).map(([d])=>d.toString())}};return b}},"/proc/self/fd")})();k.noExitRuntime&&($a=k.noExitRuntime);k.print&&(Ea=k.print);k.printErr&&(D=k.printErr);k.wasmBinary&&(Fa=k.wasmBinary);k.thisProgram&&(xa=k.thisProgram);
var $c=k.preInit;if($c)for(typeof $c=="function"&&(k.preInit=$c=[$c]);$c.length>0;)$c.shift()();k.stackSave=()=>ra();k.stackRestore=a=>ta(a);k.stackAlloc=a=>C(a);k.cwrap=(a,b,d,c)=>{var e=!d||d.every(g=>g==="number"||g==="boolean");return b!=="string"&&e&&!c?k["_"+a]:(...g)=>Uc(a,b,d,g)};k.addFunction=wa;k.removeFunction=qa;k.UTF8ToString=B;k.lengthBytesUTF8=l;k.stringToNewUTF8=ea;k.writeArrayToMemory=(a,b)=>{t.set(a,b)};
var da,x,Cb,ad,ta,C,ra,Ja,Z,bd={a:(a,b,d,c)=>Ua(`Assertion failed: ${B(a)}, at: `+[b?B(b):"unknown filename",d,c?B(c):"unknown function"]),i:function(a,b){try{return a=B(a),la(a,b),0}catch(d){if(typeof W=="undefined"||d.name!=="ErrnoError")throw d;return-d.Oa}},M:function(a,b,d){try{b=B(b);b=Y(a,b);if(d&-8)return-28;var c=S(b,{bb:!0}).node;if(!c)return-44;a="";d&4&&(a+="r");d&2&&(a+="w");d&1&&(a+="x");return a&&Ob(c,a)?-2:0}catch(e){if(typeof W=="undefined"||e.name!=="ErrnoError")throw e;return-e.Oa}},
j:function(a,b){try{var d=T(a);ac(d,d.node,b);return 0}catch(c){if(typeof W=="undefined"||c.name!=="ErrnoError")throw c;return-c.Oa}},h:function(a){try{var b=T(a);Ub(b,b.node,{timestamp:Date.now(),Bb:!1});return 0}catch(d){if(typeof W=="undefined"||d.name!=="ErrnoError")throw d;return-d.Oa}},b:function(a,b,d){Kc=d;try{var c=T(a);switch(b){case 0:var e=Lc();if(e<0)break;for(;Fb[e];)e++;return Tb(c,e).fd;case 1:case 2:return 0;case 3:return c.flags;case 4:return e=Lc(),c.flags=c.flags&-289793|e&289792,
0;case 12:return e=Lc(),Ka[e+0>>1]=2,0;case 13:case 14:return 0}return-28}catch(g){if(typeof W=="undefined"||g.name!=="ErrnoError")throw g;return-g.Oa}},g:function(a,b){try{var d=T(a),c=d.node,e=d.Na.Ua;a=e?d:c;e??=c.Ma.Ua;Rb(e);var g=e(a);return Jc(b,g)}catch(n){if(typeof W=="undefined"||n.name!=="ErrnoError")throw n;return-n.Oa}},I:function(a,b){b=b<-9007199254740992||b>9007199254740992?NaN:Number(b);try{if(isNaN(b))return-22;var d=T(a);if(b<0||(d.flags&2097155)===0)throw new M(28);bc(d,d.node,
b);return 0}catch(c){if(typeof W=="undefined"||c.name!=="ErrnoError")throw c;return-c.Oa}},H:function(a,b){try{if(!b)return-28;var d=l("/")+1;if(b<d)return-68;L("/",G,a,b);return d}catch(c){if(typeof W=="undefined"||c.name!=="ErrnoError")throw c;return-c.Oa}},E:()=>0,L:function(a,b){try{return a=B(a),Jc(b,$b(a,!0))}catch(d){if(typeof W=="undefined"||d.name!=="ErrnoError")throw d;return-d.Oa}},C:function(a,b,d){try{return b=B(b),b=Y(a,b),U(b,d&-19),0}catch(c){if(typeof W=="undefined"||c.name!=="ErrnoError")throw c;
return-c.Oa}},K:function(a,b,d,c){try{b=B(b);var e=c&256;b=Y(a,b,c&4096);return Jc(d,e?$b(b,!0):$b(b))}catch(g){if(typeof W=="undefined"||g.name!=="ErrnoError")throw g;return-g.Oa}},x:function(a,b,d,c){Kc=c;try{b=B(b);b=Y(a,b);var e=c?Lc():0;d&64&&(e&=-19);return na(b,d,e).fd}catch(g){if(typeof W=="undefined"||g.name!=="ErrnoError")throw g;return-g.Oa}},s:function(a,b,d,c){try{b=B(b);b=Y(a,b);if(c<=0)return-28;var e=S(b).node;if(!e)throw new M(44);if(!e.Ma.readlink)throw new M(28);var g=e.Ma.readlink(e);
var n=Math.min(c,l(g)),q=t[d+n];L(g,G,d,c+1);t[d+n]=q;return n}catch(v){if(typeof W=="undefined"||v.name!=="ErrnoError")throw v;return-v.Oa}},r:function(a){try{return a=B(a),Zb(a),0}catch(b){if(typeof W=="undefined"||b.name!=="ErrnoError")throw b;return-b.Oa}},f:function(a,b){try{return a=B(a),Jc(b,$b(a))}catch(d){if(typeof W=="undefined"||d.name!=="ErrnoError")throw d;return-d.Oa}},o:function(a,b,d){try{b=B(b);b=Y(a,b);if(d)if(d===512)Zb(b);else return-28;else va(b);return 0}catch(c){if(typeof W==
"undefined"||c.name!=="ErrnoError")throw c;return-c.Oa}},n:function(a,b,d,c){try{c&=256;b=B(b);b=Y(a,b,!0);var e=Date.now();if(d){function q(v){var m=H[v+8>>2];return m==1073741823?e:m==1073741822?null:(I[v>>2]+H[v+4>>2]*4294967296+(m/1E4|0)*1E4/1E9)*1E3}var g=q(d);var n=q(d+16)}else n=g=e;(n??g)!==null&&cc(b,g,n,c);return 0}catch(q){if(typeof W=="undefined"||q.name!=="ErrnoError")throw q;return-q.Oa}},w:()=>Ua(""),v:()=>{$a=!1;Mc=0},A:function(a,b){a=a<-9007199254740992||a>9007199254740992?NaN:Number(a);
a=new Date(a*1E3);if(isNaN(a.getTime()))return 1;H[b>>2]=a.getSeconds();H[b+4>>2]=a.getMinutes();H[b+8>>2]=a.getHours();H[b+12>>2]=a.getDate();H[b+16>>2]=a.getMonth();H[b+20>>2]=a.getFullYear()-1900;H[b+24>>2]=a.getDay();var d=a.getFullYear();H[b+28>>2]=(d%4!==0||d%100===0&&d%400!==0?Oc:Nc)[a.getMonth()]+a.getDate()-1|0;H[b+36>>2]=-(a.getTimezoneOffset()*60);d=(new Date(a.getFullYear(),6,1)).getTimezoneOffset();var c=(new Date(a.getFullYear(),0,1)).getTimezoneOffset();H[b+32>>2]=(d!=c&&a.getTimezoneOffset()==
Math.min(c,d))|0;return 0},y:function(a,b,d,c,e,g,n){e=e<-9007199254740992||e>9007199254740992?NaN:Number(e);try{var q=T(c);if(b&2&&!(d&2)&&(q.flags&2097155)!==2)throw new M(2);if((q.flags&2097155)===1)throw new M(2);if(!q.Na.kb)throw new M(43);if(!a)throw new M(28);var v=q.Na.kb(q,a,e,b,d);var m=v.bc;H[g>>2]=v.Ib;I[n>>2]=m;return 0}catch(y){if(typeof W=="undefined"||y.name!=="ErrnoError")throw y;return-y.Oa}},z:function(a,b,d,c,e,g){g=g<-9007199254740992||g>9007199254740992?NaN:Number(g);try{var n=
T(e);if(d&2){if((n.node.mode&61440)!==32768)throw new M(43);c&2||n.Na.lb&&n.Na.lb(n,G.subarray(a,a+b),g,b,c)}}catch(q){if(typeof W=="undefined"||q.name!=="ErrnoError")throw q;return-q.Oa}},k:(a,b)=>{Pc[a]&&(clearTimeout(Pc[a].id),delete Pc[a]);if(!b)return 0;var d=setTimeout(()=>{delete Pc[a];var c=[a,performance.now()],e=ad;if(!Ga)try{e(...c)}catch(g){g instanceof Za||g=="unwind"||ya(1,g)}finally{if(!($a||Mc>0))try{Ha=c=Ha,Qc(c)}catch(g){g instanceof Za||g=="unwind"||ya(1,g)}}},b);Pc[a]={id:d,rc:b};
return 0},B:(a,b,d,c)=>{var e=(new Date).getFullYear(),g=(new Date(e,0,1)).getTimezoneOffset();e=(new Date(e,6,1)).getTimezoneOffset();I[a>>2]=Math.max(g,e)*60;H[b>>2]=Number(g!=e);b=n=>{var q=Math.abs(n);return`UTC${n>=0?"-":"+"}${String(Math.floor(q/60)).padStart(2,"0")}${String(q%60).padStart(2,"0")}`};a=b(g);b=b(e);e<g?(L(a,G,d,17),L(b,G,c,17)):(L(a,G,c,17),L(b,G,d,17))},d:()=>Date.now(),p:()=>2147483648,c:()=>performance.now(),l:a=>{var b=G.length;a>>>=0;if(a>2147483648)return!1;for(var d=1;d<=
4;d*=2){var c=b*(1+.2/d);c=Math.min(c,a+100663296);a:{c=(Math.min(2147483648,Math.ceil(Math.max(a,c)/65536)*65536)-Ja.buffer.byteLength+65535)/65536|0;try{Ja.grow(c);Ia();var e=1;break a}catch(g){}e=void 0}if(e)return!0}return!1},F:(a,b)=>{var d=0,c=0,e;for(e of Tc()){var g=b+d;I[a+c>>2]=g;d+=L(e,G,g,Infinity)+1;c+=4}return 0},G:(a,b)=>{var d=Tc();I[a>>2]=d.length;a=0;for(var c of d)a+=l(c)+1;I[b>>2]=a;return 0},e:function(a){try{var b=T(a);pa(b);return 0}catch(d){if(typeof W=="undefined"||d.name!==
"ErrnoError")throw d;return d.Oa}},m:function(a,b){try{var d=T(a);t[b]=d.tty?2:O(d.mode)?3:(d.mode&61440)===40960?7:4;Ka[b+2>>1]=0;K[b+8>>3]=BigInt(0);K[b+16>>3]=BigInt(0);return 0}catch(c){if(typeof W=="undefined"||c.name!=="ErrnoError")throw c;return c.Oa}},t:function(a,b,d,c){try{a:{var e=T(a);a=b;for(var g,n=b=0;n<d;n++){var q=I[a>>2],v=I[a+4>>2];a+=8;try{var m=Gc(e,t,q,v,g)}catch(A){if(b>0&&A instanceof M&&(A.Oa==6||A.Oa==6))break;throw A;}if(m<0){var y=-1;break a}b+=m;if(m<v)break;typeof g!=
"undefined"&&(g+=m)}y=b}I[c>>2]=y;return 0}catch(A){if(typeof W=="undefined"||A.name!=="ErrnoError")throw A;return A.Oa}},D:function(a,b,d,c){b=b<-9007199254740992||b>9007199254740992?NaN:Number(b);try{if(isNaN(b))return 22;var e=T(a);mc(e,b,d);K[c>>3]=BigInt(e.position);e.rb&&!b&&d===0&&(e.rb=null);return 0}catch(g){if(typeof W=="undefined"||g.name!=="ErrnoError")throw g;return g.Oa}},J:function(a){try{var b=T(a);return b.Na?.fsync?.(b)}catch(d){if(typeof W=="undefined"||d.name!=="ErrnoError")throw d;
return d.Oa}},q:function(a,b,d,c){try{var e=T(a);a=b;if(d==1)var g=oa(e,t,I[a>>2],I[a+4>>2]);else{for(var n=b=0,q=a;n<d;n++,q+=8)b+=I[q+4>>2];var v=new Uint8Array(b);for(n=q=0;n<d;n++,a+=8){var m=I[a>>2],y=I[a+4>>2];v.set(G.subarray(m,m+y),q);q+=y}g=oa(e,v,0,b)}I[c>>2]=g;return 0}catch(A){if(typeof W=="undefined"||A.name!=="ErrnoError")throw A;return A.Oa}},u:Qc};
async function cd(){Na();var a=k.setStatus;a&&(a("Running..."),await new Promise(b=>setTimeout(b,1)),setTimeout(a,1,""));Ga||(k.noFSInit||Hb||Ic(),dd.O(),Ib=!1,k.onRuntimeInitialized?.(),Sa())}var dd;
(async function(){function a(c){c=dd=c.exports;k._sqlite3_free=c.Q;k._sqlite3_value_text=c.R;k._sqlite3_prepare_v2=c.S;k._sqlite3_step=c.T;k._sqlite3_reset=c.U;k._sqlite3_exec=c.V;k._sqlite3_finalize=c.W;k._sqlite3_column_name=c.X;k._sqlite3_column_text=c.Y;k._sqlite3_column_type=c.Z;k._sqlite3_errmsg=c._;k._sqlite3_clear_bindings=c.$;k._sqlite3_value_blob=c.aa;k._sqlite3_value_bytes=c.ba;k._sqlite3_value_double=c.ca;k._sqlite3_value_int=c.da;k._sqlite3_value_type=c.ea;k._sqlite3_result_blob=c.fa;
k._sqlite3_result_double=c.ga;k._sqlite3_result_error=c.ha;k._sqlite3_result_int=c.ia;k._sqlite3_result_int64=c.ja;k._sqlite3_result_null=c.ka;k._sqlite3_result_text=c.la;k._sqlite3_aggregate_context=c.ma;k._sqlite3_column_count=c.na;k._sqlite3_data_count=c.oa;k._sqlite3_column_blob=c.pa;k._sqlite3_column_bytes=c.qa;k._sqlite3_column_double=c.ra;k._sqlite3_bind_blob=c.sa;k._sqlite3_bind_double=c.ta;k._sqlite3_bind_int=c.ua;k._sqlite3_bind_text=c.va;k._sqlite3_bind_parameter_index=c.wa;k._sqlite3_sql=
c.xa;k._sqlite3_normalized_sql=c.ya;k._sqlite3_changes=c.za;k._sqlite3_close_v2=c.Aa;k._sqlite3_create_function_v2=c.Ba;k._sqlite3_update_hook=c.Ca;k._sqlite3_open=c.Da;da=k._malloc=c.Ea;x=k._free=c.Fa;k._RegisterExtensionFunctions=c.Ga;Cb=c.Ha;ad=c.Ia;ta=c.Ja;C=c.Ka;ra=c.La;Ja=c.N;Z=c.P;Ia();return dd}var b={a:bd},d=k.instantiateWasm;if(d)return new Promise(c=>{d(b,e=>c(a(e)))});Va??=k.locateFile?k.locateFile("sql-wasm.wasm",Aa):Aa+"sql-wasm.wasm";return function(c){return a(c.instance)}(await Ya(b))})().then(()=>
cd());


        // The shell-pre.js and emcc-generated code goes above
        return Module;
    }); // The end of the promise being returned

  return initSqlJsPromise;
} // The end of our initSqlJs function

// This bit below is copied almost exactly from what you get when you use the MODULARIZE=1 flag with emcc
// However, we don't want to use the emcc modularization. See shell-pre.js
if (typeof exports === 'object' && typeof module === 'object'){
    module.exports = initSqlJs;
    // This will allow the module to be used in ES6 or CommonJS
    module.exports.default = initSqlJs;
}
else if (typeof define === 'function' && define['amd']) {
    define([], function() { return initSqlJs; });
}
else if (typeof exports === 'object'){
    exports["Module"] = initSqlJs;
}
/* global initSqlJs */
/* eslint no-restricted-globals: ["error"] */

"use strict";

var db;

function onModuleReady(SQL) {
    function createDb(data) {
        if (db != null) db.close();
        db = new SQL.Database(data);
        return db;
    }

    var buff; var data; var result;
    data = this["data"];
    var config = data["config"] ? data["config"] : {};
    switch (data && data["action"]) {
        case "open":
            buff = data["buffer"];
            createDb(buff && new Uint8Array(buff));
            return postMessage({
                id: data["id"],
                ready: true
            });
        case "exec":
            if (db === null) {
                createDb();
            }
            if (!data["sql"]) {
                throw "exec: Missing query string";
            }
            return postMessage({
                id: data["id"],
                results: db.exec(data["sql"], data["params"], config)
            });
        case "getRowsModified":
            return postMessage({
                id: data["id"],
                rowsModified: db.getRowsModified()
            });
        case "each":
            if (db === null) {
                createDb();
            }
            var callback = function callback(row) {
                return postMessage({
                    id: data["id"],
                    row: row,
                    finished: false
                });
            };
            var done = function done() {
                return postMessage({
                    id: data["id"],
                    finished: true
                });
            };
            return db.each(data["sql"], data["params"], callback, done, config);
        case "export":
            buff = db["export"]();
            result = {
                id: data["id"],
                buffer: buff
            };
            try {
                return postMessage(result, [result]);
            } catch (error) {
                return postMessage(result);
            }
        case "close":
            if (db) {
                db.close();
                db = null;
            }
            return postMessage({
                id: data["id"]
            });
        default:
            throw new Error("Invalid action : " + (data && data["action"]));
    }
}

function onError(err) {
    return postMessage({
        id: this["data"]["id"],
        error: err["message"]
    });
}

db = null;
var sqlModuleReady = initSqlJs();

function global_sqljs_message_handler(event) {
    return sqlModuleReady
        .then(onModuleReady.bind(event))
        .catch(onError.bind(event));
}

if (typeof importScripts === "function") {
    self.onmessage = global_sqljs_message_handler;
}

if (typeof require === "function") {
    var worker_threads = require("worker_threads");
    var parentPort = worker_threads.parentPort;
    // eslint-disable-next-line no-undef
    globalThis.postMessage = parentPort.postMessage.bind(parentPort);
    parentPort.on("message", function onmessage(data) {
        var event = { data: data };
        global_sqljs_message_handler(event);
    });

    if (typeof process !== "undefined") {
        process.on("uncaughtException", function uncaughtException(err) {
            postMessage({ error: err.message });
        });
        process.on("unhandledRejection", function unhandledRejection(err) {
            postMessage({ error: err.message });
        });
    }
}
