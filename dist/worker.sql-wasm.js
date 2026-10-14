
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
var l;l||=typeof Module != 'undefined' ? Module : {};var aa=!!globalThis.window,ba=!!globalThis.WorkerGlobalScope,ca=globalThis.process?.versions?.node&&globalThis.process?.type!="renderer";
l.onRuntimeInitialized=function(){function a(f,k){switch(typeof k){case "boolean":bc(f,k?1:0);break;case "number":cc(f,k);break;case "string":dc(f,k,m(k),-1);break;case "object":if(k===null)kb(f);else if(k.length!=null){var n=da(k.length);r.set(k,n);ec(f,n,k.length,-1);x(n)}else va(f,"Wrong API use : tried to return a value of an unknown type ("+k+").",-1);break;default:kb(f)}}function b(f,k){for(var n=[],q=0;q<f;q+=1){var t=z(k+4*q,"i32"),v=fc(t);if(v===1||v===2)t=hc(t);else if(v===3)v=lb(t),t=ic(t),
t=A(t,v,!0);else if(v===4){v=t;t=lb(v);v=jc(v);for(var J=new Uint8Array(t),I=0;I<t;I+=1)J[I]=r[v+I];t=J}else t=null;n.push(t)}return n}function c(f,k){this.Qa=f;this.db=k;this.Pa=1;this.nb=[]}function d(f,k){this.db=k;this.gb=ea(f);if(this.gb===null)throw Error("Unable to allocate memory for the SQL string");this.mb=this.gb;this.Ya=this.sb=null}function e(f){this.filename="dbfile_"+(4294967295*Math.random()>>>0);if(f!=null){var k=this.filename,n="/",q=k;n&&(n=typeof n=="string"?n:fa(n),q=k?ha(n+"/"+
k):n);k=ia(!0,!0);q=ja(q,k);f&&(typeof f=="string"&&(f=ka(f)),f.subarray||(f=new Uint8Array(f)),la(q,k|146),n=na(q,577),oa(n,f,0,f.length,0),pa(n),la(q,k))}this.handleError(p(this.filename,g));this.db=z(g,"i32");ob(this.db);this.hb={};this.Sa={}}var g=C(4),h=l.cwrap,p=h("sqlite3_open","number",["string","number"]),w=h("sqlite3_close_v2","number",["number"]),u=h("sqlite3_exec","number",["number","number","number","number","number"]),y=h("sqlite3_changes","number",["number"]),B=h("sqlite3_sql","string",
["number"]),pb=h("sqlite3_normalized_sql","string",["number"]),Qa=h("sqlite3_prepare_v2","number",["number","number","number","number","number"]),lc=h("sqlite3_bind_text","number",["number","number","number","number","number"]),qb=h("sqlite3_bind_blob","number",["number","number","number","number","number"]),mc=h("sqlite3_bind_double","number",["number","number","number"]),nc=h("sqlite3_bind_int","number",["number","number","number"]),oc=h("sqlite3_bind_parameter_index","number",["number","string"]),
pc=h("sqlite3_step","number",["number"]),qc=h("sqlite3_errmsg","string",["number"]),rc=h("sqlite3_column_count","number",["number"]),sc=h("sqlite3_data_count","number",["number"]),tc=h("sqlite3_column_double","number",["number","number"]),uc=h("sqlite3_column_text","number",["number","number"]),vc=h("sqlite3_column_blob","number",["number","number"]),rb=h("sqlite3_column_bytes","number",["number","number"]),wc=h("sqlite3_column_type","number",["number","number"]),xc=h("sqlite3_column_name","string",
["number","number"]),yc=h("sqlite3_reset","number",["number"]),zc=h("sqlite3_clear_bindings","number",["number"]),Ac=h("sqlite3_finalize","number",["number"]),sb=h("sqlite3_create_function_v2","number","number string number number number number number number number".split(" ")),fc=h("sqlite3_value_type","number",["number"]),lb=h("sqlite3_value_bytes","number",["number"]),ic=h("sqlite3_value_text","number",["number"]),jc=h("sqlite3_value_blob","number",["number"]),hc=h("sqlite3_value_double","number",
["number"]),cc=h("sqlite3_result_double","",["number","number"]),kb=h("sqlite3_result_null","",["number"]),dc=h("sqlite3_result_text","",["number","string","number","number"]),ec=h("sqlite3_result_blob","",["number","number","number","number"]),bc=h("sqlite3_result_int","",["number","number"]),va=h("sqlite3_result_error","",["number","string","number"]),tb=h("sqlite3_aggregate_context","number",["number","number"]),ob=h("RegisterExtensionFunctions","number",["number"]),ub=h("sqlite3_update_hook",
"number",["number","number","number"]);c.prototype.bind=function(f){if(!this.Qa)throw"Statement closed";this.reset();return Array.isArray(f)?this.Kb(f):f!=null&&typeof f==="object"?this.Lb(f):!0};c.prototype.step=function(){if(!this.Qa)throw"Statement closed";this.Pa=1;var f=pc(this.Qa);switch(f){case 100:return!0;case 101:return!1;default:throw this.db.handleError(f);}};c.prototype.Db=function(f){f==null&&(f=this.Pa,this.Pa+=1);return tc(this.Qa,f)};c.prototype.Tb=function(f){f==null&&(f=this.Pa,
this.Pa+=1);if(typeof BigInt!=="function")throw Error("BigInt is not supported");return BigInt(this.Eb(f))};c.prototype.Eb=function(f){f==null&&(f=this.Pa,this.Pa+=1);var k=uc(this.Qa,f);f=rb(this.Qa,f);return A(k,f,!0)};c.prototype.getBlob=function(f){f==null&&(f=this.Pa,this.Pa+=1);var k=rb(this.Qa,f);f=vc(this.Qa,f);for(var n=new Uint8Array(k),q=0;q<k;q+=1)n[q]=r[f+q];return n};c.prototype.get=function(f,k){k=k||{};f!=null&&this.bind(f)&&this.step();f=[];for(var n=sc(this.Qa),q=0;q<n;q+=1)switch(wc(this.Qa,
q)){case 1:var t=k.useBigInt?this.Tb(q):this.Db(q);f.push(t);break;case 2:f.push(this.Db(q));break;case 3:f.push(this.Eb(q));break;case 4:f.push(this.getBlob(q));break;default:f.push(null)}return f};c.prototype.qb=function(){for(var f=[],k=rc(this.Qa),n=0;n<k;n+=1)f.push(xc(this.Qa,n));return f};c.prototype.Cb=function(f,k){f=this.get(f,k);k=this.qb();for(var n={},q=0;q<k.length;q+=1)n[k[q]]=f[q];return n};c.prototype.Xb=function(){return B(this.Qa)};c.prototype.Ub=function(){return pb(this.Qa)};
c.prototype.run=function(f){f!=null&&this.bind(f);this.step();return this.reset()};c.prototype.yb=function(f,k){k==null&&(k=this.Pa,this.Pa+=1);var n=ea(f);this.nb.push(n);this.db.handleError(lc(this.Qa,k,n,m(f),0))};c.prototype.Jb=function(f,k){k==null&&(k=this.Pa,this.Pa+=1);var n=da(f.length);r.set(f,n);this.nb.push(n);this.db.handleError(qb(this.Qa,k,n,f.length,0))};c.prototype.xb=function(f,k){k==null&&(k=this.Pa,this.Pa+=1);this.db.handleError((f===(f|0)?nc:mc)(this.Qa,k,f))};c.prototype.Mb=
function(f){f==null&&(f=this.Pa,this.Pa+=1);qb(this.Qa,f,0,0,0)};c.prototype.zb=function(f,k){k==null&&(k=this.Pa,this.Pa+=1);switch(typeof f){case "string":this.yb(f,k);return;case "number":this.xb(f,k);return;case "bigint":this.yb(f.toString(),k);return;case "boolean":this.xb(f+0,k);return;case "object":if(f===null){this.Mb(k);return}if(f.length!=null){this.Jb(f,k);return}}throw"Wrong API use : tried to bind a value of an unknown type ("+f+").";};c.prototype.Lb=function(f){var k=this;Object.keys(f).forEach(function(n){var q=
oc(k.Qa,n);q!==0&&k.zb(f[n],q)});return!0};c.prototype.Kb=function(f){for(var k=0;k<f.length;k+=1)this.zb(f[k],k+1);return!0};c.prototype.reset=function(){this.freemem();return zc(this.Qa)===0&&yc(this.Qa)===0};c.prototype.freemem=function(){for(var f;(f=this.nb.pop())!==void 0;)x(f)};c.prototype.Za=function(){this.freemem();var f=Ac(this.Qa)===0;delete this.db.hb[this.Qa];this.Qa=0;return f};d.prototype.next=function(){if(this.gb===null)return{done:!0};this.Ya!==null&&(this.Ya.Za(),this.Ya=null);
if(!this.db.db)throw this.ib(),Error("Database closed");var f=qa(),k=C(4);ra(g);ra(k);try{this.db.handleError(Qa(this.db.db,this.mb,-1,g,k));this.mb=z(k,"i32");var n=z(g,"i32");if(n===0)return this.ib(),{done:!0};this.Ya=new c(n,this.db);this.db.hb[n]=this.Ya;return{value:this.Ya,done:!1}}catch(q){throw this.sb=A(this.mb),this.ib(),q;}finally{sa(f)}};d.prototype.ib=function(){x(this.gb);this.gb=null};d.prototype["return"]=function(){this.Ya!==null&&(this.Ya.Za(),this.Ya=null);this.ib();return{done:!0}};
d.prototype.Vb=function(){return this.sb!==null?this.sb:A(this.mb)};typeof Symbol==="function"&&typeof Symbol.iterator==="symbol"&&(d.prototype[Symbol.iterator]=function(){return this});e.prototype.run=function(f,k){if(!this.db)throw"Database closed";if(k){f=this.tb(f,k);try{f.step()}finally{f.Za()}}else{f=ea(f);try{this.handleError(u(this.db,f,0,0,g))}finally{x(f)}}return this};e.prototype.exec=function(f,k,n){if(!this.db)throw"Database closed";var q=qa(),t=null,v=null,J=null;try{J=v=ea(f);var I=
C(4);for(f=[];z(J,"i8")!==0;){ra(g);ra(I);this.handleError(Qa(this.db,J,-1,g,I));var L=z(g,"i32");J=z(I,"i32");if(L!==0){var G=null;t=new c(L,this);for(k!=null&&t.bind(k);t.step();)G===null&&(G={columns:t.qb(),values:[]},f.push(G)),G.values.push(t.get(null,n));t.Za()}}return f}catch(ma){throw t&&t.Za(),ma;}finally{v&&x(v),sa(q)}};e.prototype.Qb=function(f,k,n,q,t){typeof k==="function"&&(q=n,n=k,k=void 0);f=this.tb(f,k);try{for(;f.step();)n(f.Cb(null,t))}finally{f.Za()}if(typeof q==="function")return q()};
e.prototype.tb=function(f,k){f=ea(f);try{ra(g),this.handleError(Qa(this.db,f,-1,g,0))}finally{x(f)}f=z(g,"i32");if(f===0)throw"Nothing to prepare";var n=new c(f,this);k!=null&&n.bind(k);return this.hb[f]=n};e.prototype.Yb=function(f){return new d(f,this)};e.prototype.Sb=function(){Object.values(this.hb).forEach(function(k){k.Za()});Object.values(this.Sa).forEach(D);this.Sa={};this.handleError(w(this.db));var f=ta(this.filename);this.handleError(p(this.filename,g));this.db=z(g,"i32");ob(this.db);return f};
e.prototype.close=function(){this.db!==null&&(Object.values(this.hb).forEach(function(f){f.Za()}),Object.values(this.Sa).forEach(D),this.Sa={},this.ab&&(D(this.ab),this.ab=void 0),this.handleError(w(this.db)),ua("/"+this.filename),this.db=null)};e.prototype.handleError=function(f){if(f===0)return null;f=qc(this.db);throw Error(f);};e.prototype.Wb=function(){return y(this.db)};e.prototype.Pb=function(f,k){Object.prototype.hasOwnProperty.call(this.Sa,f)&&(D(this.Sa[f]),delete this.Sa[f]);var n=wa(function(q,
t,v){t=b(t,v);try{var J=k.apply(null,t)}catch(I){va(q,I,-1);return}a(q,J)},"viii");this.Sa[f]=n;this.handleError(sb(this.db,f,k.length,1,0,n,0,0,0));return this};e.prototype.Ob=function(f,k){var n=k.init||function(){return null},q=k.finalize||function(L){return L},t=k.step;if(!t)throw"An aggregate function must have a step function in "+f;var v={};Object.hasOwnProperty.call(this.Sa,f)&&(D(this.Sa[f]),delete this.Sa[f]);k=f+"__finalize";Object.hasOwnProperty.call(this.Sa,k)&&(D(this.Sa[k]),delete this.Sa[k]);
var J=wa(function(L,G,ma){var Y=tb(L,1);Object.hasOwnProperty.call(v,Y)||(v[Y]=n());G=b(G,ma);G=[v[Y]].concat(G);try{v[Y]=t.apply(null,G)}catch(Cc){delete v[Y],va(L,Cc,-1)}},"viii"),I=wa(function(L){var G=tb(L,1);try{var ma=q(v[G])}catch(Y){delete v[G];va(L,Y,-1);return}a(L,ma);delete v[G]},"vi");this.Sa[f]=J;this.Sa[k]=I;this.handleError(sb(this.db,f,t.length-1,1,0,0,J,I,0));return this};e.prototype.dc=function(f){this.ab&&(ub(this.db,0,0),D(this.ab),this.ab=void 0);if(!f)return this;this.ab=wa(function(k,
n,q,t,v){switch(n){case 18:k="insert";break;case 23:k="update";break;case 9:k="delete";break;default:throw"unknown operationCode in updateHook callback: "+n;}q=A(q);t=A(t);if(v>Number.MAX_SAFE_INTEGER)throw"rowId too big to fit inside a Number";f(k,q,t,Number(v))},"viiiij");ub(this.db,this.ab,0);return this};c.prototype.bind=c.prototype.bind;c.prototype.step=c.prototype.step;c.prototype.get=c.prototype.get;c.prototype.getColumnNames=c.prototype.qb;c.prototype.getAsObject=c.prototype.Cb;c.prototype.getSQL=
c.prototype.Xb;c.prototype.getNormalizedSQL=c.prototype.Ub;c.prototype.run=c.prototype.run;c.prototype.reset=c.prototype.reset;c.prototype.freemem=c.prototype.freemem;c.prototype.free=c.prototype.Za;d.prototype.next=d.prototype.next;d.prototype.getRemainingSQL=d.prototype.Vb;e.prototype.run=e.prototype.run;e.prototype.exec=e.prototype.exec;e.prototype.each=e.prototype.Qb;e.prototype.prepare=e.prototype.tb;e.prototype.iterateStatements=e.prototype.Yb;e.prototype["export"]=e.prototype.Sb;e.prototype.close=
e.prototype.close;e.prototype.handleError=e.prototype.handleError;e.prototype.getRowsModified=e.prototype.Wb;e.prototype.create_function=e.prototype.Pb;e.prototype.create_aggregate=e.prototype.Ob;e.prototype.updateHook=e.prototype.dc;l.Database=e};var xa="./this.program",ya=(a,b)=>{throw b;},za=globalThis.document?.currentScript?.src;typeof __filename!="undefined"?za=__filename:ba&&(za=self.location.href);var Aa="",Ba,Ca;
if(ca){var fs=require("node:fs");Aa=__dirname+"/";Ca=a=>{a=Da(a)?new URL(a):a;return fs.readFileSync(a)};Ba=async a=>{a=Da(a)?new URL(a):a;return fs.readFileSync(a,void 0)};process.argv.length>1&&(xa=process.argv[1].replace(/\\/g,"/"));process.argv.slice(2);typeof module!="undefined"&&(module.exports=l);ya=(a,b)=>{process.exitCode=a;throw b;}}else if(aa||ba){try{Aa=(new URL(".",za)).href}catch{}ba&&(Ca=a=>{var b=new XMLHttpRequest;b.open("GET",a,!1);b.responseType="arraybuffer";b.send(null);return new Uint8Array(b.response)});
Ba=async a=>{if(Da(a))return new Promise((c,d)=>{var e=new XMLHttpRequest;e.open("GET",a,!0);e.responseType="arraybuffer";e.onload=()=>{e.status==200||e.status==0&&e.response?c(e.response):d(e.status)};e.onerror=d;e.send(null)});var b=await fetch(a,{credentials:"same-origin"});if(b.ok)return b.arrayBuffer();throw Error(b.status+" : "+b.url);}}var Ea=console.log.bind(console),E=console.error.bind(console),Fa,Ga=!1,Ha,Da=a=>a.startsWith("file://");
function Ia(){if(!r?.buffer?.resizable){var a=Ja.buffer;r=new Int8Array(a);Ka=new Int16Array(a);F=new Uint8Array(a);H=new Int32Array(a);K=new Uint32Array(a);La=new Float32Array(a);Ma=new Float64Array(a);M=new BigInt64Array(a)}}function Na(){var a=l.preRun;a&&(typeof a=="function"&&(a=[a]),Oa.push(...a));for(a=Oa;a.length>0;)a.shift()(l)}function Pa(){var a=l.postRun;a&&(typeof a=="function"&&(a=[a]),Ra.push(...a));for(a=Ra;a.length>0;)a.shift()(l)}
function Sa(a){l.onAbort?.(a);a=`Aborted(${a})`;E(a);Ga=!0;throw new WebAssembly.RuntimeError(a+". Build with -sASSERTIONS for more info.");}var Ta;async function Ua(a){if(!Fa)try{var b=await Ba(a);return new Uint8Array(b)}catch{}if(a==Ta&&Fa)a=new Uint8Array(Fa);else if(Ca)a=Ca(a);else throw"both async and sync fetching of the wasm failed";return a}
async function Va(a,b){try{var c=await Ua(a);return await WebAssembly.instantiate(c,b)}catch(d){E(`failed to asynchronously prepare wasm: ${d}`),Sa(d)}}async function Wa(a){var b=Ta;if(!Fa&&!Da(b)&&!ca)try{var c=fetch(b,{credentials:"same-origin"});return await WebAssembly.instantiateStreaming(c,a)}catch(d){E(`wasm streaming compile failed: ${d}`),E("falling back to ArrayBuffer instantiation")}return Va(b,a)}
class Xa{name="ExitStatus";constructor(a){this.message=`Program terminated with exit(${a})`;this.status=a}}
var r,Ra=[],Oa=[],Ya=!0,Za=new TextDecoder,$a=(a,b,c,d)=>{c=b+c;if(d)return c;for(;a[b]&&!(b>=c);)++b;return b},F,A=(a,b,c)=>a?Za.decode(F.subarray(a,$a(F,a,b,c))):"",ab=(a,b)=>{for(var c=0,d=a.length-1;d>=0;d--){var e=a[d];e==="."?a.splice(d,1):e===".."?(a.splice(d,1),c++):c&&(a.splice(d,1),c--)}if(b)for(;c;c--)a.unshift("..");return a},ha=a=>{var b=a.charAt(0)==="/",c=a.slice(-1)==="/";(a=ab(a.split("/").filter(d=>!!d),!b).join("/"))||b||(a=".");a&&c&&(a+="/");return(b?"/":"")+a},bb=a=>{var b=/^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/.exec(a).slice(1);
a=b[0];b=b[1];if(!a&&!b)return".";b&&=b.slice(0,-1);return a+b},cb=a=>a&&a.match(/([^\/]+|\/)\/*$/)[1],db=()=>{if(ca){var a=require("node:crypto");return b=>(a.randomFillSync(b),0)}return b=>(crypto.getRandomValues(b),0)},eb=a=>(eb=db())(a),fb=(...a)=>{for(var b="",c=!1,d=a.length-1;d>=-1&&!c;d--){c=d>=0?a[d]:"/";if(typeof c!="string")throw new TypeError("Arguments to path.resolve must be strings");if(!c)return"";b=c+"/"+b;c=c.charAt(0)==="/"}b=ab(b.split("/").filter(e=>!!e),!c).join("/");return(c?
"/":"")+b||"."},gb=a=>{var b=$a(a,0);return Za.decode(a.buffer?a.subarray(0,b):new Uint8Array(a.slice(0,b)))},hb=[],m=a=>{for(var b=0,c=0;c<a.length;++c){var d=a.charCodeAt(c);d<=127?b++:d<=2047?b+=2:d>=55296&&d<=57343?(b+=4,++c):b+=3}return b},N=(a,b,c,d)=>{if(!(d>0))return 0;var e=c;d=c+d-1;for(var g=0;g<a.length;++g){var h=a.codePointAt(g);if(h<=127){if(c>=d)break;b[c++]=h}else if(h<=2047){if(c+1>=d)break;b[c++]=192|h>>6;b[c++]=128|h&63}else if(h<=65535){if(c+2>=d)break;b[c++]=224|h>>12;b[c++]=
128|h>>6&63;b[c++]=128|h&63}else{if(c+3>=d)break;b[c++]=240|h>>18;b[c++]=128|h>>12&63;b[c++]=128|h>>6&63;b[c++]=128|h&63;g++}}b[c]=0;return c-e},ka=a=>{var b=Array(m(a)+1);a=N(a,b,0,b.length);b.length=a;return b},ib=[];function jb(a,b){ib[a]={input:[],output:[],fb:b};mb(a,nb)}
var nb={open(a){var b=ib[a.node.rdev];if(!b)throw new O(43);a.tty=b;a.seekable=!1},close(a){a.tty.fb.fsync(a.tty)},fsync(a){a.tty.fb.fsync(a.tty)},read(a,b,c,d){if(!a.tty||!a.tty.fb.Fb)throw new O(60);for(var e=0,g=0;g<d;g++){try{var h=a.tty.fb.Fb(a.tty)}catch(p){throw new O(29);}if(h===void 0&&!e)throw new O(6);if(h===null||h===void 0)break;e++;b[c+g]=h;if(h===10)break}e&&(a.node.atime=Date.now());return e},write(a,b,c,d){if(!a.tty||!a.tty.fb.ub)throw new O(60);try{for(var e=0;e<d;e++)a.tty.fb.ub(a.tty,
b[c+e])}catch(g){throw new O(29);}d&&(a.node.mtime=a.node.ctime=Date.now());return e}},vb={Fb(){a:{if(!hb.length){var a=null;if(ca){var b=Buffer.alloc(256),c=0;try{c=fs.readSync(process.stdin.fd,b,0,256)}catch(d){if(d.toString().includes("EOF"))c=0;else throw d;}c>0&&(a=b.toString("utf-8",0,c))}else globalThis.window?.prompt&&(a=window.prompt("Input: "),a!==null&&(a+="\n"));if(!a){a=null;break a}hb=ka(a)}a=hb.shift()}return a},ub(a,b){b===null||b===10?(Ea(gb(a.output)),a.output=[]):b!=0&&a.output.push(b)},
fsync(a){a.output?.length>0&&(Ea(gb(a.output)),a.output=[])},mc(){return{hc:25856,kc:5,fc:191,jc:35387,ec:[3,28,127,21,4,0,1,0,17,19,26,0,18,15,23,22,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]}},nc(){return 0},oc(){return[24,80]}},wb={ub(a,b){b===null||b===10?(E(gb(a.output)),a.output=[]):b!=0&&a.output.push(b)},fsync(a){a.output?.length>0&&(E(gb(a.output)),a.output=[])}},P={Wa:null,$a(){return P.createNode(null,"/",16895,0)},createNode(a,b,c,d){if((c&61440)===24576||(c&61440)===4096)throw new O(63);P.Wa||
(P.Wa={dir:{node:{Ua:P.Ma.Ua,Xa:P.Ma.Xa,lookup:P.Ma.lookup,jb:P.Ma.jb,rename:P.Ma.rename,unlink:P.Ma.unlink,rmdir:P.Ma.rmdir,readdir:P.Ma.readdir,symlink:P.Ma.symlink},stream:{Va:P.Na.Va}},file:{node:{Ua:P.Ma.Ua,Xa:P.Ma.Xa},stream:{Va:P.Na.Va,read:P.Na.read,write:P.Na.write,kb:P.Na.kb,lb:P.Na.lb}},link:{node:{Ua:P.Ma.Ua,Xa:P.Ma.Xa,readlink:P.Ma.readlink},stream:{}},Ab:{node:{Ua:P.Ma.Ua,Xa:P.Ma.Xa},stream:xb}});c=yb(a,b,c,d);Q(c.mode)?(c.Ma=P.Wa.dir.node,c.Na=P.Wa.dir.stream,c.Ra={}):(c.mode&61440)===
32768?(c.Ma=P.Wa.file.node,c.Na=P.Wa.file.stream,c.Ta=0,c.Ra=P.Rb??(P.Rb=new Uint8Array(0))):(c.mode&61440)===40960?(c.Ma=P.Wa.link.node,c.Na=P.Wa.link.stream):(c.mode&61440)===8192&&(c.Ma=P.Wa.Ab.node,c.Na=P.Wa.Ab.stream);c.atime=c.mtime=c.ctime=Date.now();a&&(a.Ra[b]=c,a.atime=a.mtime=a.ctime=c.atime);return c},Ma:{Ua(a){var b={};b.dev=(a.mode&61440)===8192?a.id:1;b.ino=a.id;b.mode=a.mode;b.nlink=1;b.uid=0;b.gid=0;b.rdev=a.rdev;Q(a.mode)?b.size=4096:(a.mode&61440)===32768?b.size=a.Ta:(a.mode&61440)===
40960?b.size=a.link.length:b.size=0;b.atime=new Date(a.atime);b.mtime=new Date(a.mtime);b.ctime=new Date(a.ctime);b.atimeMs=a.atime;b.mtimeMs=a.mtime;b.ctimeMs=a.ctime;b.blksize=4096;b.blocks=Math.ceil(b.size/b.blksize);return b},Xa(a,b){for(var c of["mode","atime","mtime","ctime"])b[c]!=null&&(a[c]=b[c]);b.size!==void 0&&(b=b.size,a.Ta!=b&&(c=a.Ra,a.Ra=new Uint8Array(b),a.Ra.set(c.subarray(0,Math.min(b,a.Ta))),a.Ta=b))},lookup(){P.ob||(P.ob=new O(44),P.ob.stack="<generic error, no stack>");throw P.ob;
},jb(a,b,c,d){return P.createNode(a,b,c,d)},rename(a,b,c){try{var d=R(b,c)}catch(g){}if(d&&Q(a.mode))for(var e in d.Ra)throw new O(55);delete a.parent.Ra[a.name];b.Ra[c]=a;a.name=c;b.ctime=b.mtime=a.parent.ctime=a.parent.mtime=Date.now()},unlink(a,b){delete a.Ra[b];a.ctime=a.mtime=Date.now()},rmdir(a,b){var c=R(a,b),d;for(d in c.Ra)throw new O(55);delete a.Ra[b];a.ctime=a.mtime=Date.now()},readdir(a){return[".","..",...Object.keys(a.Ra)]},symlink(a,b,c){a=P.createNode(a,b,41471,0);a.link=c;return a},
readlink(a){if((a.mode&61440)!==40960)throw new O(28);return a.link}},Na:{read(a,b,c,d,e){if(e>=a.node.Ta)return 0;d=Math.min(a.node.Ta-e,d);b.set(a.node.Ra.subarray(e,e+d),c);return d},write(a,b,c,d,e,g){b.buffer===r.buffer&&(g=!1);if(!d)return 0;a=a.node;a.mtime=a.ctime=Date.now();if(g)a.Ra=b.subarray(c,c+d),a.Ta=d;else if(a.Ta||e){g=e+d;var h=a.Ra.length;h>=g||(g=Math.max(g,h*(h<1048576?2:1.125)>>>0),h&&(g=Math.max(g,256)),h=a.Ra.subarray(0,a.Ta),a.Ra=new Uint8Array(g),a.Ra.set(h));a.Ra.set(b.subarray(c,
c+d),e);a.Ta=Math.max(a.Ta,e+d)}else a.Ra=b.slice(c,c+d),a.Ta=d;return d},Va(a,b,c){c===1?b+=a.position:c===2&&(a.node.mode&61440)===32768&&(b+=a.node.Ta);if(b<0)throw new O(28);return b},kb(a,b,c,d,e){if((a.node.mode&61440)!==32768)throw new O(43);a=a.node.Ra;if(e&2||a.buffer!==r.buffer){e=!0;d=Math.ceil(b/65536)*65536;var g=zb(65536,d);g&&F.fill(0,g,g+d);d=g;if(!d)throw new O(48);if(a){if(c>0||c+b<a.length)a.subarray?a=a.subarray(c,c+b):a=Array.prototype.slice.call(a,c,c+b);r.set(a,d)}}else e=!1,
d=a.byteOffset;return{bc:d,Ib:e}},lb(a,b,c,d){P.Na.write(a,b,0,d,c,!1);return 0}}},ia=(a,b)=>{var c=0;a&&(c|=365);b&&(c|=146);return c},Ab=null,Bb={},Cb=[],Db=1,S=[],Eb=!1,Fb=!0,Gb={},O=class{name="ErrnoError";constructor(a){this.Oa=a}},Hb=class{shared={};node=null;get flags(){return this.shared.flags}set flags(a){this.shared.flags=a}get position(){return this.shared.position}set position(a){this.shared.position=a}},Ib=class{Ma={};Na={};cb=null;listeners=null;wb=0;constructor(a,b,c,d){a||=this;this.parent=
a;this.$a=a.$a;this.id=Db++;this.name=b;this.mode=c;this.rdev=d;this.atime=this.mtime=this.ctime=Date.now()}get read(){return(this.mode&365)===365}set read(a){a?this.mode|=365:this.mode&=-366}get write(){return(this.mode&146)===146}set write(a){a?this.mode|=146:this.mode&=-147}ac(){if(this.listeners){var a;for(b of this.listeners)b.exclusive?(a||=[]).push(b):b.Nb(32);if(a){var b=(this.wb||0)%a.length;this.wb=b+1;a[b].Nb(32)}}}};
function T(a,b={}){if(!a)throw new O(44);b.pb??(b.pb=!0);a.charAt(0)==="/"||(a="//"+a);var c=0;a:for(;c<40;c++){a=a.split("/").filter(p=>!!p);for(var d=Ab,e="/",g=0;g<a.length;g++){var h=g===a.length-1;if(h&&b.parent)break;if(a[g]!==".")if(a[g]==="..")if(e=bb(e),d===d.parent){a=e+"/"+a.slice(g+1).join("/");c--;continue a}else d=d.parent;else{e=ha(e+"/"+a[g]);try{d=R(d,a[g])}catch(p){if(p?.Oa===44&&h&&b.$b)return{path:e};throw p;}!d.cb||h&&!b.pb||(d=d.cb.root);if((d.mode&61440)===40960&&(!h||b.bb)){if(!d.Ma.readlink)throw new O(52);
d=d.Ma.readlink(d);d.charAt(0)==="/"||(d=bb(e)+"/"+d);a=d+"/"+a.slice(g+1).join("/");continue a}}}return{path:e,node:d}}throw new O(32);}function fa(a){for(var b;;){if(a===a.parent)return a=a.$a.Hb,b?a[a.length-1]!=="/"?`${a}/${b}`:a+b:a;b=b?`${a.name}/${b}`:a.name;a=a.parent}}function Jb(a,b){for(var c=0,d=0;d<b.length;d++)c=(c<<5)-c+b.charCodeAt(d)|0;return(a+c>>>0)%S.length}
function Kb(a){var b=Jb(a.parent.id,a.name);if(S[b]===a)S[b]=a.eb;else for(b=S[b];b;){if(b.eb===a){b.eb=a.eb;break}b=b.eb}}function R(a,b){var c=Q(a.mode)?(c=Lb(a,"x"))?c:a.Ma.lookup?0:2:54;if(c)throw new O(c);for(c=S[Jb(a.id,b)];c;c=c.eb){var d=c.name;if(c.parent.id===a.id&&d===b)return c}return a.Ma.lookup(a,b)}function yb(a,b,c,d){a=new Ib(a,b,c,d);b=Jb(a.parent.id,a.name);a.eb=S[b];return S[b]=a}function Q(a){return(a&61440)===16384}
function Lb(a,b){return Fb?0:b.includes("r")&&!(a.mode&292)||b.includes("w")&&!(a.mode&146)||b.includes("x")&&!(a.mode&73)?2:0}function Mb(a,b){if(!Q(a.mode))return 54;try{return R(a,b),20}catch(c){}return Lb(a,"wx")}function Nb(a,b,c){try{var d=R(a,b)}catch(e){return e.Oa}if(a=Lb(a,"wx"))return a;if(c){if(!Q(d.mode))return 54;if(d===d.parent||fa(d)==="/")return 10}else if(Q(d.mode))return 31;return 0}function Ob(a){if(!a)throw new O(63);return a}
function U(a){a=Cb[a];if(!a)throw new O(8);return a}function Pb(a,b=-1){a=Object.assign(new Hb,a);if(b==-1)a:{for(b=0;b<=4096;b++)if(!Cb[b])break a;throw new O(33);}a.fd=b;return Cb[b]=a}function Qb(a,b=-1){a=Pb(a,b);a.Na?.lc?.(a);return a}function Rb(a,b,c){var d=a?.Na.Xa;a=d?a:b;d??=b.Ma.Xa;Ob(d);try{d(a,c)}catch(e){if(e instanceof RangeError)throw new O(22);throw e;}}var xb={open(a){a.Na=Bb[a.node.rdev].Na;a.Na.open?.(a)},Va(){throw new O(70);}};function mb(a,b){Bb[a]={Na:b}}
function Sb(a,b){var c=b==="/";if(c&&Ab)throw new O(10);if(!c&&b){var d=T(b,{pb:!1});b=d.path;d=d.node;if(d.cb)throw new O(10);if(!Q(d.mode))throw new O(54);}b={type:a,qc:{},Hb:b,Zb:[]};a=a.$a(b);a.$a=b;b.root=a;c?Ab=a:d&&(d.cb=b,d.$a&&d.$a.Zb.push(b))}function Tb(a,b,c){var d=T(a,{parent:!0}).node;a=cb(a);if(!a)throw new O(28);if(a==="."||a==="..")throw new O(20);var e=Mb(d,a);if(e)throw new O(e);if(!d.Ma.jb)throw new O(63);return d.Ma.jb(d,a,b,c)}
function ja(a,b=438){return Tb(a,b&4095|32768,0)}function V(a,b=511){return Tb(a,b&1023|16384,0)}function Ub(a,b,c){typeof c=="undefined"&&(c=b,b=438);Tb(a,b|8192,c)}function Vb(a,b){if(!fb(a))throw new O(44);var c=T(b,{parent:!0}).node;if(!c)throw new O(44);b=cb(b);var d=Mb(c,b);if(d)throw new O(d);if(!c.Ma.symlink)throw new O(63);c.Ma.symlink(c,b,a)}
function Wb(a){var b=T(a,{parent:!0}).node;a=cb(a);var c=R(b,a),d=Nb(b,a,!0);if(d)throw new O(d);if(!b.Ma.rmdir)throw new O(63);if(c.cb)throw new O(10);b.Ma.rmdir(b,a);Kb(c)}function ua(a){var b=T(a,{parent:!0}).node;if(!b)throw new O(44);a=cb(a);var c=R(b,a),d=Nb(b,a,!1);if(d)throw new O(d);if(!b.Ma.unlink)throw new O(63);if(c.cb)throw new O(10);b.Ma.unlink(b,a);Kb(c)}function Xb(a,b=!1){a=T(a,{bb:!b}).node;return Ob(a.Ma.Ua)(a)}
function Yb(a,b,c){Rb(a,b,{mode:c&4095|b.mode&-4096,ctime:Date.now(),Bb:!1})}function la(a,b){a=typeof a=="string"?T(a,{bb:!0}).node:a;Yb(null,a,b)}function Zb(a,b,c){if(Q(b.mode))throw new O(31);if((b.mode&61440)!==32768)throw new O(28);var d=Lb(b,"w");if(d)throw new O(d);Rb(a,b,{size:c,timestamp:Date.now()})}function $b(a,b,c,d=!1){a=T(a,{bb:!d});Rb(null,a.node,{atime:b,mtime:c,Bb:d})}
function na(a,b,c=438){if(a==="")throw new O(44);if(typeof b=="string"){var d={r:0,"r+":2,w:577,"w+":578,a:1089,"a+":1090}[b];if(typeof d=="undefined")throw Error(`Unknown file open mode: ${b}`);b=d}c=b&64?c&4095|32768:0;if(typeof a=="object")d=a;else{var e=a.endsWith("/");a=T(a,{bb:!(b&131072),$b:!0});d=a.node;a=a.path}var g=!1;if(b&64)if(d){if(b&128)throw new O(20);}else{if(e)throw new O(31);d=Tb(a,c|511,0);g=!0}if(!d)throw new O(44);(d.mode&61440)===8192&&(b&=-513);if(b&65536&&!Q(d.mode))throw new O(54);
if(!g&&(d?(d.mode&61440)===40960?e=32:(e=["r","w","rw"][b&3],b&512&&(e+="w"),e=Q(d.mode)&&(e!=="r"||b&576)?31:Lb(d,e)):e=44,e))throw new O(e);b&512&&!g&&(e=d,e=typeof e=="string"?T(e,{bb:!0}).node:e,Zb(null,e,0));b&=-131713;e=Pb({node:d,path:fa(d),flags:b,seekable:!0,position:0,Na:d.Na,cc:[],error:!1});e.Na.open&&e.Na.open(e);g&&la(d,c&511);!l.logReadFiles||b&1||a in Gb||(Gb[a]=1,E(`read file: ${a}`));return e}
function pa(a){if(a.fd===null)throw new O(8);a.rb&&(a.rb=null);a.node?.ac();try{a.Na.close&&a.Na.close(a)}catch(b){throw b;}finally{Cb[a.fd]=null}a.fd=null}function ac(a,b,c){if(a.fd===null)throw new O(8);if(!a.seekable||!a.Na.Va)throw new O(70);if(c!=0&&c!=1&&c!=2)throw new O(28);a.position=a.Na.Va(a,b,c);a.cc=[]}
function kc(a,b,c,d,e){if(d<0||e<0)throw new O(28);if(a.fd===null)throw new O(8);if((a.flags&2097155)===1)throw new O(8);if(Q(a.node.mode))throw new O(31);if(!a.Na.read)throw new O(28);var g=typeof e!="undefined";if(!g)e=a.position;else if(!a.seekable)throw new O(70);b=a.Na.read(a,b,c,d,e);g||(a.position+=b);return b}
function oa(a,b,c,d,e){if(d<0||e<0)throw new O(28);if(a.fd===null)throw new O(8);if((a.flags&2097155)===0)throw new O(8);if(Q(a.node.mode))throw new O(31);if(!a.Na.write)throw new O(28);a.seekable&&a.flags&1024&&ac(a,0,2);var g=typeof e!="undefined";if(!g)e=a.position;else if(!a.seekable)throw new O(70);b=a.Na.write(a,b,c,d,e,void 0);g||(a.position+=b);return b}
function ta(a){var b={encoding:"binary"};b.flags??(b.flags=0);b.encoding??(b.encoding="binary");b.encoding!=="utf8"&&b.encoding!=="binary"&&Sa(`Invalid encoding type "${b.encoding}"`);var c=na(a,b.flags);a=Xb(a).size;var d=new Uint8Array(a);kc(c,d,0,a,0);b.encoding==="utf8"&&(d=gb(d));pa(c);return d}
function Bc(){var a,b,c;Eb=!0;a??=l.stdin;b??=l.stdout;c??=l.stderr;a?W("stdin",a):Vb("/dev/tty","/dev/stdin");b?W("stdout",null,b):Vb("/dev/tty","/dev/stdout");c?W("stderr",null,c):Vb("/dev/tty1","/dev/stderr");na("/dev/stdin",0);na("/dev/stdout",1);na("/dev/stderr",1)}
function W(a,b,c){a=ha("/dev/"+a);var d=ia(!!b,!!c);W.Gb??(W.Gb=64);var e=W.Gb++<<8|0;mb(e,{open(g){g.seekable=!1},close(){c?.buffer?.length&&c(10)},read(g,h,p,w){for(var u=0,y=0;y<w;y++){try{var B=b()}catch(pb){throw new O(29);}if(B===void 0&&!u)throw new O(6);if(B===null||B===void 0)break;u++;h[p+y]=B}u&&(g.node.atime=Date.now());return u},write(g,h,p,w){for(var u=0;u<w;u++)try{c(h[p+u])}catch(y){throw new O(29);}w&&(g.node.mtime=g.node.ctime=Date.now());return u}});Ub(a,d,e)}var X={},H,K,M;
function Dc(a,b,c=!1){if(b.charAt(0)==="/")return b;a=a===-100?"/":U(a).path;if(b.length==0){if(!c)throw new O(44);return a}return a+"/"+b}
function Ec(a,b){K[a>>2]=b.dev;K[a+4>>2]=b.mode;K[a+8>>2]=b.nlink;K[a+12>>2]=b.uid;K[a+16>>2]=b.gid;K[a+20>>2]=b.rdev;M[a+24>>3]=BigInt(b.size);H[a+32>>2]=4096;H[a+36>>2]=b.blocks;var c=b.atimeMs??b.atime.getTime(),d=b.mtimeMs??b.mtime.getTime(),e=b.ctimeMs??b.ctime.getTime();M[a+40>>3]=BigInt(Math.floor(c/1E3));K[a+48>>2]=Math.floor(c%1E3*1E6);M[a+56>>3]=BigInt(Math.floor(d/1E3));K[a+64>>2]=Math.floor(d%1E3*1E6);M[a+72>>3]=BigInt(Math.floor(e/1E3));K[a+80>>2]=Math.floor(e%1E3*1E6);M[a+88>>3]=BigInt(b.ino);
return 0}
var Fc=void 0,Gc=()=>{var a=H[+Fc>>2];Fc+=4;return a},Ka,Hc=0,Ic=[0,31,60,91,121,152,182,213,244,274,305,335],Jc=[0,31,59,90,120,151,181,212,243,273,304,334],Kc={},Lc=a=>{Ha=a;Ya||Hc>0||(l.onExit?.(a),Ga=!0);ya(a,new Xa(a))},Mc={},Oc=()=>{if(!Nc){var a={USER:"web_user",LOGNAME:"web_user",PATH:"/",PWD:"/",HOME:"/home/web_user",LANG:(globalThis.navigator?.language??"C").replace("-","_")+".UTF-8",_:xa},b;for(b in Mc)Mc[b]===void 0?delete a[b]:a[b]=Mc[b];var c=[];for(b in a)c.push(`${b}=${a[b]}`);Nc=
c}return Nc},Nc,La,Ma;function z(a,b="i8"){b.endsWith("*")&&(b="*");switch(b){case "i1":return r[a];case "i8":return r[a];case "i16":return Ka[a>>1];case "i32":return H[a>>2];case "i64":return M[a>>3];case "float":return La[a>>2];case "double":return Ma[a>>3];case "*":return K[a>>2];default:Sa(`invalid type for getValue: ${b}`)}}
function ra(a){var b="i32";b.endsWith("*")&&(b="*");switch(b){case "i1":r[a]=0;break;case "i8":r[a]=0;break;case "i16":Ka[a>>1]=0;break;case "i32":H[a>>2]=0;break;case "i64":M[a>>3]=BigInt(0);break;case "float":La[a>>2]=0;break;case "double":Ma[a>>3]=0;break;case "*":K[a>>2]=0;break;default:Sa(`invalid type for setValue: ${b}`)}}
var Pc=(a,b,c,d)=>{var e={string:u=>{var y=0;if(u!==null&&u!==void 0&&u!==0){y=m(u)+1;var B=C(y);N(u,F,B,y);y=B}return y},array:u=>{var y=C(u.length);r.set(u,y);return y}};a=l["_"+a];var g=[],h=0;if(d)for(var p=0;p<d.length;p++){var w=e[c[p]];w?(h||=qa(),g[p]=w(d[p])):g[p]=d[p]}c=a(...g);return c=function(u){h&&sa(h);return b==="string"?A(u):b==="boolean"?!!u:u}(c)},ea=a=>{var b=m(a)+1,c=da(b);c&&N(a,F,c,b);return c},Qc,Rc=[],D=a=>{Qc.delete(Z.get(a));Z.set(a,null);Rc.push(a)},Sc=a=>{var b=a.length;
return[b%128|128,b>>7,...a]},Tc={i:127,p:127,j:126,f:125,d:124,e:111},Uc=a=>Sc(Array.from(a,b=>Tc[b])),wa=(a,b)=>{if(!Qc){Qc=new WeakMap;var c=Z.length;if(Qc)for(var d=0;d<0+c;d++){var e=Z.get(d);e&&Qc.set(e,d)}}if(c=Qc.get(a)||0)return c;c=Rc.length?Rc.pop():Z.grow(1);try{Z.set(c,a)}catch(g){if(!(g instanceof TypeError))throw g;b=Uint8Array.of(0,97,115,109,1,0,0,0,1,...Sc([1,96,...Uc(b.slice(1)),...Uc(b[0]==="v"?"":b[0])]),2,7,1,1,101,1,102,0,0,7,5,1,1,102,0,0);b=new WebAssembly.Module(b);b=(new WebAssembly.Instance(b,
{e:{f:a}})).exports.f;Z.set(c,b)}Qc.set(a,c);return c};S.length=4096;Sb(P,"/");V("/tmp");V("/home");V("/home/web_user");(function(){V("/dev");mb(259,{read:()=>0,write:(d,e,g,h)=>h,Va:()=>0});Ub("/dev/null",259);jb(1280,vb);jb(1536,wb);Ub("/dev/tty",1280);Ub("/dev/tty1",1536);var a=new Uint8Array(1024),b=0,c=()=>{b||(eb(a),b=a.byteLength);return a[--b]};W("random",c);W("urandom",c);V("/dev/shm");V("/dev/shm/tmp")})();
(function(){V("/proc");var a=V("/proc/self");V("/proc/self/fd");Sb({$a(){var b=yb(a,"fd",16895,73);b.Na={Va:P.Na.Va};b.Ma={lookup(c,d){c=+d;var e=U(c);c={parent:null,$a:{Hb:"fake"},Ma:{readlink:()=>e.path},id:c+1};return c.parent=c},readdir(){return Array.from(Cb.entries()).filter(([,c])=>c).map(([c])=>c.toString())}};return b}},"/proc/self/fd")})();l.noExitRuntime&&(Ya=l.noExitRuntime);l.print&&(Ea=l.print);l.printErr&&(E=l.printErr);l.wasmBinary&&(Fa=l.wasmBinary);l.thisProgram&&(xa=l.thisProgram);
var Vc=l.preInit;if(Vc)for(typeof Vc=="function"&&(l.preInit=Vc=[Vc]);Vc.length>0;)Vc.shift()();l.stackSave=()=>qa();l.stackRestore=a=>sa(a);l.stackAlloc=a=>C(a);l.cwrap=(a,b,c,d)=>{var e=!c||c.every(g=>g==="number"||g==="boolean");return b!=="string"&&e&&!d?l["_"+a]:(...g)=>Pc(a,b,c,g)};l.addFunction=wa;l.removeFunction=D;l.UTF8ToString=A;l.lengthBytesUTF8=m;l.stringToNewUTF8=ea;l.writeArrayToMemory=(a,b)=>{r.set(a,b)};
var da,x,zb,Wc,sa,C,qa,Ja,Z,Xc={a:(a,b,c,d)=>Sa(`Assertion failed: ${A(a)}, at: `+[b?A(b):"unknown filename",c,d?A(d):"unknown function"]),i:function(a,b){try{return a=A(a),la(a,b),0}catch(c){if(typeof X=="undefined"||c.name!=="ErrnoError")throw c;return-c.Oa}},M:function(a,b,c){try{b=A(b);b=Dc(a,b);if(c&-8)return-28;var d=T(b,{bb:!0}).node;if(!d)return-44;a="";c&4&&(a+="r");c&2&&(a+="w");c&1&&(a+="x");return a&&Lb(d,a)?-2:0}catch(e){if(typeof X=="undefined"||e.name!=="ErrnoError")throw e;return-e.Oa}},
j:function(a,b){try{var c=U(a);Yb(c,c.node,b);return 0}catch(d){if(typeof X=="undefined"||d.name!=="ErrnoError")throw d;return-d.Oa}},h:function(a){try{var b=U(a);Rb(b,b.node,{timestamp:Date.now(),Bb:!1});return 0}catch(c){if(typeof X=="undefined"||c.name!=="ErrnoError")throw c;return-c.Oa}},b:function(a,b,c){Fc=c;try{var d=U(a);switch(b){case 0:var e=Gc();if(e<0)break;for(;Cb[e];)e++;return Qb(d,e).fd;case 1:case 2:return 0;case 3:return d.flags;case 4:return e=Gc(),d.flags=d.flags&-289793|e&289792,
0;case 12:return e=Gc(),Ka[e+0>>1]=2,0;case 13:case 14:return 0}return-28}catch(g){if(typeof X=="undefined"||g.name!=="ErrnoError")throw g;return-g.Oa}},g:function(a,b){try{var c=U(a),d=c.node,e=c.Na.Ua;a=e?c:d;e??=d.Ma.Ua;Ob(e);var g=e(a);return Ec(b,g)}catch(h){if(typeof X=="undefined"||h.name!=="ErrnoError")throw h;return-h.Oa}},I:function(a,b){b=b<-9007199254740992||b>9007199254740992?NaN:Number(b);try{if(isNaN(b))return-22;var c=U(a);if(b<0||(c.flags&2097155)===0)throw new O(28);Zb(c,c.node,
b);return 0}catch(d){if(typeof X=="undefined"||d.name!=="ErrnoError")throw d;return-d.Oa}},H:function(a,b){try{if(!b)return-28;var c=m("/")+1;if(b<c)return-68;N("/",F,a,b);return c}catch(d){if(typeof X=="undefined"||d.name!=="ErrnoError")throw d;return-d.Oa}},E:()=>0,L:function(a,b){try{return a=A(a),Ec(b,Xb(a,!0))}catch(c){if(typeof X=="undefined"||c.name!=="ErrnoError")throw c;return-c.Oa}},C:function(a,b,c){try{return b=A(b),b=Dc(a,b),V(b,c&-19),0}catch(d){if(typeof X=="undefined"||d.name!=="ErrnoError")throw d;
return-d.Oa}},K:function(a,b,c,d){try{b=A(b);var e=d&256;b=Dc(a,b,d&4096);return Ec(c,e?Xb(b,!0):Xb(b))}catch(g){if(typeof X=="undefined"||g.name!=="ErrnoError")throw g;return-g.Oa}},x:function(a,b,c,d){Fc=d;try{b=A(b);b=Dc(a,b);var e=d?Gc():0;c&64&&(e&=-19);return na(b,c,e).fd}catch(g){if(typeof X=="undefined"||g.name!=="ErrnoError")throw g;return-g.Oa}},s:function(a,b,c,d){try{b=A(b);b=Dc(a,b);if(d<=0)return-28;var e=T(b).node;if(!e)throw new O(44);if(!e.Ma.readlink)throw new O(28);var g=e.Ma.readlink(e);
var h=Math.min(d,m(g)),p=r[c+h];N(g,F,c,d+1);r[c+h]=p;return h}catch(w){if(typeof X=="undefined"||w.name!=="ErrnoError")throw w;return-w.Oa}},r:function(a){try{return a=A(a),Wb(a),0}catch(b){if(typeof X=="undefined"||b.name!=="ErrnoError")throw b;return-b.Oa}},f:function(a,b){try{return a=A(a),Ec(b,Xb(a))}catch(c){if(typeof X=="undefined"||c.name!=="ErrnoError")throw c;return-c.Oa}},o:function(a,b,c){try{b=A(b);b=Dc(a,b);if(c)if(c===512)Wb(b);else return-28;else ua(b);return 0}catch(d){if(typeof X==
"undefined"||d.name!=="ErrnoError")throw d;return-d.Oa}},n:function(a,b,c,d){try{d&=256;b=A(b);b=Dc(a,b,!0);var e=Date.now();if(c){function p(w){var u=H[w+8>>2];return u==1073741823?e:u==1073741822?null:(K[w>>2]+H[w+4>>2]*4294967296+(u/1E4|0)*1E4/1E9)*1E3}var g=p(c);var h=p(c+16)}else h=g=e;(h??g)!==null&&$b(b,g,h,d);return 0}catch(p){if(typeof X=="undefined"||p.name!=="ErrnoError")throw p;return-p.Oa}},w:()=>Sa(""),v:()=>{Ya=!1;Hc=0},A:function(a,b){a=a<-9007199254740992||a>9007199254740992?NaN:
Number(a);a=new Date(a*1E3);if(isNaN(a.getTime()))return 1;H[b>>2]=a.getSeconds();H[b+4>>2]=a.getMinutes();H[b+8>>2]=a.getHours();H[b+12>>2]=a.getDate();H[b+16>>2]=a.getMonth();H[b+20>>2]=a.getFullYear()-1900;H[b+24>>2]=a.getDay();var c=a.getFullYear();H[b+28>>2]=(c%4!==0||c%100===0&&c%400!==0?Jc:Ic)[a.getMonth()]+a.getDate()-1|0;H[b+36>>2]=-(a.getTimezoneOffset()*60);c=(new Date(a.getFullYear(),6,1)).getTimezoneOffset();var d=(new Date(a.getFullYear(),0,1)).getTimezoneOffset();H[b+32>>2]=(c!=d&&
a.getTimezoneOffset()==Math.min(d,c))|0;return 0},y:function(a,b,c,d,e,g,h){e=e<-9007199254740992||e>9007199254740992?NaN:Number(e);try{var p=U(d);if(b&2&&!(c&2)&&(p.flags&2097155)!==2)throw new O(2);if((p.flags&2097155)===1)throw new O(2);if(!p.Na.kb)throw new O(43);if(!a)throw new O(28);var w=p.Na.kb(p,a,e,b,c);var u=w.bc;H[g>>2]=w.Ib;K[h>>2]=u;return 0}catch(y){if(typeof X=="undefined"||y.name!=="ErrnoError")throw y;return-y.Oa}},z:function(a,b,c,d,e,g){g=g<-9007199254740992||g>9007199254740992?
NaN:Number(g);try{var h=U(e);if(c&2){if((h.node.mode&61440)!==32768)throw new O(43);d&2||h.Na.lb&&h.Na.lb(h,F.subarray(a,a+b),g,b,d)}}catch(p){if(typeof X=="undefined"||p.name!=="ErrnoError")throw p;return-p.Oa}},k:(a,b)=>{Kc[a]&&(clearTimeout(Kc[a].id),delete Kc[a]);if(!b)return 0;var c=setTimeout(()=>{delete Kc[a];var d=[a,performance.now()],e=Wc;if(!Ga)try{e(...d)}catch(g){g instanceof Xa||g=="unwind"||ya(1,g)}finally{if(!(Ya||Hc>0))try{Ha=d=Ha,Lc(d)}catch(g){g instanceof Xa||g=="unwind"||ya(1,
g)}}},b);Kc[a]={id:c,rc:b};return 0},B:(a,b,c,d)=>{var e=(new Date).getFullYear(),g=(new Date(e,0,1)).getTimezoneOffset();e=(new Date(e,6,1)).getTimezoneOffset();K[a>>2]=Math.max(g,e)*60;H[b>>2]=Number(g!=e);b=h=>{var p=Math.abs(h);return`UTC${h>=0?"-":"+"}${String(Math.floor(p/60)).padStart(2,"0")}${String(p%60).padStart(2,"0")}`};a=b(g);b=b(e);e<g?(N(a,F,c,17),N(b,F,d,17)):(N(a,F,d,17),N(b,F,c,17))},d:()=>Date.now(),p:()=>2147483648,c:()=>performance.now(),l:a=>{var b=F.length;a>>>=0;if(a>2147483648)return!1;
for(var c=1;c<=4;c*=2){var d=b*(1+.2/c);d=Math.min(d,a+100663296);a:{d=(Math.min(2147483648,Math.ceil(Math.max(a,d)/65536)*65536)-Ja.buffer.byteLength+65535)/65536|0;try{Ja.grow(d);Ia();var e=1;break a}catch(g){}e=void 0}if(e)return!0}return!1},F:(a,b)=>{var c=0,d=0,e;for(e of Oc()){var g=b+c;K[a+d>>2]=g;c+=N(e,F,g,Infinity)+1;d+=4}return 0},G:(a,b)=>{var c=Oc();K[a>>2]=c.length;a=0;for(var d of c)a+=m(d)+1;K[b>>2]=a;return 0},e:function(a){try{var b=U(a);pa(b);return 0}catch(c){if(typeof X=="undefined"||
c.name!=="ErrnoError")throw c;return c.Oa}},m:function(a,b){try{var c=U(a);r[b]=c.tty?2:Q(c.mode)?3:(c.mode&61440)===40960?7:4;Ka[b+2>>1]=0;M[b+8>>3]=BigInt(0);M[b+16>>3]=BigInt(0);return 0}catch(d){if(typeof X=="undefined"||d.name!=="ErrnoError")throw d;return d.Oa}},t:function(a,b,c,d){try{a:{var e=U(a);a=b;for(var g,h=b=0;h<c;h++){var p=K[a>>2],w=K[a+4>>2];a+=8;try{var u=kc(e,r,p,w,g)}catch(B){if(b>0&&B instanceof O&&(B.Oa==6||B.Oa==6))break;throw B;}if(u<0){var y=-1;break a}b+=u;if(u<w)break;
typeof g!="undefined"&&(g+=u)}y=b}K[d>>2]=y;return 0}catch(B){if(typeof X=="undefined"||B.name!=="ErrnoError")throw B;return B.Oa}},D:function(a,b,c,d){b=b<-9007199254740992||b>9007199254740992?NaN:Number(b);try{if(isNaN(b))return 22;var e=U(a);ac(e,b,c);M[d>>3]=BigInt(e.position);e.rb&&!b&&c===0&&(e.rb=null);return 0}catch(g){if(typeof X=="undefined"||g.name!=="ErrnoError")throw g;return g.Oa}},J:function(a){try{var b=U(a);return b.Na?.fsync?.(b)}catch(c){if(typeof X=="undefined"||c.name!=="ErrnoError")throw c;
return c.Oa}},q:function(a,b,c,d){try{var e=U(a);a=b;if(c==1)var g=oa(e,r,K[a>>2],K[a+4>>2]);else{for(var h=b=0,p=a;h<c;h++,p+=8)b+=K[p+4>>2];var w=new Uint8Array(b);for(h=p=0;h<c;h++,a+=8){var u=K[a>>2],y=K[a+4>>2];w.set(F.subarray(u,u+y),p);p+=y}g=oa(e,w,0,b)}K[d>>2]=g;return 0}catch(B){if(typeof X=="undefined"||B.name!=="ErrnoError")throw B;return B.Oa}},u:Lc};
async function Yc(){Na();var a=l.setStatus;a&&(a("Running..."),await new Promise(b=>setTimeout(b,1)),setTimeout(a,1,""));Ga||(l.noFSInit||Eb||Bc(),Zc.O(),Fb=!1,l.onRuntimeInitialized?.(),Pa())}var Zc;
(async function(){function a(d){d=Zc=d.exports;l._sqlite3_free=d.Q;l._sqlite3_value_text=d.R;l._sqlite3_prepare_v2=d.S;l._sqlite3_step=d.T;l._sqlite3_reset=d.U;l._sqlite3_exec=d.V;l._sqlite3_finalize=d.W;l._sqlite3_column_name=d.X;l._sqlite3_column_text=d.Y;l._sqlite3_column_type=d.Z;l._sqlite3_errmsg=d._;l._sqlite3_clear_bindings=d.$;l._sqlite3_value_blob=d.aa;l._sqlite3_value_bytes=d.ba;l._sqlite3_value_double=d.ca;l._sqlite3_value_int=d.da;l._sqlite3_value_type=d.ea;l._sqlite3_result_blob=d.fa;
l._sqlite3_result_double=d.ga;l._sqlite3_result_error=d.ha;l._sqlite3_result_int=d.ia;l._sqlite3_result_int64=d.ja;l._sqlite3_result_null=d.ka;l._sqlite3_result_text=d.la;l._sqlite3_aggregate_context=d.ma;l._sqlite3_column_count=d.na;l._sqlite3_data_count=d.oa;l._sqlite3_column_blob=d.pa;l._sqlite3_column_bytes=d.qa;l._sqlite3_column_double=d.ra;l._sqlite3_bind_blob=d.sa;l._sqlite3_bind_double=d.ta;l._sqlite3_bind_int=d.ua;l._sqlite3_bind_text=d.va;l._sqlite3_bind_parameter_index=d.wa;l._sqlite3_sql=
d.xa;l._sqlite3_normalized_sql=d.ya;l._sqlite3_changes=d.za;l._sqlite3_close_v2=d.Aa;l._sqlite3_create_function_v2=d.Ba;l._sqlite3_update_hook=d.Ca;l._sqlite3_open=d.Da;da=l._malloc=d.Ea;x=l._free=d.Fa;l._RegisterExtensionFunctions=d.Ga;zb=d.Ha;Wc=d.Ia;sa=d.Ja;C=d.Ka;qa=d.La;Ja=d.N;Z=d.P;Ia();return Zc}var b={a:Xc},c=l.instantiateWasm;if(c)return new Promise(d=>{c(b,e=>d(a(e)))});Ta??=l.locateFile?l.locateFile("sql-wasm.wasm",Aa):Aa+"sql-wasm.wasm";return function(d){return a(d.instance)}(await Wa(b))})().then(()=>
Yc());


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
