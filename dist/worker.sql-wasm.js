
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
l.onRuntimeInitialized=function(){function a(f,k){switch(typeof k){case "boolean":ac(f,k?1:0);break;case "number":bc(f,k);break;case "string":cc(f,k,-1,-1);break;case "object":if(k===null)kb(f);else if(k.length!=null){var n=da(k.length);m.set(k,n);dc(f,n,k.length,-1);r(n)}else va(f,"Wrong API use : tried to return a value of an unknown type ("+k+").",-1);break;default:kb(f)}}function b(f,k){for(var n=[],q=0;q<f;q+=1){var u=x(k+4*q,"i32"),v=ec(u);if(v===1||v===2)u=fc(u);else if(v===3)u=hc(u);else if(v===
4){v=u;u=ic(v);v=jc(v);for(var J=new Uint8Array(u),I=0;I<u;I+=1)J[I]=m[v+I];u=J}else u=null;n.push(u)}return n}function c(f,k){this.Qa=f;this.db=k;this.Pa=1;this.mb=[]}function d(f,k){this.db=k;this.gb=ea(f);if(this.gb===null)throw Error("Unable to allocate memory for the SQL string");this.lb=this.gb;this.ab=this.sb=null}function e(f){this.filename="dbfile_"+(4294967295*Math.random()>>>0);if(f!=null){var k=this.filename,n="/",q=k;n&&(n=typeof n=="string"?n:fa(n),q=k?ha(n+"/"+k):n);k=ia(!0,!0);q=ja(q,
k);f&&(typeof f=="string"&&(f=ka(f)),f.subarray||(f=new Uint8Array(f)),la(q,k|146),n=na(q,577),oa(n,f,0,f.length,0),pa(n),la(q,k))}this.handleError(p(this.filename,g));this.db=x(g,"i32");nb(this.db);this.hb={};this.Sa={}}var g=z(4),h=l.cwrap,p=h("sqlite3_open","number",["string","number"]),w=h("sqlite3_close_v2","number",["number"]),t=h("sqlite3_exec","number",["number","number","number","number","number"]),y=h("sqlite3_changes","number",["number"]),A=h("sqlite3_sql","string",["number"]),ob=h("sqlite3_normalized_sql",
"string",["number"]),Qa=h("sqlite3_prepare_v2","number",["number","number","number","number","number"]),lc=h("sqlite3_bind_text","number",["number","number","number","number","number"]),pb=h("sqlite3_bind_blob","number",["number","number","number","number","number"]),mc=h("sqlite3_bind_double","number",["number","number","number"]),nc=h("sqlite3_bind_int","number",["number","number","number"]),oc=h("sqlite3_bind_parameter_index","number",["number","string"]),pc=h("sqlite3_step","number",["number"]),
qc=h("sqlite3_errmsg","string",["number"]),rc=h("sqlite3_column_count","number",["number"]),sc=h("sqlite3_data_count","number",["number"]),tc=h("sqlite3_column_double","number",["number","number"]),qb=h("sqlite3_column_text","string",["number","number"]),uc=h("sqlite3_column_blob","number",["number","number"]),vc=h("sqlite3_column_bytes","number",["number","number"]),wc=h("sqlite3_column_type","number",["number","number"]),xc=h("sqlite3_column_name","string",["number","number"]),yc=h("sqlite3_reset",
"number",["number"]),zc=h("sqlite3_clear_bindings","number",["number"]),Ac=h("sqlite3_finalize","number",["number"]),rb=h("sqlite3_create_function_v2","number","number string number number number number number number number".split(" ")),ec=h("sqlite3_value_type","number",["number"]),ic=h("sqlite3_value_bytes","number",["number"]),hc=h("sqlite3_value_text","string",["number"]),jc=h("sqlite3_value_blob","number",["number"]),fc=h("sqlite3_value_double","number",["number"]),bc=h("sqlite3_result_double",
"",["number","number"]),kb=h("sqlite3_result_null","",["number"]),cc=h("sqlite3_result_text","",["number","string","number","number"]),dc=h("sqlite3_result_blob","",["number","number","number","number"]),ac=h("sqlite3_result_int","",["number","number"]),va=h("sqlite3_result_error","",["number","string","number"]),sb=h("sqlite3_aggregate_context","number",["number","number"]),nb=h("RegisterExtensionFunctions","number",["number"]),tb=h("sqlite3_update_hook","number",["number","number","number"]);c.prototype.bind=
function(f){if(!this.Qa)throw"Statement closed";this.reset();return Array.isArray(f)?this.Jb(f):f!=null&&typeof f==="object"?this.Kb(f):!0};c.prototype.step=function(){if(!this.Qa)throw"Statement closed";this.Pa=1;var f=pc(this.Qa);switch(f){case 100:return!0;case 101:return!1;default:throw this.db.handleError(f);}};c.prototype.Db=function(f){f==null&&(f=this.Pa,this.Pa+=1);return tc(this.Qa,f)};c.prototype.Sb=function(f){f==null&&(f=this.Pa,this.Pa+=1);f=qb(this.Qa,f);if(typeof BigInt!=="function")throw Error("BigInt is not supported");
return BigInt(f)};c.prototype.Xb=function(f){f==null&&(f=this.Pa,this.Pa+=1);return qb(this.Qa,f)};c.prototype.getBlob=function(f){f==null&&(f=this.Pa,this.Pa+=1);var k=vc(this.Qa,f);f=uc(this.Qa,f);for(var n=new Uint8Array(k),q=0;q<k;q+=1)n[q]=m[f+q];return n};c.prototype.get=function(f,k){k=k||{};f!=null&&this.bind(f)&&this.step();f=[];for(var n=sc(this.Qa),q=0;q<n;q+=1)switch(wc(this.Qa,q)){case 1:var u=k.useBigInt?this.Sb(q):this.Db(q);f.push(u);break;case 2:f.push(this.Db(q));break;case 3:f.push(this.Xb(q));
break;case 4:f.push(this.getBlob(q));break;default:f.push(null)}return f};c.prototype.qb=function(){for(var f=[],k=rc(this.Qa),n=0;n<k;n+=1)f.push(xc(this.Qa,n));return f};c.prototype.Cb=function(f,k){f=this.get(f,k);k=this.qb();for(var n={},q=0;q<k.length;q+=1)n[k[q]]=f[q];return n};c.prototype.Wb=function(){return A(this.Qa)};c.prototype.Tb=function(){return ob(this.Qa)};c.prototype.run=function(f){f!=null&&this.bind(f);this.step();return this.reset()};c.prototype.yb=function(f,k){k==null&&(k=this.Pa,
this.Pa+=1);f=ea(f);this.mb.push(f);this.db.handleError(lc(this.Qa,k,f,-1,0))};c.prototype.Ib=function(f,k){k==null&&(k=this.Pa,this.Pa+=1);var n=da(f.length);m.set(f,n);this.mb.push(n);this.db.handleError(pb(this.Qa,k,n,f.length,0))};c.prototype.xb=function(f,k){k==null&&(k=this.Pa,this.Pa+=1);this.db.handleError((f===(f|0)?nc:mc)(this.Qa,k,f))};c.prototype.Lb=function(f){f==null&&(f=this.Pa,this.Pa+=1);pb(this.Qa,f,0,0,0)};c.prototype.zb=function(f,k){k==null&&(k=this.Pa,this.Pa+=1);switch(typeof f){case "string":this.yb(f,
k);return;case "number":this.xb(f,k);return;case "bigint":this.yb(f.toString(),k);return;case "boolean":this.xb(f+0,k);return;case "object":if(f===null){this.Lb(k);return}if(f.length!=null){this.Ib(f,k);return}}throw"Wrong API use : tried to bind a value of an unknown type ("+f+").";};c.prototype.Kb=function(f){var k=this;Object.keys(f).forEach(function(n){var q=oc(k.Qa,n);q!==0&&k.zb(f[n],q)});return!0};c.prototype.Jb=function(f){for(var k=0;k<f.length;k+=1)this.zb(f[k],k+1);return!0};c.prototype.reset=
function(){this.freemem();return zc(this.Qa)===0&&yc(this.Qa)===0};c.prototype.freemem=function(){for(var f;(f=this.mb.pop())!==void 0;)r(f)};c.prototype.Za=function(){this.freemem();var f=Ac(this.Qa)===0;delete this.db.hb[this.Qa];this.Qa=0;return f};d.prototype.next=function(){if(this.gb===null)return{done:!0};this.ab!==null&&(this.ab.Za(),this.ab=null);if(!this.db.db)throw this.ob(),Error("Database closed");var f=qa(),k=z(4);ra(g);ra(k);try{this.db.handleError(Qa(this.db.db,this.lb,-1,g,k));this.lb=
x(k,"i32");var n=x(g,"i32");if(n===0)return this.ob(),{done:!0};this.ab=new c(n,this.db);this.db.hb[n]=this.ab;return{value:this.ab,done:!1}}catch(q){throw this.sb=B(this.lb),this.ob(),q;}finally{sa(f)}};d.prototype.ob=function(){r(this.gb);this.gb=null};d.prototype.Ub=function(){return this.sb!==null?this.sb:B(this.lb)};typeof Symbol==="function"&&typeof Symbol.iterator==="symbol"&&(d.prototype[Symbol.iterator]=function(){return this});e.prototype.run=function(f,k){if(!this.db)throw"Database closed";
if(k){f=this.tb(f,k);try{f.step()}finally{f.Za()}}else{f=ea(f);try{this.handleError(t(this.db,f,0,0,g))}finally{r(f)}}return this};e.prototype.exec=function(f,k,n){if(!this.db)throw"Database closed";var q=qa(),u=null,v=null,J=null;try{J=v=ea(f);var I=z(4);for(f=[];x(J,"i8")!==0;){ra(g);ra(I);this.handleError(Qa(this.db,J,-1,g,I));var L=x(g,"i32");J=x(I,"i32");if(L!==0){var G=null;u=new c(L,this);for(k!=null&&u.bind(k);u.step();)G===null&&(G={columns:u.qb(),values:[]},f.push(G)),G.values.push(u.get(null,
n));u.Za()}}return f}catch(ma){throw u&&u.Za(),ma;}finally{v&&r(v),sa(q)}};e.prototype.Pb=function(f,k,n,q,u){typeof k==="function"&&(q=n,n=k,k=void 0);f=this.tb(f,k);try{for(;f.step();)n(f.Cb(null,u))}finally{f.Za()}if(typeof q==="function")return q()};e.prototype.tb=function(f,k){f=ea(f);try{ra(g),this.handleError(Qa(this.db,f,-1,g,0))}finally{r(f)}f=x(g,"i32");if(f===0)throw"Nothing to prepare";var n=new c(f,this);k!=null&&n.bind(k);return this.hb[f]=n};e.prototype.Yb=function(f){return new d(f,
this)};e.prototype.Rb=function(){Object.values(this.hb).forEach(function(k){k.Za()});Object.values(this.Sa).forEach(C);this.Sa={};this.handleError(w(this.db));var f=ta(this.filename);this.handleError(p(this.filename,g));this.db=x(g,"i32");nb(this.db);return f};e.prototype.close=function(){this.db!==null&&(Object.values(this.hb).forEach(function(f){f.Za()}),Object.values(this.Sa).forEach(C),this.Sa={},this.$a&&(C(this.$a),this.$a=void 0),this.handleError(w(this.db)),ua("/"+this.filename),this.db=null)};
e.prototype.handleError=function(f){if(f===0)return null;f=qc(this.db);throw Error(f);};e.prototype.Vb=function(){return y(this.db)};e.prototype.Ob=function(f,k){Object.prototype.hasOwnProperty.call(this.Sa,f)&&(C(this.Sa[f]),delete this.Sa[f]);var n=wa(function(q,u,v){u=b(u,v);try{var J=k.apply(null,u)}catch(I){va(q,I,-1);return}a(q,J)},"viii");this.Sa[f]=n;this.handleError(rb(this.db,f,k.length,1,0,n,0,0,0));return this};e.prototype.Nb=function(f,k){var n=k.init||function(){return null},q=k.finalize||
function(L){return L},u=k.step;if(!u)throw"An aggregate function must have a step function in "+f;var v={};Object.hasOwnProperty.call(this.Sa,f)&&(C(this.Sa[f]),delete this.Sa[f]);k=f+"__finalize";Object.hasOwnProperty.call(this.Sa,k)&&(C(this.Sa[k]),delete this.Sa[k]);var J=wa(function(L,G,ma){var X=sb(L,1);Object.hasOwnProperty.call(v,X)||(v[X]=n());G=b(G,ma);G=[v[X]].concat(G);try{v[X]=u.apply(null,G)}catch(Cc){delete v[X],va(L,Cc,-1)}},"viii"),I=wa(function(L){var G=sb(L,1);try{var ma=q(v[G])}catch(X){delete v[G];
va(L,X,-1);return}a(L,ma);delete v[G]},"vi");this.Sa[f]=J;this.Sa[k]=I;this.handleError(rb(this.db,f,u.length-1,1,0,0,J,I,0));return this};e.prototype.dc=function(f){this.$a&&(tb(this.db,0,0),C(this.$a),this.$a=void 0);if(!f)return this;this.$a=wa(function(k,n,q,u,v){switch(n){case 18:k="insert";break;case 23:k="update";break;case 9:k="delete";break;default:throw"unknown operationCode in updateHook callback: "+n;}q=B(q);u=B(u);if(v>Number.MAX_SAFE_INTEGER)throw"rowId too big to fit inside a Number";
f(k,q,u,Number(v))},"viiiij");tb(this.db,this.$a,0);return this};c.prototype.bind=c.prototype.bind;c.prototype.step=c.prototype.step;c.prototype.get=c.prototype.get;c.prototype.getColumnNames=c.prototype.qb;c.prototype.getAsObject=c.prototype.Cb;c.prototype.getSQL=c.prototype.Wb;c.prototype.getNormalizedSQL=c.prototype.Tb;c.prototype.run=c.prototype.run;c.prototype.reset=c.prototype.reset;c.prototype.freemem=c.prototype.freemem;c.prototype.free=c.prototype.Za;d.prototype.next=d.prototype.next;d.prototype.getRemainingSQL=
d.prototype.Ub;e.prototype.run=e.prototype.run;e.prototype.exec=e.prototype.exec;e.prototype.each=e.prototype.Pb;e.prototype.prepare=e.prototype.tb;e.prototype.iterateStatements=e.prototype.Yb;e.prototype["export"]=e.prototype.Rb;e.prototype.close=e.prototype.close;e.prototype.handleError=e.prototype.handleError;e.prototype.getRowsModified=e.prototype.Vb;e.prototype.create_function=e.prototype.Ob;e.prototype.create_aggregate=e.prototype.Nb;e.prototype.updateHook=e.prototype.dc;l.Database=e};
var xa="./this.program",ya=(a,b)=>{throw b;},za=globalThis.document?.currentScript?.src;typeof __filename!="undefined"?za=__filename:ba&&(za=self.location.href);var Aa="",Ba,Ca;
if(ca){var fs=require("node:fs");Aa=__dirname+"/";Ca=a=>{a=Da(a)?new URL(a):a;return fs.readFileSync(a)};Ba=async a=>{a=Da(a)?new URL(a):a;return fs.readFileSync(a,void 0)};process.argv.length>1&&(xa=process.argv[1].replace(/\\/g,"/"));process.argv.slice(2);typeof module!="undefined"&&(module.exports=l);ya=(a,b)=>{process.exitCode=a;throw b;}}else if(aa||ba){try{Aa=(new URL(".",za)).href}catch{}ba&&(Ca=a=>{var b=new XMLHttpRequest;b.open("GET",a,!1);b.responseType="arraybuffer";b.send(null);return new Uint8Array(b.response)});
Ba=async a=>{if(Da(a))return new Promise((c,d)=>{var e=new XMLHttpRequest;e.open("GET",a,!0);e.responseType="arraybuffer";e.onload=()=>{e.status==200||e.status==0&&e.response?c(e.response):d(e.status)};e.onerror=d;e.send(null)});var b=await fetch(a,{credentials:"same-origin"});if(b.ok)return b.arrayBuffer();throw Error(b.status+" : "+b.url);}}var Ea=console.log.bind(console),D=console.error.bind(console),Fa,Ga=!1,Ha,Da=a=>a.startsWith("file://");
function Ia(){if(!m?.buffer?.resizable){var a=Ja.buffer;m=new Int8Array(a);Ka=new Int16Array(a);E=new Uint8Array(a);F=new Int32Array(a);H=new Uint32Array(a);La=new Float32Array(a);Ma=new Float64Array(a);K=new BigInt64Array(a)}}function Na(){var a=l.preRun;a&&(typeof a=="function"&&(a=[a]),Oa.push(...a));for(a=Oa;a.length>0;)a.shift()(l)}function Pa(){var a=l.postRun;a&&(typeof a=="function"&&(a=[a]),Ra.push(...a));for(a=Ra;a.length>0;)a.shift()(l)}
function Sa(a){l.onAbort?.(a);a=`Aborted(${a})`;D(a);Ga=!0;throw new WebAssembly.RuntimeError(a+". Build with -sASSERTIONS for more info.");}var Ta;async function Ua(a){if(!Fa)try{var b=await Ba(a);return new Uint8Array(b)}catch{}if(a==Ta&&Fa)a=new Uint8Array(Fa);else if(Ca)a=Ca(a);else throw"both async and sync fetching of the wasm failed";return a}
async function Va(a,b){try{var c=await Ua(a);return await WebAssembly.instantiate(c,b)}catch(d){D(`failed to asynchronously prepare wasm: ${d}`),Sa(d)}}async function Wa(a){var b=Ta;if(!Fa&&!Da(b)&&!ca)try{var c=fetch(b,{credentials:"same-origin"});return await WebAssembly.instantiateStreaming(c,a)}catch(d){D(`wasm streaming compile failed: ${d}`),D("falling back to ArrayBuffer instantiation")}return Va(b,a)}
class Xa{name="ExitStatus";constructor(a){this.message=`Program terminated with exit(${a})`;this.status=a}}
var m,Ra=[],Oa=[],Ya=!0,Za=new TextDecoder,$a=(a,b,c,d)=>{c=b+c;if(d)return c;for(;a[b]&&!(b>=c);)++b;return b},E,B=(a,b,c)=>a?Za.decode(E.subarray(a,$a(E,a,b,c))):"",ab=(a,b)=>{for(var c=0,d=a.length-1;d>=0;d--){var e=a[d];e==="."?a.splice(d,1):e===".."?(a.splice(d,1),c++):c&&(a.splice(d,1),c--)}if(b)for(;c;c--)a.unshift("..");return a},ha=a=>{var b=a.charAt(0)==="/",c=a.slice(-1)==="/";(a=ab(a.split("/").filter(d=>!!d),!b).join("/"))||b||(a=".");a&&c&&(a+="/");return(b?"/":"")+a},bb=a=>{var b=/^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/.exec(a).slice(1);
a=b[0];b=b[1];if(!a&&!b)return".";b&&=b.slice(0,-1);return a+b},cb=a=>a&&a.match(/([^\/]+|\/)\/*$/)[1],db=()=>{if(ca){var a=require("node:crypto");return b=>(a.randomFillSync(b),0)}return b=>(crypto.getRandomValues(b),0)},eb=a=>(eb=db())(a),fb=(...a)=>{for(var b="",c=!1,d=a.length-1;d>=-1&&!c;d--){c=d>=0?a[d]:"/";if(typeof c!="string")throw new TypeError("Arguments to path.resolve must be strings");if(!c)return"";b=c+"/"+b;c=c.charAt(0)==="/"}b=ab(b.split("/").filter(e=>!!e),!c).join("/");return(c?
"/":"")+b||"."},gb=a=>{var b=$a(a,0);return Za.decode(a.buffer?a.subarray(0,b):new Uint8Array(a.slice(0,b)))},hb=[],ib=a=>{for(var b=0,c=0;c<a.length;++c){var d=a.charCodeAt(c);d<=127?b++:d<=2047?b+=2:d>=55296&&d<=57343?(b+=4,++c):b+=3}return b},M=(a,b,c,d)=>{if(!(d>0))return 0;var e=c;d=c+d-1;for(var g=0;g<a.length;++g){var h=a.codePointAt(g);if(h<=127){if(c>=d)break;b[c++]=h}else if(h<=2047){if(c+1>=d)break;b[c++]=192|h>>6;b[c++]=128|h&63}else if(h<=65535){if(c+2>=d)break;b[c++]=224|h>>12;b[c++]=
128|h>>6&63;b[c++]=128|h&63}else{if(c+3>=d)break;b[c++]=240|h>>18;b[c++]=128|h>>12&63;b[c++]=128|h>>6&63;b[c++]=128|h&63;g++}}b[c]=0;return c-e},ka=a=>{var b=Array(ib(a)+1);a=M(a,b,0,b.length);b.length=a;return b},jb=[];function lb(a,b){jb[a]={input:[],output:[],fb:b};mb(a,ub)}
var ub={open(a){var b=jb[a.node.rdev];if(!b)throw new N(43);a.tty=b;a.seekable=!1},close(a){a.tty.fb.fsync(a.tty)},fsync(a){a.tty.fb.fsync(a.tty)},read(a,b,c,d){if(!a.tty||!a.tty.fb.Eb)throw new N(60);for(var e=0,g=0;g<d;g++){try{var h=a.tty.fb.Eb(a.tty)}catch(p){throw new N(29);}if(h===void 0&&!e)throw new N(6);if(h===null||h===void 0)break;e++;b[c+g]=h;if(h===10)break}e&&(a.node.atime=Date.now());return e},write(a,b,c,d){if(!a.tty||!a.tty.fb.ub)throw new N(60);try{for(var e=0;e<d;e++)a.tty.fb.ub(a.tty,
b[c+e])}catch(g){throw new N(29);}d&&(a.node.mtime=a.node.ctime=Date.now());return e}},vb={Eb(){a:{if(!hb.length){var a=null;if(ca){var b=Buffer.alloc(256),c=0;try{c=fs.readSync(process.stdin.fd,b,0,256)}catch(d){if(d.toString().includes("EOF"))c=0;else throw d;}c>0&&(a=b.toString("utf-8",0,c))}else globalThis.window?.prompt&&(a=window.prompt("Input: "),a!==null&&(a+="\n"));if(!a){a=null;break a}hb=ka(a)}a=hb.shift()}return a},ub(a,b){b===null||b===10?(Ea(gb(a.output)),a.output=[]):b!=0&&a.output.push(b)},
fsync(a){a.output?.length>0&&(Ea(gb(a.output)),a.output=[])},mc(){return{hc:25856,kc:5,fc:191,jc:35387,ec:[3,28,127,21,4,0,1,0,17,19,26,0,18,15,23,22,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]}},nc(){return 0},oc(){return[24,80]}},wb={ub(a,b){b===null||b===10?(D(gb(a.output)),a.output=[]):b!=0&&a.output.push(b)},fsync(a){a.output?.length>0&&(D(gb(a.output)),a.output=[])}},O={Wa:null,Ya(){return O.createNode(null,"/",16895,0)},createNode(a,b,c,d){if((c&61440)===24576||(c&61440)===4096)throw new N(63);O.Wa||
(O.Wa={dir:{node:{Ua:O.Ma.Ua,Xa:O.Ma.Xa,lookup:O.Ma.lookup,ib:O.Ma.ib,rename:O.Ma.rename,unlink:O.Ma.unlink,rmdir:O.Ma.rmdir,readdir:O.Ma.readdir,symlink:O.Ma.symlink},stream:{Va:O.Na.Va}},file:{node:{Ua:O.Ma.Ua,Xa:O.Ma.Xa},stream:{Va:O.Na.Va,read:O.Na.read,write:O.Na.write,jb:O.Na.jb,kb:O.Na.kb}},link:{node:{Ua:O.Ma.Ua,Xa:O.Ma.Xa,readlink:O.Ma.readlink},stream:{}},Ab:{node:{Ua:O.Ma.Ua,Xa:O.Ma.Xa},stream:xb}});c=yb(a,b,c,d);P(c.mode)?(c.Ma=O.Wa.dir.node,c.Na=O.Wa.dir.stream,c.Ra={}):(c.mode&61440)===
32768?(c.Ma=O.Wa.file.node,c.Na=O.Wa.file.stream,c.Ta=0,c.Ra=O.Qb??(O.Qb=new Uint8Array(0))):(c.mode&61440)===40960?(c.Ma=O.Wa.link.node,c.Na=O.Wa.link.stream):(c.mode&61440)===8192&&(c.Ma=O.Wa.Ab.node,c.Na=O.Wa.Ab.stream);c.atime=c.mtime=c.ctime=Date.now();a&&(a.Ra[b]=c,a.atime=a.mtime=a.ctime=c.atime);return c},Ma:{Ua(a){var b={};b.dev=(a.mode&61440)===8192?a.id:1;b.ino=a.id;b.mode=a.mode;b.nlink=1;b.uid=0;b.gid=0;b.rdev=a.rdev;P(a.mode)?b.size=4096:(a.mode&61440)===32768?b.size=a.Ta:(a.mode&61440)===
40960?b.size=a.link.length:b.size=0;b.atime=new Date(a.atime);b.mtime=new Date(a.mtime);b.ctime=new Date(a.ctime);b.atimeMs=a.atime;b.mtimeMs=a.mtime;b.ctimeMs=a.ctime;b.blksize=4096;b.blocks=Math.ceil(b.size/b.blksize);return b},Xa(a,b){for(var c of["mode","atime","mtime","ctime"])b[c]!=null&&(a[c]=b[c]);b.size!==void 0&&(b=b.size,a.Ta!=b&&(c=a.Ra,a.Ra=new Uint8Array(b),a.Ra.set(c.subarray(0,Math.min(b,a.Ta))),a.Ta=b))},lookup(){O.nb||(O.nb=new N(44),O.nb.stack="<generic error, no stack>");throw O.nb;
},ib(a,b,c,d){return O.createNode(a,b,c,d)},rename(a,b,c){try{var d=Q(b,c)}catch(g){}if(d&&P(a.mode))for(var e in d.Ra)throw new N(55);delete a.parent.Ra[a.name];b.Ra[c]=a;a.name=c;b.ctime=b.mtime=a.parent.ctime=a.parent.mtime=Date.now()},unlink(a,b){delete a.Ra[b];a.ctime=a.mtime=Date.now()},rmdir(a,b){var c=Q(a,b),d;for(d in c.Ra)throw new N(55);delete a.Ra[b];a.ctime=a.mtime=Date.now()},readdir(a){return[".","..",...Object.keys(a.Ra)]},symlink(a,b,c){a=O.createNode(a,b,41471,0);a.link=c;return a},
readlink(a){if((a.mode&61440)!==40960)throw new N(28);return a.link}},Na:{read(a,b,c,d,e){if(e>=a.node.Ta)return 0;d=Math.min(a.node.Ta-e,d);b.set(a.node.Ra.subarray(e,e+d),c);return d},write(a,b,c,d,e,g){b.buffer===m.buffer&&(g=!1);if(!d)return 0;a=a.node;a.mtime=a.ctime=Date.now();if(g)a.Ra=b.subarray(c,c+d),a.Ta=d;else if(a.Ta||e){g=e+d;var h=a.Ra.length;h>=g||(g=Math.max(g,h*(h<1048576?2:1.125)>>>0),h&&(g=Math.max(g,256)),h=a.Ra.subarray(0,a.Ta),a.Ra=new Uint8Array(g),a.Ra.set(h));a.Ra.set(b.subarray(c,
c+d),e);a.Ta=Math.max(a.Ta,e+d)}else a.Ra=b.slice(c,c+d),a.Ta=d;return d},Va(a,b,c){c===1?b+=a.position:c===2&&(a.node.mode&61440)===32768&&(b+=a.node.Ta);if(b<0)throw new N(28);return b},jb(a,b,c,d,e){if((a.node.mode&61440)!==32768)throw new N(43);a=a.node.Ra;if(e&2||a.buffer!==m.buffer){e=!0;d=Math.ceil(b/65536)*65536;var g=zb(65536,d);g&&E.fill(0,g,g+d);d=g;if(!d)throw new N(48);if(a){if(c>0||c+b<a.length)a.subarray?a=a.subarray(c,c+b):a=Array.prototype.slice.call(a,c,c+b);m.set(a,d)}}else e=!1,
d=a.byteOffset;return{bc:d,Hb:e}},kb(a,b,c,d){O.Na.write(a,b,0,d,c,!1);return 0}}},ia=(a,b)=>{var c=0;a&&(c|=365);b&&(c|=146);return c},Ab=null,Bb={},Cb=[],Db=1,R=[],Eb=!1,Fb=!0,Gb={},N=class{name="ErrnoError";constructor(a){this.Oa=a}},Hb=class{shared={};node=null;get flags(){return this.shared.flags}set flags(a){this.shared.flags=a}get position(){return this.shared.position}set position(a){this.shared.position=a}},Ib=class{Ma={};Na={};cb=null;listeners=null;wb=0;constructor(a,b,c,d){a||=this;this.parent=
a;this.Ya=a.Ya;this.id=Db++;this.name=b;this.mode=c;this.rdev=d;this.atime=this.mtime=this.ctime=Date.now()}get read(){return(this.mode&365)===365}set read(a){a?this.mode|=365:this.mode&=-366}get write(){return(this.mode&146)===146}set write(a){a?this.mode|=146:this.mode&=-147}ac(){if(this.listeners){var a;for(b of this.listeners)b.exclusive?(a||=[]).push(b):b.Mb(32);if(a){var b=(this.wb||0)%a.length;this.wb=b+1;a[b].Mb(32)}}}};
function S(a,b={}){if(!a)throw new N(44);b.pb??(b.pb=!0);a.charAt(0)==="/"||(a="//"+a);var c=0;a:for(;c<40;c++){a=a.split("/").filter(p=>!!p);for(var d=Ab,e="/",g=0;g<a.length;g++){var h=g===a.length-1;if(h&&b.parent)break;if(a[g]!==".")if(a[g]==="..")if(e=bb(e),d===d.parent){a=e+"/"+a.slice(g+1).join("/");c--;continue a}else d=d.parent;else{e=ha(e+"/"+a[g]);try{d=Q(d,a[g])}catch(p){if(p?.Oa===44&&h&&b.$b)return{path:e};throw p;}!d.cb||h&&!b.pb||(d=d.cb.root);if((d.mode&61440)===40960&&(!h||b.bb)){if(!d.Ma.readlink)throw new N(52);
d=d.Ma.readlink(d);d.charAt(0)==="/"||(d=bb(e)+"/"+d);a=d+"/"+a.slice(g+1).join("/");continue a}}}return{path:e,node:d}}throw new N(32);}function fa(a){for(var b;;){if(a===a.parent)return a=a.Ya.Gb,b?a[a.length-1]!=="/"?`${a}/${b}`:a+b:a;b=b?`${a.name}/${b}`:a.name;a=a.parent}}function Jb(a,b){for(var c=0,d=0;d<b.length;d++)c=(c<<5)-c+b.charCodeAt(d)|0;return(a+c>>>0)%R.length}
function Kb(a){var b=Jb(a.parent.id,a.name);if(R[b]===a)R[b]=a.eb;else for(b=R[b];b;){if(b.eb===a){b.eb=a.eb;break}b=b.eb}}function Q(a,b){var c=P(a.mode)?(c=Lb(a,"x"))?c:a.Ma.lookup?0:2:54;if(c)throw new N(c);for(c=R[Jb(a.id,b)];c;c=c.eb){var d=c.name;if(c.parent.id===a.id&&d===b)return c}return a.Ma.lookup(a,b)}function yb(a,b,c,d){a=new Ib(a,b,c,d);b=Jb(a.parent.id,a.name);a.eb=R[b];return R[b]=a}function P(a){return(a&61440)===16384}
function Lb(a,b){return Fb?0:b.includes("r")&&!(a.mode&292)||b.includes("w")&&!(a.mode&146)||b.includes("x")&&!(a.mode&73)?2:0}function Mb(a,b){if(!P(a.mode))return 54;try{return Q(a,b),20}catch(c){}return Lb(a,"wx")}function Nb(a,b,c){try{var d=Q(a,b)}catch(e){return e.Oa}if(a=Lb(a,"wx"))return a;if(c){if(!P(d.mode))return 54;if(d===d.parent||fa(d)==="/")return 10}else if(P(d.mode))return 31;return 0}function Ob(a){if(!a)throw new N(63);return a}
function T(a){a=Cb[a];if(!a)throw new N(8);return a}function Pb(a,b=-1){a=Object.assign(new Hb,a);if(b==-1)a:{for(b=0;b<=4096;b++)if(!Cb[b])break a;throw new N(33);}a.fd=b;return Cb[b]=a}function Qb(a,b=-1){a=Pb(a,b);a.Na?.lc?.(a);return a}function Rb(a,b,c){var d=a?.Na.Xa;a=d?a:b;d??=b.Ma.Xa;Ob(d);try{d(a,c)}catch(e){if(e instanceof RangeError)throw new N(22);throw e;}}var xb={open(a){a.Na=Bb[a.node.rdev].Na;a.Na.open?.(a)},Va(){throw new N(70);}};function mb(a,b){Bb[a]={Na:b}}
function Sb(a,b){var c=b==="/";if(c&&Ab)throw new N(10);if(!c&&b){var d=S(b,{pb:!1});b=d.path;d=d.node;if(d.cb)throw new N(10);if(!P(d.mode))throw new N(54);}b={type:a,qc:{},Gb:b,Zb:[]};a=a.Ya(b);a.Ya=b;b.root=a;c?Ab=a:d&&(d.cb=b,d.Ya&&d.Ya.Zb.push(b))}function Tb(a,b,c){var d=S(a,{parent:!0}).node;a=cb(a);if(!a)throw new N(28);if(a==="."||a==="..")throw new N(20);var e=Mb(d,a);if(e)throw new N(e);if(!d.Ma.ib)throw new N(63);return d.Ma.ib(d,a,b,c)}
function ja(a,b=438){return Tb(a,b&4095|32768,0)}function U(a,b=511){return Tb(a,b&1023|16384,0)}function Ub(a,b,c){typeof c=="undefined"&&(c=b,b=438);Tb(a,b|8192,c)}function Vb(a,b){if(!fb(a))throw new N(44);var c=S(b,{parent:!0}).node;if(!c)throw new N(44);b=cb(b);var d=Mb(c,b);if(d)throw new N(d);if(!c.Ma.symlink)throw new N(63);c.Ma.symlink(c,b,a)}
function Wb(a){var b=S(a,{parent:!0}).node;a=cb(a);var c=Q(b,a),d=Nb(b,a,!0);if(d)throw new N(d);if(!b.Ma.rmdir)throw new N(63);if(c.cb)throw new N(10);b.Ma.rmdir(b,a);Kb(c)}function ua(a){var b=S(a,{parent:!0}).node;if(!b)throw new N(44);a=cb(a);var c=Q(b,a),d=Nb(b,a,!1);if(d)throw new N(d);if(!b.Ma.unlink)throw new N(63);if(c.cb)throw new N(10);b.Ma.unlink(b,a);Kb(c)}function Xb(a,b=!1){a=S(a,{bb:!b}).node;return Ob(a.Ma.Ua)(a)}
function Yb(a,b,c){Rb(a,b,{mode:c&4095|b.mode&-4096,ctime:Date.now(),Bb:!1})}function la(a,b){a=typeof a=="string"?S(a,{bb:!0}).node:a;Yb(null,a,b)}function Zb(a,b,c){if(P(b.mode))throw new N(31);if((b.mode&61440)!==32768)throw new N(28);var d=Lb(b,"w");if(d)throw new N(d);Rb(a,b,{size:c,timestamp:Date.now()})}function $b(a,b,c,d=!1){a=S(a,{bb:!d});Rb(null,a.node,{atime:b,mtime:c,Bb:d})}
function na(a,b,c=438){if(a==="")throw new N(44);if(typeof b=="string"){var d={r:0,"r+":2,w:577,"w+":578,a:1089,"a+":1090}[b];if(typeof d=="undefined")throw Error(`Unknown file open mode: ${b}`);b=d}c=b&64?c&4095|32768:0;if(typeof a=="object")d=a;else{var e=a.endsWith("/");a=S(a,{bb:!(b&131072),$b:!0});d=a.node;a=a.path}var g=!1;if(b&64)if(d){if(b&128)throw new N(20);}else{if(e)throw new N(31);d=Tb(a,c|511,0);g=!0}if(!d)throw new N(44);(d.mode&61440)===8192&&(b&=-513);if(b&65536&&!P(d.mode))throw new N(54);
if(!g&&(d?(d.mode&61440)===40960?e=32:(e=["r","w","rw"][b&3],b&512&&(e+="w"),e=P(d.mode)&&(e!=="r"||b&576)?31:Lb(d,e)):e=44,e))throw new N(e);b&512&&!g&&(e=d,e=typeof e=="string"?S(e,{bb:!0}).node:e,Zb(null,e,0));b&=-131713;e=Pb({node:d,path:fa(d),flags:b,seekable:!0,position:0,Na:d.Na,cc:[],error:!1});e.Na.open&&e.Na.open(e);g&&la(d,c&511);!l.logReadFiles||b&1||a in Gb||(Gb[a]=1,D(`read file: ${a}`));return e}
function pa(a){if(a.fd===null)throw new N(8);a.rb&&(a.rb=null);a.node?.ac();try{a.Na.close&&a.Na.close(a)}catch(b){throw b;}finally{Cb[a.fd]=null}a.fd=null}function kc(a,b,c){if(a.fd===null)throw new N(8);if(!a.seekable||!a.Na.Va)throw new N(70);if(c!=0&&c!=1&&c!=2)throw new N(28);a.position=a.Na.Va(a,b,c);a.cc=[]}
function Bc(a,b,c,d,e){if(d<0||e<0)throw new N(28);if(a.fd===null)throw new N(8);if((a.flags&2097155)===1)throw new N(8);if(P(a.node.mode))throw new N(31);if(!a.Na.read)throw new N(28);var g=typeof e!="undefined";if(!g)e=a.position;else if(!a.seekable)throw new N(70);b=a.Na.read(a,b,c,d,e);g||(a.position+=b);return b}
function oa(a,b,c,d,e){if(d<0||e<0)throw new N(28);if(a.fd===null)throw new N(8);if((a.flags&2097155)===0)throw new N(8);if(P(a.node.mode))throw new N(31);if(!a.Na.write)throw new N(28);a.seekable&&a.flags&1024&&kc(a,0,2);var g=typeof e!="undefined";if(!g)e=a.position;else if(!a.seekable)throw new N(70);b=a.Na.write(a,b,c,d,e,void 0);g||(a.position+=b);return b}
function ta(a){var b={encoding:"binary"};b.flags??(b.flags=0);b.encoding??(b.encoding="binary");b.encoding!=="utf8"&&b.encoding!=="binary"&&Sa(`Invalid encoding type "${b.encoding}"`);var c=na(a,b.flags);a=Xb(a).size;var d=new Uint8Array(a);Bc(c,d,0,a,0);b.encoding==="utf8"&&(d=gb(d));pa(c);return d}
function Dc(){var a,b,c;Eb=!0;a??=l.stdin;b??=l.stdout;c??=l.stderr;a?V("stdin",a):Vb("/dev/tty","/dev/stdin");b?V("stdout",null,b):Vb("/dev/tty","/dev/stdout");c?V("stderr",null,c):Vb("/dev/tty1","/dev/stderr");na("/dev/stdin",0);na("/dev/stdout",1);na("/dev/stderr",1)}
function V(a,b,c){a=ha("/dev/"+a);var d=ia(!!b,!!c);V.Fb??(V.Fb=64);var e=V.Fb++<<8|0;mb(e,{open(g){g.seekable=!1},close(){c?.buffer?.length&&c(10)},read(g,h,p,w){for(var t=0,y=0;y<w;y++){try{var A=b()}catch(ob){throw new N(29);}if(A===void 0&&!t)throw new N(6);if(A===null||A===void 0)break;t++;h[p+y]=A}t&&(g.node.atime=Date.now());return t},write(g,h,p,w){for(var t=0;t<w;t++)try{c(h[p+t])}catch(y){throw new N(29);}w&&(g.node.mtime=g.node.ctime=Date.now());return t}});Ub(a,d,e)}var W={},F,H,K;
function Y(a,b,c=!1){if(b.charAt(0)==="/")return b;a=a===-100?"/":T(a).path;if(b.length==0){if(!c)throw new N(44);return a}return a+"/"+b}
function Ec(a,b){H[a>>2]=b.dev;H[a+4>>2]=b.mode;H[a+8>>2]=b.nlink;H[a+12>>2]=b.uid;H[a+16>>2]=b.gid;H[a+20>>2]=b.rdev;K[a+24>>3]=BigInt(b.size);F[a+32>>2]=4096;F[a+36>>2]=b.blocks;var c=b.atimeMs??b.atime.getTime(),d=b.mtimeMs??b.mtime.getTime(),e=b.ctimeMs??b.ctime.getTime();K[a+40>>3]=BigInt(Math.floor(c/1E3));H[a+48>>2]=Math.floor(c%1E3*1E6);K[a+56>>3]=BigInt(Math.floor(d/1E3));H[a+64>>2]=Math.floor(d%1E3*1E6);K[a+72>>3]=BigInt(Math.floor(e/1E3));H[a+80>>2]=Math.floor(e%1E3*1E6);K[a+88>>3]=BigInt(b.ino);
return 0}
var Fc=void 0,Gc=()=>{var a=F[+Fc>>2];Fc+=4;return a},Ka,Hc=0,Ic=[0,31,60,91,121,152,182,213,244,274,305,335],Jc=[0,31,59,90,120,151,181,212,243,273,304,334],Kc={},Lc=a=>{Ha=a;Ya||Hc>0||(l.onExit?.(a),Ga=!0);ya(a,new Xa(a))},Mc={},Oc=()=>{if(!Nc){var a={USER:"web_user",LOGNAME:"web_user",PATH:"/",PWD:"/",HOME:"/home/web_user",LANG:(globalThis.navigator?.language??"C").replace("-","_")+".UTF-8",_:xa},b;for(b in Mc)Mc[b]===void 0?delete a[b]:a[b]=Mc[b];var c=[];for(b in a)c.push(`${b}=${a[b]}`);Nc=
c}return Nc},Nc,La,Ma;function x(a,b="i8"){b.endsWith("*")&&(b="*");switch(b){case "i1":return m[a];case "i8":return m[a];case "i16":return Ka[a>>1];case "i32":return F[a>>2];case "i64":return K[a>>3];case "float":return La[a>>2];case "double":return Ma[a>>3];case "*":return H[a>>2];default:Sa(`invalid type for getValue: ${b}`)}}
function ra(a){var b="i32";b.endsWith("*")&&(b="*");switch(b){case "i1":m[a]=0;break;case "i8":m[a]=0;break;case "i16":Ka[a>>1]=0;break;case "i32":F[a>>2]=0;break;case "i64":K[a>>3]=BigInt(0);break;case "float":La[a>>2]=0;break;case "double":Ma[a>>3]=0;break;case "*":H[a>>2]=0;break;default:Sa(`invalid type for setValue: ${b}`)}}
var Pc=(a,b,c,d)=>{var e={string:t=>{var y=0;if(t!==null&&t!==void 0&&t!==0){y=ib(t)+1;var A=z(y);M(t,E,A,y);y=A}return y},array:t=>{var y=z(t.length);m.set(t,y);return y}};a=l["_"+a];var g=[],h=0;if(d)for(var p=0;p<d.length;p++){var w=e[c[p]];w?(h||=qa(),g[p]=w(d[p])):g[p]=d[p]}c=a(...g);return c=function(t){h&&sa(h);return b==="string"?B(t):b==="boolean"?!!t:t}(c)},ea=a=>{var b=ib(a)+1,c=da(b);c&&M(a,E,c,b);return c},Qc,Rc=[],C=a=>{Qc.delete(Z.get(a));Z.set(a,null);Rc.push(a)},Sc=a=>{var b=a.length;
return[b%128|128,b>>7,...a]},Tc={i:127,p:127,j:126,f:125,d:124,e:111},Uc=a=>Sc(Array.from(a,b=>Tc[b])),wa=(a,b)=>{if(!Qc){Qc=new WeakMap;var c=Z.length;if(Qc)for(var d=0;d<0+c;d++){var e=Z.get(d);e&&Qc.set(e,d)}}if(c=Qc.get(a)||0)return c;c=Rc.length?Rc.pop():Z.grow(1);try{Z.set(c,a)}catch(g){if(!(g instanceof TypeError))throw g;b=Uint8Array.of(0,97,115,109,1,0,0,0,1,...Sc([1,96,...Uc(b.slice(1)),...Uc(b[0]==="v"?"":b[0])]),2,7,1,1,101,1,102,0,0,7,5,1,1,102,0,0);b=new WebAssembly.Module(b);b=(new WebAssembly.Instance(b,
{e:{f:a}})).exports.f;Z.set(c,b)}Qc.set(a,c);return c};R.length=4096;Sb(O,"/");U("/tmp");U("/home");U("/home/web_user");(function(){U("/dev");mb(259,{read:()=>0,write:(d,e,g,h)=>h,Va:()=>0});Ub("/dev/null",259);lb(1280,vb);lb(1536,wb);Ub("/dev/tty",1280);Ub("/dev/tty1",1536);var a=new Uint8Array(1024),b=0,c=()=>{b||(eb(a),b=a.byteLength);return a[--b]};V("random",c);V("urandom",c);U("/dev/shm");U("/dev/shm/tmp")})();
(function(){U("/proc");var a=U("/proc/self");U("/proc/self/fd");Sb({Ya(){var b=yb(a,"fd",16895,73);b.Na={Va:O.Na.Va};b.Ma={lookup(c,d){c=+d;var e=T(c);c={parent:null,Ya:{Gb:"fake"},Ma:{readlink:()=>e.path},id:c+1};return c.parent=c},readdir(){return Array.from(Cb.entries()).filter(([,c])=>c).map(([c])=>c.toString())}};return b}},"/proc/self/fd")})();l.noExitRuntime&&(Ya=l.noExitRuntime);l.print&&(Ea=l.print);l.printErr&&(D=l.printErr);l.wasmBinary&&(Fa=l.wasmBinary);l.thisProgram&&(xa=l.thisProgram);
var Vc=l.preInit;if(Vc)for(typeof Vc=="function"&&(l.preInit=Vc=[Vc]);Vc.length>0;)Vc.shift()();l.stackSave=()=>qa();l.stackRestore=a=>sa(a);l.stackAlloc=a=>z(a);l.cwrap=(a,b,c,d)=>{var e=!c||c.every(g=>g==="number"||g==="boolean");return b!=="string"&&e&&!d?l["_"+a]:(...g)=>Pc(a,b,c,g)};l.addFunction=wa;l.removeFunction=C;l.UTF8ToString=B;l.stringToNewUTF8=ea;l.writeArrayToMemory=(a,b)=>{m.set(a,b)};
var da,r,zb,Wc,sa,z,qa,Ja,Z,Xc={a:(a,b,c,d)=>Sa(`Assertion failed: ${B(a)}, at: `+[b?B(b):"unknown filename",c,d?B(d):"unknown function"]),i:function(a,b){try{return a=B(a),la(a,b),0}catch(c){if(typeof W=="undefined"||c.name!=="ErrnoError")throw c;return-c.Oa}},M:function(a,b,c){try{b=B(b);b=Y(a,b);if(c&-8)return-28;var d=S(b,{bb:!0}).node;if(!d)return-44;a="";c&4&&(a+="r");c&2&&(a+="w");c&1&&(a+="x");return a&&Lb(d,a)?-2:0}catch(e){if(typeof W=="undefined"||e.name!=="ErrnoError")throw e;return-e.Oa}},
j:function(a,b){try{var c=T(a);Yb(c,c.node,b);return 0}catch(d){if(typeof W=="undefined"||d.name!=="ErrnoError")throw d;return-d.Oa}},h:function(a){try{var b=T(a);Rb(b,b.node,{timestamp:Date.now(),Bb:!1});return 0}catch(c){if(typeof W=="undefined"||c.name!=="ErrnoError")throw c;return-c.Oa}},b:function(a,b,c){Fc=c;try{var d=T(a);switch(b){case 0:var e=Gc();if(e<0)break;for(;Cb[e];)e++;return Qb(d,e).fd;case 1:case 2:return 0;case 3:return d.flags;case 4:return e=Gc(),d.flags=d.flags&-289793|e&289792,
0;case 12:return e=Gc(),Ka[e+0>>1]=2,0;case 13:case 14:return 0}return-28}catch(g){if(typeof W=="undefined"||g.name!=="ErrnoError")throw g;return-g.Oa}},g:function(a,b){try{var c=T(a),d=c.node,e=c.Na.Ua;a=e?c:d;e??=d.Ma.Ua;Ob(e);var g=e(a);return Ec(b,g)}catch(h){if(typeof W=="undefined"||h.name!=="ErrnoError")throw h;return-h.Oa}},I:function(a,b){b=b<-9007199254740992||b>9007199254740992?NaN:Number(b);try{if(isNaN(b))return-22;var c=T(a);if(b<0||(c.flags&2097155)===0)throw new N(28);Zb(c,c.node,
b);return 0}catch(d){if(typeof W=="undefined"||d.name!=="ErrnoError")throw d;return-d.Oa}},H:function(a,b){try{if(!b)return-28;var c=ib("/")+1;if(b<c)return-68;M("/",E,a,b);return c}catch(d){if(typeof W=="undefined"||d.name!=="ErrnoError")throw d;return-d.Oa}},E:()=>0,L:function(a,b){try{return a=B(a),Ec(b,Xb(a,!0))}catch(c){if(typeof W=="undefined"||c.name!=="ErrnoError")throw c;return-c.Oa}},C:function(a,b,c){try{return b=B(b),b=Y(a,b),U(b,c&-19),0}catch(d){if(typeof W=="undefined"||d.name!=="ErrnoError")throw d;
return-d.Oa}},K:function(a,b,c,d){try{b=B(b);var e=d&256;b=Y(a,b,d&4096);return Ec(c,e?Xb(b,!0):Xb(b))}catch(g){if(typeof W=="undefined"||g.name!=="ErrnoError")throw g;return-g.Oa}},x:function(a,b,c,d){Fc=d;try{b=B(b);b=Y(a,b);var e=d?Gc():0;c&64&&(e&=-19);return na(b,c,e).fd}catch(g){if(typeof W=="undefined"||g.name!=="ErrnoError")throw g;return-g.Oa}},s:function(a,b,c,d){try{b=B(b);b=Y(a,b);if(d<=0)return-28;var e=S(b).node;if(!e)throw new N(44);if(!e.Ma.readlink)throw new N(28);var g=e.Ma.readlink(e);
var h=Math.min(d,ib(g)),p=m[c+h];M(g,E,c,d+1);m[c+h]=p;return h}catch(w){if(typeof W=="undefined"||w.name!=="ErrnoError")throw w;return-w.Oa}},r:function(a){try{return a=B(a),Wb(a),0}catch(b){if(typeof W=="undefined"||b.name!=="ErrnoError")throw b;return-b.Oa}},f:function(a,b){try{return a=B(a),Ec(b,Xb(a))}catch(c){if(typeof W=="undefined"||c.name!=="ErrnoError")throw c;return-c.Oa}},o:function(a,b,c){try{b=B(b);b=Y(a,b);if(c)if(c===512)Wb(b);else return-28;else ua(b);return 0}catch(d){if(typeof W==
"undefined"||d.name!=="ErrnoError")throw d;return-d.Oa}},n:function(a,b,c,d){try{d&=256;b=B(b);b=Y(a,b,!0);var e=Date.now();if(c){function p(w){var t=F[w+8>>2];return t==1073741823?e:t==1073741822?null:(H[w>>2]+F[w+4>>2]*4294967296+(t/1E4|0)*1E4/1E9)*1E3}var g=p(c);var h=p(c+16)}else h=g=e;(h??g)!==null&&$b(b,g,h,d);return 0}catch(p){if(typeof W=="undefined"||p.name!=="ErrnoError")throw p;return-p.Oa}},w:()=>Sa(""),v:()=>{Ya=!1;Hc=0},A:function(a,b){a=a<-9007199254740992||a>9007199254740992?NaN:Number(a);
a=new Date(a*1E3);if(isNaN(a.getTime()))return 1;F[b>>2]=a.getSeconds();F[b+4>>2]=a.getMinutes();F[b+8>>2]=a.getHours();F[b+12>>2]=a.getDate();F[b+16>>2]=a.getMonth();F[b+20>>2]=a.getFullYear()-1900;F[b+24>>2]=a.getDay();var c=a.getFullYear();F[b+28>>2]=(c%4!==0||c%100===0&&c%400!==0?Jc:Ic)[a.getMonth()]+a.getDate()-1|0;F[b+36>>2]=-(a.getTimezoneOffset()*60);c=(new Date(a.getFullYear(),6,1)).getTimezoneOffset();var d=(new Date(a.getFullYear(),0,1)).getTimezoneOffset();F[b+32>>2]=(c!=d&&a.getTimezoneOffset()==
Math.min(d,c))|0;return 0},y:function(a,b,c,d,e,g,h){e=e<-9007199254740992||e>9007199254740992?NaN:Number(e);try{var p=T(d);if(b&2&&!(c&2)&&(p.flags&2097155)!==2)throw new N(2);if((p.flags&2097155)===1)throw new N(2);if(!p.Na.jb)throw new N(43);if(!a)throw new N(28);var w=p.Na.jb(p,a,e,b,c);var t=w.bc;F[g>>2]=w.Hb;H[h>>2]=t;return 0}catch(y){if(typeof W=="undefined"||y.name!=="ErrnoError")throw y;return-y.Oa}},z:function(a,b,c,d,e,g){g=g<-9007199254740992||g>9007199254740992?NaN:Number(g);try{var h=
T(e);if(c&2){if((h.node.mode&61440)!==32768)throw new N(43);d&2||h.Na.kb&&h.Na.kb(h,E.subarray(a,a+b),g,b,d)}}catch(p){if(typeof W=="undefined"||p.name!=="ErrnoError")throw p;return-p.Oa}},k:(a,b)=>{Kc[a]&&(clearTimeout(Kc[a].id),delete Kc[a]);if(!b)return 0;var c=setTimeout(()=>{delete Kc[a];var d=[a,performance.now()],e=Wc;if(!Ga)try{e(...d)}catch(g){g instanceof Xa||g=="unwind"||ya(1,g)}finally{if(!(Ya||Hc>0))try{Ha=d=Ha,Lc(d)}catch(g){g instanceof Xa||g=="unwind"||ya(1,g)}}},b);Kc[a]={id:c,rc:b};
return 0},B:(a,b,c,d)=>{var e=(new Date).getFullYear(),g=(new Date(e,0,1)).getTimezoneOffset();e=(new Date(e,6,1)).getTimezoneOffset();H[a>>2]=Math.max(g,e)*60;F[b>>2]=Number(g!=e);b=h=>{var p=Math.abs(h);return`UTC${h>=0?"-":"+"}${String(Math.floor(p/60)).padStart(2,"0")}${String(p%60).padStart(2,"0")}`};a=b(g);b=b(e);e<g?(M(a,E,c,17),M(b,E,d,17)):(M(a,E,d,17),M(b,E,c,17))},d:()=>Date.now(),p:()=>2147483648,c:()=>performance.now(),l:a=>{var b=E.length;a>>>=0;if(a>2147483648)return!1;for(var c=1;c<=
4;c*=2){var d=b*(1+.2/c);d=Math.min(d,a+100663296);a:{d=(Math.min(2147483648,Math.ceil(Math.max(a,d)/65536)*65536)-Ja.buffer.byteLength+65535)/65536|0;try{Ja.grow(d);Ia();var e=1;break a}catch(g){}e=void 0}if(e)return!0}return!1},F:(a,b)=>{var c=0,d=0,e;for(e of Oc()){var g=b+c;H[a+d>>2]=g;c+=M(e,E,g,Infinity)+1;d+=4}return 0},G:(a,b)=>{var c=Oc();H[a>>2]=c.length;a=0;for(var d of c)a+=ib(d)+1;H[b>>2]=a;return 0},e:function(a){try{var b=T(a);pa(b);return 0}catch(c){if(typeof W=="undefined"||c.name!==
"ErrnoError")throw c;return c.Oa}},m:function(a,b){try{var c=T(a);m[b]=c.tty?2:P(c.mode)?3:(c.mode&61440)===40960?7:4;Ka[b+2>>1]=0;K[b+8>>3]=BigInt(0);K[b+16>>3]=BigInt(0);return 0}catch(d){if(typeof W=="undefined"||d.name!=="ErrnoError")throw d;return d.Oa}},t:function(a,b,c,d){try{a:{var e=T(a);a=b;for(var g,h=b=0;h<c;h++){var p=H[a>>2],w=H[a+4>>2];a+=8;try{var t=Bc(e,m,p,w,g)}catch(A){if(b>0&&A instanceof N&&(A.Oa==6||A.Oa==6))break;throw A;}if(t<0){var y=-1;break a}b+=t;if(t<w)break;typeof g!=
"undefined"&&(g+=t)}y=b}H[d>>2]=y;return 0}catch(A){if(typeof W=="undefined"||A.name!=="ErrnoError")throw A;return A.Oa}},D:function(a,b,c,d){b=b<-9007199254740992||b>9007199254740992?NaN:Number(b);try{if(isNaN(b))return 22;var e=T(a);kc(e,b,c);K[d>>3]=BigInt(e.position);e.rb&&!b&&c===0&&(e.rb=null);return 0}catch(g){if(typeof W=="undefined"||g.name!=="ErrnoError")throw g;return g.Oa}},J:function(a){try{var b=T(a);return b.Na?.fsync?.(b)}catch(c){if(typeof W=="undefined"||c.name!=="ErrnoError")throw c;
return c.Oa}},q:function(a,b,c,d){try{var e=T(a);a=b;if(c==1)var g=oa(e,m,H[a>>2],H[a+4>>2]);else{for(var h=b=0,p=a;h<c;h++,p+=8)b+=H[p+4>>2];var w=new Uint8Array(b);for(h=p=0;h<c;h++,a+=8){var t=H[a>>2],y=H[a+4>>2];w.set(E.subarray(t,t+y),p);p+=y}g=oa(e,w,0,b)}H[d>>2]=g;return 0}catch(A){if(typeof W=="undefined"||A.name!=="ErrnoError")throw A;return A.Oa}},u:Lc};
async function Yc(){Na();var a=l.setStatus;a&&(a("Running..."),await new Promise(b=>setTimeout(b,1)),setTimeout(a,1,""));Ga||(l.noFSInit||Eb||Dc(),Zc.O(),Fb=!1,l.onRuntimeInitialized?.(),Pa())}var Zc;
(async function(){function a(d){d=Zc=d.exports;l._sqlite3_free=d.Q;l._sqlite3_value_text=d.R;l._sqlite3_prepare_v2=d.S;l._sqlite3_step=d.T;l._sqlite3_reset=d.U;l._sqlite3_exec=d.V;l._sqlite3_finalize=d.W;l._sqlite3_column_name=d.X;l._sqlite3_column_text=d.Y;l._sqlite3_column_type=d.Z;l._sqlite3_errmsg=d._;l._sqlite3_clear_bindings=d.$;l._sqlite3_value_blob=d.aa;l._sqlite3_value_bytes=d.ba;l._sqlite3_value_double=d.ca;l._sqlite3_value_int=d.da;l._sqlite3_value_type=d.ea;l._sqlite3_result_blob=d.fa;
l._sqlite3_result_double=d.ga;l._sqlite3_result_error=d.ha;l._sqlite3_result_int=d.ia;l._sqlite3_result_int64=d.ja;l._sqlite3_result_null=d.ka;l._sqlite3_result_text=d.la;l._sqlite3_aggregate_context=d.ma;l._sqlite3_column_count=d.na;l._sqlite3_data_count=d.oa;l._sqlite3_column_blob=d.pa;l._sqlite3_column_bytes=d.qa;l._sqlite3_column_double=d.ra;l._sqlite3_bind_blob=d.sa;l._sqlite3_bind_double=d.ta;l._sqlite3_bind_int=d.ua;l._sqlite3_bind_text=d.va;l._sqlite3_bind_parameter_index=d.wa;l._sqlite3_sql=
d.xa;l._sqlite3_normalized_sql=d.ya;l._sqlite3_changes=d.za;l._sqlite3_close_v2=d.Aa;l._sqlite3_create_function_v2=d.Ba;l._sqlite3_update_hook=d.Ca;l._sqlite3_open=d.Da;da=l._malloc=d.Ea;r=l._free=d.Fa;l._RegisterExtensionFunctions=d.Ga;zb=d.Ha;Wc=d.Ia;sa=d.Ja;z=d.Ka;qa=d.La;Ja=d.N;Z=d.P;Ia();return Zc}var b={a:Xc},c=l.instantiateWasm;if(c)return new Promise(d=>{c(b,e=>d(a(e)))});Ta??=l.locateFile?l.locateFile("sql-wasm.wasm",Aa):Aa+"sql-wasm.wasm";return function(d){return a(d.instance)}(await Wa(b))})().then(()=>
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
