
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
var k;k||=typeof Module != 'undefined' ? Module : {};var aa=!!globalThis.window,ba=!!globalThis.WorkerGlobalScope,ca=globalThis.process?.versions?.node&&"renderer"!=globalThis.process?.type;
k.onRuntimeInitialized=function(){function a(f,l){switch(typeof l){case "boolean":dc(f,l?1:0);break;case "number":ec(f,l);break;case "string":fc(f,l,-1,-1);break;case "object":if(null===l)mb(f);else if(null!=l.length){var n=da(l.length);m.set(l,n);gc(f,n,l.length,-1);t(n)}else wa(f,"Wrong API use : tried to return a value of an unknown type ("+l+").",-1);break;default:mb(f)}}function b(f,l){for(var n=[],p=0;p<f;p+=1){var r=y(l+4*p,"i32"),w=hc(r);if(1===w||2===w)r=ic(r);else if(3===w)r=jc(r);else if(4===
w){w=r;r=kc(w);w=lc(w);for(var J=new Uint8Array(r),I=0;I<r;I+=1)J[I]=m[w+I];r=J}else r=null;n.push(r)}return n}function c(f,l){this.Qa=f;this.db=l;this.Oa=1;this.mb=[]}function d(f,l){this.db=l;this.fb=ea(f);if(null===this.fb)throw Error("Unable to allocate memory for the SQL string");this.lb=this.fb;this.$a=this.sb=null}function e(f){this.filename="dbfile_"+(4294967295*Math.random()>>>0);if(null!=f){var l=this.filename,n="/",p=l;n&&(n="string"==typeof n?n:fa(n),p=l?ha(n+"/"+l):n);l=ia(!0,!0);p=ja(p,
l);if(f){if("string"==typeof f){n=Array(f.length);for(var r=0,w=f.length;r<w;++r)n[r]=f.charCodeAt(r);f=n}ka(p,l|146);n=la(p,577);na(n,f,0,f.length,0);oa(n);ka(p,l)}}this.handleError(q(this.filename,g));this.db=y(g,"i32");pb(this.db);this.gb={};this.Sa={}}var g=z(4),h=k.cwrap,q=h("sqlite3_open","number",["string","number"]),v=h("sqlite3_close_v2","number",["number"]),u=h("sqlite3_exec","number",["number","number","number","number","number"]),x=h("sqlite3_changes","number",["number"]),D=h("sqlite3_sql",
"string",["number"]),qb=h("sqlite3_normalized_sql","string",["number"]),Qa=h("sqlite3_prepare_v2","number",["number","number","number","number","number"]),nc=h("sqlite3_bind_text","number",["number","number","number","number","number"]),rb=h("sqlite3_bind_blob","number",["number","number","number","number","number"]),oc=h("sqlite3_bind_double","number",["number","number","number"]),pc=h("sqlite3_bind_int","number",["number","number","number"]),qc=h("sqlite3_bind_parameter_index","number",["number",
"string"]),rc=h("sqlite3_step","number",["number"]),sc=h("sqlite3_errmsg","string",["number"]),tc=h("sqlite3_column_count","number",["number"]),uc=h("sqlite3_data_count","number",["number"]),vc=h("sqlite3_column_double","number",["number","number"]),sb=h("sqlite3_column_text","string",["number","number"]),wc=h("sqlite3_column_blob","number",["number","number"]),xc=h("sqlite3_column_bytes","number",["number","number"]),yc=h("sqlite3_column_type","number",["number","number"]),zc=h("sqlite3_column_name",
"string",["number","number"]),Ac=h("sqlite3_reset","number",["number"]),Bc=h("sqlite3_clear_bindings","number",["number"]),Cc=h("sqlite3_finalize","number",["number"]),tb=h("sqlite3_create_function_v2","number","number string number number number number number number number".split(" ")),hc=h("sqlite3_value_type","number",["number"]),kc=h("sqlite3_value_bytes","number",["number"]),jc=h("sqlite3_value_text","string",["number"]),lc=h("sqlite3_value_blob","number",["number"]),ic=h("sqlite3_value_double",
"number",["number"]),ec=h("sqlite3_result_double","",["number","number"]),mb=h("sqlite3_result_null","",["number"]),fc=h("sqlite3_result_text","",["number","string","number","number"]),gc=h("sqlite3_result_blob","",["number","number","number","number"]),dc=h("sqlite3_result_int","",["number","number"]),wa=h("sqlite3_result_error","",["number","string","number"]),ub=h("sqlite3_aggregate_context","number",["number","number"]),pb=h("RegisterExtensionFunctions","number",["number"]),vb=h("sqlite3_update_hook",
"number",["number","number","number"]);c.prototype.bind=function(f){if(!this.Qa)throw"Statement closed";this.reset();return Array.isArray(f)?this.Gb(f):null!=f&&"object"===typeof f?this.Hb(f):!0};c.prototype.step=function(){if(!this.Qa)throw"Statement closed";this.Oa=1;var f=rc(this.Qa);switch(f){case 100:return!0;case 101:return!1;default:throw this.db.handleError(f);}};c.prototype.Ab=function(f){null==f&&(f=this.Oa,this.Oa+=1);return vc(this.Qa,f)};c.prototype.Ob=function(f){null==f&&(f=this.Oa,
this.Oa+=1);f=sb(this.Qa,f);if("function"!==typeof BigInt)throw Error("BigInt is not supported");return BigInt(f)};c.prototype.Tb=function(f){null==f&&(f=this.Oa,this.Oa+=1);return sb(this.Qa,f)};c.prototype.getBlob=function(f){null==f&&(f=this.Oa,this.Oa+=1);var l=xc(this.Qa,f);f=wc(this.Qa,f);for(var n=new Uint8Array(l),p=0;p<l;p+=1)n[p]=m[f+p];return n};c.prototype.get=function(f,l){l=l||{};null!=f&&this.bind(f)&&this.step();f=[];for(var n=uc(this.Qa),p=0;p<n;p+=1)switch(yc(this.Qa,p)){case 1:var r=
l.useBigInt?this.Ob(p):this.Ab(p);f.push(r);break;case 2:f.push(this.Ab(p));break;case 3:f.push(this.Tb(p));break;case 4:f.push(this.getBlob(p));break;default:f.push(null)}return f};c.prototype.qb=function(){for(var f=[],l=tc(this.Qa),n=0;n<l;n+=1)f.push(zc(this.Qa,n));return f};c.prototype.zb=function(f,l){f=this.get(f,l);l=this.qb();for(var n={},p=0;p<l.length;p+=1)n[l[p]]=f[p];return n};c.prototype.Sb=function(){return D(this.Qa)};c.prototype.Pb=function(){return qb(this.Qa)};c.prototype.run=function(f){null!=
f&&this.bind(f);this.step();return this.reset()};c.prototype.wb=function(f,l){null==l&&(l=this.Oa,this.Oa+=1);f=ea(f);this.mb.push(f);this.db.handleError(nc(this.Qa,l,f,-1,0))};c.prototype.Fb=function(f,l){null==l&&(l=this.Oa,this.Oa+=1);var n=da(f.length);m.set(f,n);this.mb.push(n);this.db.handleError(rb(this.Qa,l,n,f.length,0))};c.prototype.vb=function(f,l){null==l&&(l=this.Oa,this.Oa+=1);this.db.handleError((f===(f|0)?pc:oc)(this.Qa,l,f))};c.prototype.Ib=function(f){null==f&&(f=this.Oa,this.Oa+=
1);rb(this.Qa,f,0,0,0)};c.prototype.xb=function(f,l){null==l&&(l=this.Oa,this.Oa+=1);switch(typeof f){case "string":this.wb(f,l);return;case "number":this.vb(f,l);return;case "bigint":this.wb(f.toString(),l);return;case "boolean":this.vb(f+0,l);return;case "object":if(null===f){this.Ib(l);return}if(null!=f.length){this.Fb(f,l);return}}throw"Wrong API use : tried to bind a value of an unknown type ("+f+").";};c.prototype.Hb=function(f){var l=this;Object.keys(f).forEach(function(n){var p=qc(l.Qa,n);
0!==p&&l.xb(f[n],p)});return!0};c.prototype.Gb=function(f){for(var l=0;l<f.length;l+=1)this.xb(f[l],l+1);return!0};c.prototype.reset=function(){this.freemem();return 0===Bc(this.Qa)&&0===Ac(this.Qa)};c.prototype.freemem=function(){for(var f;void 0!==(f=this.mb.pop());)t(f)};c.prototype.Ya=function(){this.freemem();var f=0===Cc(this.Qa);delete this.db.gb[this.Qa];this.Qa=0;return f};d.prototype.next=function(){if(null===this.fb)return{done:!0};null!==this.$a&&(this.$a.Ya(),this.$a=null);if(!this.db.db)throw this.ob(),
Error("Database closed");var f=pa(),l=z(4);qa(g);qa(l);try{this.db.handleError(Qa(this.db.db,this.lb,-1,g,l));this.lb=y(l,"i32");var n=y(g,"i32");if(0===n)return this.ob(),{done:!0};this.$a=new c(n,this.db);this.db.gb[n]=this.$a;return{value:this.$a,done:!1}}catch(p){throw this.sb=A(this.lb),this.ob(),p;}finally{ra(f)}};d.prototype.ob=function(){t(this.fb);this.fb=null};d.prototype.Qb=function(){return null!==this.sb?this.sb:A(this.lb)};"function"===typeof Symbol&&"symbol"===typeof Symbol.iterator&&
(d.prototype[Symbol.iterator]=function(){return this});e.prototype.run=function(f,l){if(!this.db)throw"Database closed";if(l){f=this.tb(f,l);try{f.step()}finally{f.Ya()}}else{f=ea(f);try{this.handleError(u(this.db,f,0,0,g))}finally{t(f)}}return this};e.prototype.exec=function(f,l,n){if(!this.db)throw"Database closed";var p=pa(),r=null,w=null,J=null;try{J=w=ea(f);var I=z(4);for(f=[];0!==y(J,"i8");){qa(g);qa(I);this.handleError(Qa(this.db,J,-1,g,I));var L=y(g,"i32");J=y(I,"i32");if(0!==L){var G=null;
r=new c(L,this);for(null!=l&&r.bind(l);r.step();)null===G&&(G={columns:r.qb(),values:[]},f.push(G)),G.values.push(r.get(null,n));r.Ya()}}return f}catch(ma){throw r&&r.Ya(),ma;}finally{w&&t(w),ra(p)}};e.prototype.Mb=function(f,l,n,p,r){"function"===typeof l&&(p=n,n=l,l=void 0);f=this.tb(f,l);try{for(;f.step();)n(f.zb(null,r))}finally{f.Ya()}if("function"===typeof p)return p()};e.prototype.tb=function(f,l){f=ea(f);try{qa(g),this.handleError(Qa(this.db,f,-1,g,0))}finally{t(f)}f=y(g,"i32");if(0===f)throw"Nothing to prepare";
var n=new c(f,this);null!=l&&n.bind(l);return this.gb[f]=n};e.prototype.Ub=function(f){return new d(f,this)};e.prototype.Nb=function(){Object.values(this.gb).forEach(function(l){l.Ya()});Object.values(this.Sa).forEach(B);this.Sa={};this.handleError(v(this.db));var f=sa(this.filename);this.handleError(q(this.filename,g));this.db=y(g,"i32");pb(this.db);return f};e.prototype.close=function(){null!==this.db&&(Object.values(this.gb).forEach(function(f){f.Ya()}),Object.values(this.Sa).forEach(B),this.Sa=
{},this.Za&&(B(this.Za),this.Za=void 0),this.handleError(v(this.db)),ta("/"+this.filename),this.db=null)};e.prototype.handleError=function(f){if(0===f)return null;f=sc(this.db);throw Error(f);};e.prototype.Rb=function(){return x(this.db)};e.prototype.Kb=function(f,l){Object.prototype.hasOwnProperty.call(this.Sa,f)&&(B(this.Sa[f]),delete this.Sa[f]);var n=ua(function(p,r,w){r=b(r,w);try{var J=l.apply(null,r)}catch(I){wa(p,I,-1);return}a(p,J)},"viii");this.Sa[f]=n;this.handleError(tb(this.db,f,l.length,
1,0,n,0,0,0));return this};e.prototype.Jb=function(f,l){var n=l.init||function(){return null},p=l.finalize||function(L){return L},r=l.step;if(!r)throw"An aggregate function must have a step function in "+f;var w={};Object.hasOwnProperty.call(this.Sa,f)&&(B(this.Sa[f]),delete this.Sa[f]);l=f+"__finalize";Object.hasOwnProperty.call(this.Sa,l)&&(B(this.Sa[l]),delete this.Sa[l]);var J=ua(function(L,G,ma){var W=ub(L,1);Object.hasOwnProperty.call(w,W)||(w[W]=n());G=b(G,ma);G=[w[W]].concat(G);try{w[W]=r.apply(null,
G)}catch(Ec){delete w[W],wa(L,Ec,-1)}},"viii"),I=ua(function(L){var G=ub(L,1);try{var ma=p(w[G])}catch(W){delete w[G];wa(L,W,-1);return}a(L,ma);delete w[G]},"vi");this.Sa[f]=J;this.Sa[l]=I;this.handleError(tb(this.db,f,r.length-1,1,0,0,J,I,0));return this};e.prototype.Zb=function(f){this.Za&&(vb(this.db,0,0),B(this.Za),this.Za=void 0);if(!f)return this;this.Za=ua(function(l,n,p,r,w){switch(n){case 18:l="insert";break;case 23:l="update";break;case 9:l="delete";break;default:throw"unknown operationCode in updateHook callback: "+
n;}p=A(p);r=A(r);if(w>Number.MAX_SAFE_INTEGER)throw"rowId too big to fit inside a Number";f(l,p,r,Number(w))},"viiiij");vb(this.db,this.Za,0);return this};c.prototype.bind=c.prototype.bind;c.prototype.step=c.prototype.step;c.prototype.get=c.prototype.get;c.prototype.getColumnNames=c.prototype.qb;c.prototype.getAsObject=c.prototype.zb;c.prototype.getSQL=c.prototype.Sb;c.prototype.getNormalizedSQL=c.prototype.Pb;c.prototype.run=c.prototype.run;c.prototype.reset=c.prototype.reset;c.prototype.freemem=
c.prototype.freemem;c.prototype.free=c.prototype.Ya;d.prototype.next=d.prototype.next;d.prototype.getRemainingSQL=d.prototype.Qb;e.prototype.run=e.prototype.run;e.prototype.exec=e.prototype.exec;e.prototype.each=e.prototype.Mb;e.prototype.prepare=e.prototype.tb;e.prototype.iterateStatements=e.prototype.Ub;e.prototype["export"]=e.prototype.Nb;e.prototype.close=e.prototype.close;e.prototype.handleError=e.prototype.handleError;e.prototype.getRowsModified=e.prototype.Rb;e.prototype.create_function=e.prototype.Kb;
e.prototype.create_aggregate=e.prototype.Jb;e.prototype.updateHook=e.prototype.Zb;k.Database=e};var va="./this.program",xa=(a,b)=>{throw b;},ya=globalThis.document?.currentScript?.src;"undefined"!=typeof __filename?ya=__filename:ba&&(ya=self.location.href);var za="",Aa,Ba;
if(ca){var fs=require("node:fs");za=__dirname+"/";Ba=a=>{a=Ca(a)?new URL(a):a;return fs.readFileSync(a)};Aa=async a=>{a=Ca(a)?new URL(a):a;return fs.readFileSync(a,void 0)};1<process.argv.length&&(va=process.argv[1].replace(/\\/g,"/"));process.argv.slice(2);"undefined"!=typeof module&&(module.exports=k);xa=(a,b)=>{process.exitCode=a;throw b;}}else if(aa||ba){try{za=(new URL(".",ya)).href}catch{}ba&&(Ba=a=>{var b=new XMLHttpRequest;b.open("GET",a,!1);b.responseType="arraybuffer";b.send(null);return new Uint8Array(b.response)});
Aa=async a=>{if(Ca(a))return new Promise((c,d)=>{var e=new XMLHttpRequest;e.open("GET",a,!0);e.responseType="arraybuffer";e.onload=()=>{200==e.status||0==e.status&&e.response?c(e.response):d(e.status)};e.onerror=d;e.send(null)});var b=await fetch(a,{credentials:"same-origin"});if(b.ok)return b.arrayBuffer();throw Error(b.status+" : "+b.url);}}var Da=console.log.bind(console),C=console.error.bind(console),Ea,Fa=!1,Ga,Ca=a=>a.startsWith("file://"),m,E,Ha,F,H,Ia,Ja,K;
function Ka(){var a=La.buffer;m=new Int8Array(a);Ha=new Int16Array(a);E=new Uint8Array(a);new Uint16Array(a);F=new Int32Array(a);H=new Uint32Array(a);Ia=new Float32Array(a);Ja=new Float64Array(a);K=new BigInt64Array(a);new BigUint64Array(a)}function Ma(a){k.onAbort?.(a);a="Aborted("+a+")";C(a);Fa=!0;throw new WebAssembly.RuntimeError(a+". Build with -sASSERTIONS for more info.");}var Na;
async function Oa(a){if(!Ea)try{var b=await Aa(a);return new Uint8Array(b)}catch{}if(a==Na&&Ea)a=new Uint8Array(Ea);else if(Ba)a=Ba(a);else throw"both async and sync fetching of the wasm failed";return a}async function Pa(a,b){try{var c=await Oa(a);return await WebAssembly.instantiate(c,b)}catch(d){C(`failed to asynchronously prepare wasm: ${d}`),Ma(d)}}
async function Ra(a){var b=Na;if(!Ea&&!Ca(b)&&!ca)try{var c=fetch(b,{credentials:"same-origin"});return await WebAssembly.instantiateStreaming(c,a)}catch(d){C(`wasm streaming compile failed: ${d}`),C("falling back to ArrayBuffer instantiation")}return Pa(b,a)}class Sa{name="ExitStatus";constructor(a){this.message=`Program terminated with exit(${a})`;this.status=a}}var Ta=a=>{for(;0<a.length;)a.shift()(k)},Ua=[],Va=[],Wa=()=>{var a=k.preRun.shift();Va.push(a)},M=0,Xa=null;
function y(a,b="i8"){b.endsWith("*")&&(b="*");switch(b){case "i1":return m[a];case "i8":return m[a];case "i16":return Ha[a>>1];case "i32":return F[a>>2];case "i64":return K[a>>3];case "float":return Ia[a>>2];case "double":return Ja[a>>3];case "*":return H[a>>2];default:Ma(`invalid type for getValue: ${b}`)}}var Ya=!0;
function qa(a){var b="i32";b.endsWith("*")&&(b="*");switch(b){case "i1":m[a]=0;break;case "i8":m[a]=0;break;case "i16":Ha[a>>1]=0;break;case "i32":F[a>>2]=0;break;case "i64":K[a>>3]=BigInt(0);break;case "float":Ia[a>>2]=0;break;case "double":Ja[a>>3]=0;break;case "*":H[a>>2]=0;break;default:Ma(`invalid type for setValue: ${b}`)}}
var Za=new TextDecoder,$a=(a,b,c,d)=>{c=b+c;if(d)return c;for(;a[b]&&!(b>=c);)++b;return b},A=(a,b,c)=>a?Za.decode(E.subarray(a,$a(E,a,b,c))):"",ab=(a,b)=>{for(var c=0,d=a.length-1;0<=d;d--){var e=a[d];"."===e?a.splice(d,1):".."===e?(a.splice(d,1),c++):c&&(a.splice(d,1),c--)}if(b)for(;c;c--)a.unshift("..");return a},ha=a=>{var b="/"===a.charAt(0),c="/"===a.slice(-1);(a=ab(a.split("/").filter(d=>!!d),!b).join("/"))||b||(a=".");a&&c&&(a+="/");return(b?"/":"")+a},bb=a=>{var b=/^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/.exec(a).slice(1);
a=b[0];b=b[1];if(!a&&!b)return".";b&&=b.slice(0,-1);return a+b},cb=a=>a&&a.match(/([^\/]+|\/)\/*$/)[1],db=()=>{if(ca){var a=require("node:crypto");return b=>a.randomFillSync(b)}return b=>crypto.getRandomValues(b)},eb=a=>{(eb=db())(a)},fb=(...a)=>{for(var b="",c=!1,d=a.length-1;-1<=d&&!c;d--){c=0<=d?a[d]:"/";if("string"!=typeof c)throw new TypeError("Arguments to path.resolve must be strings");if(!c)return"";b=c+"/"+b;c="/"===c.charAt(0)}b=ab(b.split("/").filter(e=>!!e),!c).join("/");return(c?"/":
"")+b||"."},gb=a=>{var b=$a(a,0);return Za.decode(a.buffer?a.subarray(0,b):new Uint8Array(a.slice(0,b)))},hb=[],ib=a=>{for(var b=0,c=0;c<a.length;++c){var d=a.charCodeAt(c);127>=d?b++:2047>=d?b+=2:55296<=d&&57343>=d?(b+=4,++c):b+=3}return b},N=(a,b,c,d)=>{if(!(0<d))return 0;var e=c;d=c+d-1;for(var g=0;g<a.length;++g){var h=a.codePointAt(g);if(127>=h){if(c>=d)break;b[c++]=h}else if(2047>=h){if(c+1>=d)break;b[c++]=192|h>>6;b[c++]=128|h&63}else if(65535>=h){if(c+2>=d)break;b[c++]=224|h>>12;b[c++]=128|
h>>6&63;b[c++]=128|h&63}else{if(c+3>=d)break;b[c++]=240|h>>18;b[c++]=128|h>>12&63;b[c++]=128|h>>6&63;b[c++]=128|h&63;g++}}b[c]=0;return c-e},jb=[];function kb(a,b){jb[a]={input:[],output:[],eb:b};lb(a,nb)}
var nb={open(a){var b=jb[a.node.rdev];if(!b)throw new O(43);a.tty=b;a.seekable=!1},close(a){a.tty.eb.fsync(a.tty)},fsync(a){a.tty.eb.fsync(a.tty)},read(a,b,c,d){if(!a.tty||!a.tty.eb.Bb)throw new O(60);for(var e=0,g=0;g<d;g++){try{var h=a.tty.eb.Bb(a.tty)}catch(q){throw new O(29);}if(void 0===h&&0===e)throw new O(6);if(null===h||void 0===h)break;e++;b[c+g]=h}e&&(a.node.atime=Date.now());return e},write(a,b,c,d){if(!a.tty||!a.tty.eb.ub)throw new O(60);try{for(var e=0;e<d;e++)a.tty.eb.ub(a.tty,b[c+e])}catch(g){throw new O(29);
}d&&(a.node.mtime=a.node.ctime=Date.now());return e}},ob={Bb(){a:{if(!hb.length){var a=null;if(ca){var b=Buffer.alloc(256),c=0,d=process.stdin.fd;try{c=fs.readSync(d,b,0,256)}catch(e){if(e.toString().includes("EOF"))c=0;else throw e;}0<c&&(a=b.slice(0,c).toString("utf-8"))}else globalThis.window?.prompt&&(a=window.prompt("Input: "),null!==a&&(a+="\n"));if(!a){a=null;break a}b=Array(ib(a)+1);a=N(a,b,0,b.length);b.length=a;hb=b}a=hb.shift()}return a},ub(a,b){null===b||10===b?(Da(gb(a.output)),a.output=
[]):0!=b&&a.output.push(b)},fsync(a){0<a.output?.length&&(Da(gb(a.output)),a.output=[])},hc(){return{bc:25856,dc:5,ac:191,cc:35387,$b:[3,28,127,21,4,0,1,0,17,19,26,0,18,15,23,22,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]}},ic(){return 0},jc(){return[24,80]}},wb={ub(a,b){null===b||10===b?(C(gb(a.output)),a.output=[]):0!=b&&a.output.push(b)},fsync(a){0<a.output?.length&&(C(gb(a.output)),a.output=[])}},P={Wa:null,Xa(){return P.createNode(null,"/",16895,0)},createNode(a,b,c,d){if(24576===(c&61440)||4096===(c&61440))throw new O(63);
P.Wa||(P.Wa={dir:{node:{Ta:P.La.Ta,Ua:P.La.Ua,lookup:P.La.lookup,ib:P.La.ib,rename:P.La.rename,unlink:P.La.unlink,rmdir:P.La.rmdir,readdir:P.La.readdir,symlink:P.La.symlink},stream:{Va:P.Ma.Va}},file:{node:{Ta:P.La.Ta,Ua:P.La.Ua},stream:{Va:P.Ma.Va,read:P.Ma.read,write:P.Ma.write,jb:P.Ma.jb,kb:P.Ma.kb}},link:{node:{Ta:P.La.Ta,Ua:P.La.Ua,readlink:P.La.readlink},stream:{}},yb:{node:{Ta:P.La.Ta,Ua:P.La.Ua},stream:xb}});c=yb(a,b,c,d);Q(c.mode)?(c.La=P.Wa.dir.node,c.Ma=P.Wa.dir.stream,c.Na={}):32768===
(c.mode&61440)?(c.La=P.Wa.file.node,c.Ma=P.Wa.file.stream,c.Ra=0,c.Na=null):40960===(c.mode&61440)?(c.La=P.Wa.link.node,c.Ma=P.Wa.link.stream):8192===(c.mode&61440)&&(c.La=P.Wa.yb.node,c.Ma=P.Wa.yb.stream);c.atime=c.mtime=c.ctime=Date.now();a&&(a.Na[b]=c,a.atime=a.mtime=a.ctime=c.atime);return c},fc(a){return a.Na?a.Na.subarray?a.Na.subarray(0,a.Ra):new Uint8Array(a.Na):new Uint8Array(0)},La:{Ta(a){var b={};b.dev=8192===(a.mode&61440)?a.id:1;b.ino=a.id;b.mode=a.mode;b.nlink=1;b.uid=0;b.gid=0;b.rdev=
a.rdev;Q(a.mode)?b.size=4096:32768===(a.mode&61440)?b.size=a.Ra:40960===(a.mode&61440)?b.size=a.link.length:b.size=0;b.atime=new Date(a.atime);b.mtime=new Date(a.mtime);b.ctime=new Date(a.ctime);b.blksize=4096;b.blocks=Math.ceil(b.size/b.blksize);return b},Ua(a,b){for(var c of["mode","atime","mtime","ctime"])null!=b[c]&&(a[c]=b[c]);void 0!==b.size&&(b=b.size,a.Ra!=b&&(0==b?(a.Na=null,a.Ra=0):(c=a.Na,a.Na=new Uint8Array(b),c&&a.Na.set(c.subarray(0,Math.min(b,a.Ra))),a.Ra=b)))},lookup(){P.nb||(P.nb=
new O(44),P.nb.stack="<generic error, no stack>");throw P.nb;},ib(a,b,c,d){return P.createNode(a,b,c,d)},rename(a,b,c){try{var d=R(b,c)}catch(g){}if(d){if(Q(a.mode))for(var e in d.Na)throw new O(55);zb(d)}delete a.parent.Na[a.name];b.Na[c]=a;a.name=c;b.ctime=b.mtime=a.parent.ctime=a.parent.mtime=Date.now()},unlink(a,b){delete a.Na[b];a.ctime=a.mtime=Date.now()},rmdir(a,b){var c=R(a,b),d;for(d in c.Na)throw new O(55);delete a.Na[b];a.ctime=a.mtime=Date.now()},readdir(a){return[".","..",...Object.keys(a.Na)]},
symlink(a,b,c){a=P.createNode(a,b,41471,0);a.link=c;return a},readlink(a){if(40960!==(a.mode&61440))throw new O(28);return a.link}},Ma:{read(a,b,c,d,e){var g=a.node.Na;if(e>=a.node.Ra)return 0;a=Math.min(a.node.Ra-e,d);if(8<a&&g.subarray)b.set(g.subarray(e,e+a),c);else for(d=0;d<a;d++)b[c+d]=g[e+d];return a},write(a,b,c,d,e,g){b.buffer===m.buffer&&(g=!1);if(!d)return 0;a=a.node;a.mtime=a.ctime=Date.now();if(b.subarray&&(!a.Na||a.Na.subarray)){if(g)return a.Na=b.subarray(c,c+d),a.Ra=d;if(0===a.Ra&&
0===e)return a.Na=b.slice(c,c+d),a.Ra=d;if(e+d<=a.Ra)return a.Na.set(b.subarray(c,c+d),e),d}g=e+d;var h=a.Na?a.Na.length:0;h>=g||(g=Math.max(g,h*(1048576>h?2:1.125)>>>0),0!=h&&(g=Math.max(g,256)),h=a.Na,a.Na=new Uint8Array(g),0<a.Ra&&a.Na.set(h.subarray(0,a.Ra),0));if(a.Na.subarray&&b.subarray)a.Na.set(b.subarray(c,c+d),e);else for(g=0;g<d;g++)a.Na[e+g]=b[c+g];a.Ra=Math.max(a.Ra,e+d);return d},Va(a,b,c){1===c?b+=a.position:2===c&&32768===(a.node.mode&61440)&&(b+=a.node.Ra);if(0>b)throw new O(28);
return b},jb(a,b,c,d,e){if(32768!==(a.node.mode&61440))throw new O(43);a=a.node.Na;if(e&2||!a||a.buffer!==m.buffer){e=!0;d=65536*Math.ceil(b/65536);var g=Ab(65536,d);g&&E.fill(0,g,g+d);d=g;if(!d)throw new O(48);if(a){if(0<c||c+b<a.length)a.subarray?a=a.subarray(c,c+b):a=Array.prototype.slice.call(a,c,c+b);m.set(a,d)}}else e=!1,d=a.byteOffset;return{Xb:d,Eb:e}},kb(a,b,c,d){P.Ma.write(a,b,0,d,c,!1);return 0}}},ia=(a,b)=>{var c=0;a&&(c|=365);b&&(c|=146);return c},Bb=null,Cb={},Db=[],Eb=1,S=null,Fb=!1,
Gb=!0,Hb={},O=class{name="ErrnoError";constructor(a){this.Pa=a}},Ib=class{hb={};node=null;get flags(){return this.hb.flags}set flags(a){this.hb.flags=a}get position(){return this.hb.position}set position(a){this.hb.position=a}},Jb=class{La={};Ma={};bb=null;constructor(a,b,c,d){a||=this;this.parent=a;this.Xa=a.Xa;this.id=Eb++;this.name=b;this.mode=c;this.rdev=d;this.atime=this.mtime=this.ctime=Date.now()}get read(){return 365===(this.mode&365)}set read(a){a?this.mode|=365:this.mode&=-366}get write(){return 146===
(this.mode&146)}set write(a){a?this.mode|=146:this.mode&=-147}};
function T(a,b={}){if(!a)throw new O(44);b.pb??(b.pb=!0);"/"===a.charAt(0)||(a="//"+a);var c=0;a:for(;40>c;c++){a=a.split("/").filter(q=>!!q);for(var d=Bb,e="/",g=0;g<a.length;g++){var h=g===a.length-1;if(h&&b.parent)break;if("."!==a[g])if(".."===a[g])if(e=bb(e),d===d.parent){a=e+"/"+a.slice(g+1).join("/");c--;continue a}else d=d.parent;else{e=ha(e+"/"+a[g]);try{d=R(d,a[g])}catch(q){if(44===q?.Pa&&h&&b.Wb)return{path:e};throw q;}!d.bb||h&&!b.pb||(d=d.bb.root);if(40960===(d.mode&61440)&&(!h||b.ab)){if(!d.La.readlink)throw new O(52);
d=d.La.readlink(d);"/"===d.charAt(0)||(d=bb(e)+"/"+d);a=d+"/"+a.slice(g+1).join("/");continue a}}}return{path:e,node:d}}throw new O(32);}function fa(a){for(var b;;){if(a===a.parent)return a=a.Xa.Db,b?"/"!==a[a.length-1]?`${a}/${b}`:a+b:a;b=b?`${a.name}/${b}`:a.name;a=a.parent}}function Kb(a,b){for(var c=0,d=0;d<b.length;d++)c=(c<<5)-c+b.charCodeAt(d)|0;return(a+c>>>0)%S.length}
function zb(a){var b=Kb(a.parent.id,a.name);if(S[b]===a)S[b]=a.cb;else for(b=S[b];b;){if(b.cb===a){b.cb=a.cb;break}b=b.cb}}function R(a,b){var c=Q(a.mode)?(c=Lb(a,"x"))?c:a.La.lookup?0:2:54;if(c)throw new O(c);for(c=S[Kb(a.id,b)];c;c=c.cb){var d=c.name;if(c.parent.id===a.id&&d===b)return c}return a.La.lookup(a,b)}function yb(a,b,c,d){a=new Jb(a,b,c,d);b=Kb(a.parent.id,a.name);a.cb=S[b];return S[b]=a}function Q(a){return 16384===(a&61440)}
function Mb(a){var b=["r","w","rw"][a&3];a&512&&(b+="w");return b}function Lb(a,b){if(Gb)return 0;if(!b.includes("r")||a.mode&292){if(b.includes("w")&&!(a.mode&146)||b.includes("x")&&!(a.mode&73))return 2}else return 2;return 0}function Nb(a,b){if(!Q(a.mode))return 54;try{return R(a,b),20}catch(c){}return Lb(a,"wx")}
function Ob(a,b,c){try{var d=R(a,b)}catch(e){return e.Pa}if(a=Lb(a,"wx"))return a;if(c){if(!Q(d.mode))return 54;if(d===d.parent||"/"===fa(d))return 10}else if(Q(d.mode))return 31;return 0}function Pb(a){if(!a)throw new O(63);return a}function U(a){a=Db[a];if(!a)throw new O(8);return a}function Qb(a,b=-1){a=Object.assign(new Ib,a);if(-1==b)a:{for(b=0;4096>=b;b++)if(!Db[b])break a;throw new O(33);}a.fd=b;return Db[b]=a}function Rb(a,b=-1){a=Qb(a,b);a.Ma?.ec?.(a);return a}
function Sb(a,b,c){var d=a?.Ma.Ua;a=d?a:b;d??=b.La.Ua;Pb(d);d(a,c)}var xb={open(a){a.Ma=Cb[a.node.rdev].Ma;a.Ma.open?.(a)},Va(){throw new O(70);}};function lb(a,b){Cb[a]={Ma:b}}function Tb(a,b){var c="/"===b;if(c&&Bb)throw new O(10);if(!c&&b){var d=T(b,{pb:!1});b=d.path;d=d.node;if(d.bb)throw new O(10);if(!Q(d.mode))throw new O(54);}b={type:a,kc:{},Db:b,Vb:[]};a=a.Xa(b);a.Xa=b;b.root=a;c?Bb=a:d&&(d.bb=b,d.Xa&&d.Xa.Vb.push(b))}
function Ub(a,b,c){var d=T(a,{parent:!0}).node;a=cb(a);if(!a)throw new O(28);if("."===a||".."===a)throw new O(20);var e=Nb(d,a);if(e)throw new O(e);if(!d.La.ib)throw new O(63);return d.La.ib(d,a,b,c)}function ja(a,b=438){return Ub(a,b&4095|32768,0)}function V(a,b=511){return Ub(a,b&1023|16384,0)}function Vb(a,b,c){"undefined"==typeof c&&(c=b,b=438);Ub(a,b|8192,c)}
function Wb(a,b){if(!fb(a))throw new O(44);var c=T(b,{parent:!0}).node;if(!c)throw new O(44);b=cb(b);var d=Nb(c,b);if(d)throw new O(d);if(!c.La.symlink)throw new O(63);c.La.symlink(c,b,a)}function Xb(a){var b=T(a,{parent:!0}).node;a=cb(a);var c=R(b,a),d=Ob(b,a,!0);if(d)throw new O(d);if(!b.La.rmdir)throw new O(63);if(c.bb)throw new O(10);b.La.rmdir(b,a);zb(c)}
function ta(a){var b=T(a,{parent:!0}).node;if(!b)throw new O(44);a=cb(a);var c=R(b,a),d=Ob(b,a,!1);if(d)throw new O(d);if(!b.La.unlink)throw new O(63);if(c.bb)throw new O(10);b.La.unlink(b,a);zb(c)}function Yb(a,b){a=T(a,{ab:!b}).node;return Pb(a.La.Ta)(a)}function Zb(a,b,c,d){Sb(a,b,{mode:c&4095|b.mode&-4096,ctime:Date.now(),Lb:d})}function ka(a,b){a="string"==typeof a?T(a,{ab:!0}).node:a;Zb(null,a,b)}
function $b(a,b,c){if(Q(b.mode))throw new O(31);if(32768!==(b.mode&61440))throw new O(28);var d=Lb(b,"w");if(d)throw new O(d);Sb(a,b,{size:c,timestamp:Date.now()})}
function la(a,b,c=438){if(""===a)throw new O(44);if("string"==typeof b){var d={r:0,"r+":2,w:577,"w+":578,a:1089,"a+":1090}[b];if("undefined"==typeof d)throw Error(`Unknown file open mode: ${b}`);b=d}c=b&64?c&4095|32768:0;if("object"==typeof a)d=a;else{var e=a.endsWith("/");a=T(a,{ab:!(b&131072),Wb:!0});d=a.node;a=a.path}var g=!1;if(b&64)if(d){if(b&128)throw new O(20);}else{if(e)throw new O(31);d=Ub(a,c|511,0);g=!0}if(!d)throw new O(44);8192===(d.mode&61440)&&(b&=-513);if(b&65536&&!Q(d.mode))throw new O(54);
if(!g&&(e=d?40960===(d.mode&61440)?32:Q(d.mode)&&("r"!==Mb(b)||b&576)?31:Lb(d,Mb(b)):44))throw new O(e);b&512&&!g&&(e=d,e="string"==typeof e?T(e,{ab:!0}).node:e,$b(null,e,0));b&=-131713;e=Qb({node:d,path:fa(d),flags:b,seekable:!0,position:0,Ma:d.Ma,Yb:[],error:!1});e.Ma.open&&e.Ma.open(e);g&&ka(d,c&511);!k.logReadFiles||b&1||a in Hb||(Hb[a]=1);return e}function oa(a){if(null===a.fd)throw new O(8);a.rb&&(a.rb=null);try{a.Ma.close&&a.Ma.close(a)}catch(b){throw b;}finally{Db[a.fd]=null}a.fd=null}
function ac(a,b,c){if(null===a.fd)throw new O(8);if(!a.seekable||!a.Ma.Va)throw new O(70);if(0!=c&&1!=c&&2!=c)throw new O(28);a.position=a.Ma.Va(a,b,c);a.Yb=[]}function bc(a,b,c,d,e){if(0>d||0>e)throw new O(28);if(null===a.fd)throw new O(8);if(1===(a.flags&2097155))throw new O(8);if(Q(a.node.mode))throw new O(31);if(!a.Ma.read)throw new O(28);var g="undefined"!=typeof e;if(!g)e=a.position;else if(!a.seekable)throw new O(70);b=a.Ma.read(a,b,c,d,e);g||(a.position+=b);return b}
function na(a,b,c,d,e){if(0>d||0>e)throw new O(28);if(null===a.fd)throw new O(8);if(0===(a.flags&2097155))throw new O(8);if(Q(a.node.mode))throw new O(31);if(!a.Ma.write)throw new O(28);a.seekable&&a.flags&1024&&ac(a,0,2);var g="undefined"!=typeof e;if(!g)e=a.position;else if(!a.seekable)throw new O(70);b=a.Ma.write(a,b,c,d,e,void 0);g||(a.position+=b);return b}
function sa(a){var b=b||0;var c="binary";"utf8"!==c&&"binary"!==c&&Ma(`Invalid encoding type "${c}"`);b=la(a,b);a=Yb(a).size;var d=new Uint8Array(a);bc(b,d,0,a,0);"utf8"===c&&(d=gb(d));oa(b);return d}
function X(a,b,c){a=ha("/dev/"+a);var d=ia(!!b,!!c);X.Cb??(X.Cb=64);var e=X.Cb++<<8|0;lb(e,{open(g){g.seekable=!1},close(){c?.buffer?.length&&c(10)},read(g,h,q,v){for(var u=0,x=0;x<v;x++){try{var D=b()}catch(qb){throw new O(29);}if(void 0===D&&0===u)throw new O(6);if(null===D||void 0===D)break;u++;h[q+x]=D}u&&(g.node.atime=Date.now());return u},write(g,h,q,v){for(var u=0;u<v;u++)try{c(h[q+u])}catch(x){throw new O(29);}v&&(g.node.mtime=g.node.ctime=Date.now());return u}});Vb(a,d,e)}var Y={};
function cc(a,b,c){if("/"===b.charAt(0))return b;a=-100===a?"/":U(a).path;if(0==b.length){if(!c)throw new O(44);return a}return a+"/"+b}
function mc(a,b){H[a>>2]=b.dev;H[a+4>>2]=b.mode;H[a+8>>2]=b.nlink;H[a+12>>2]=b.uid;H[a+16>>2]=b.gid;H[a+20>>2]=b.rdev;K[a+24>>3]=BigInt(b.size);F[a+32>>2]=4096;F[a+36>>2]=b.blocks;var c=b.atime.getTime(),d=b.mtime.getTime(),e=b.ctime.getTime();K[a+40>>3]=BigInt(Math.floor(c/1E3));H[a+48>>2]=c%1E3*1E6;K[a+56>>3]=BigInt(Math.floor(d/1E3));H[a+64>>2]=d%1E3*1E6;K[a+72>>3]=BigInt(Math.floor(e/1E3));H[a+80>>2]=e%1E3*1E6;K[a+88>>3]=BigInt(b.ino);return 0}
var Dc=void 0,Fc=()=>{var a=F[+Dc>>2];Dc+=4;return a},Gc=0,Hc=[0,31,60,91,121,152,182,213,244,274,305,335],Ic=[0,31,59,90,120,151,181,212,243,273,304,334],Jc={},Kc=a=>{Ga=a;Ya||0<Gc||(k.onExit?.(a),Fa=!0);xa(a,new Sa(a))},Lc=a=>{if(!Fa)try{a()}catch(b){b instanceof Sa||"unwind"==b||xa(1,b)}finally{if(!(Ya||0<Gc))try{Ga=a=Ga,Kc(a)}catch(b){b instanceof Sa||"unwind"==b||xa(1,b)}}},Mc={},Oc=()=>{if(!Nc){var a={USER:"web_user",LOGNAME:"web_user",PATH:"/",PWD:"/",HOME:"/home/web_user",LANG:(globalThis.navigator?.language??
"C").replace("-","_")+".UTF-8",_:va||"./this.program"},b;for(b in Mc)void 0===Mc[b]?delete a[b]:a[b]=Mc[b];var c=[];for(b in a)c.push(`${b}=${a[b]}`);Nc=c}return Nc},Nc,Pc=(a,b,c,d)=>{var e={string:u=>{var x=0;if(null!==u&&void 0!==u&&0!==u){x=ib(u)+1;var D=z(x);N(u,E,D,x);x=D}return x},array:u=>{var x=z(u.length);m.set(u,x);return x}};a=k["_"+a];var g=[],h=0;if(d)for(var q=0;q<d.length;q++){var v=e[c[q]];v?(0===h&&(h=pa()),g[q]=v(d[q])):g[q]=d[q]}c=a(...g);return c=function(u){0!==h&&ra(h);return"string"===
b?A(u):"boolean"===b?!!u:u}(c)},ea=a=>{var b=ib(a)+1,c=da(b);c&&N(a,E,c,b);return c},Qc,Rc=[],B=a=>{Qc.delete(Z.get(a));Z.set(a,null);Rc.push(a)},Sc=a=>{const b=a.length;return[b%128|128,b>>7,...a]},Tc={i:127,p:127,j:126,f:125,d:124,e:111},Uc=a=>Sc(Array.from(a,b=>Tc[b])),ua=(a,b)=>{if(!Qc){Qc=new WeakMap;var c=Z.length;if(Qc)for(var d=0;d<0+c;d++){var e=Z.get(d);e&&Qc.set(e,d)}}if(c=Qc.get(a)||0)return c;c=Rc.length?Rc.pop():Z.grow(1);try{Z.set(c,a)}catch(g){if(!(g instanceof TypeError))throw g;
b=Uint8Array.of(0,97,115,109,1,0,0,0,1,...Sc([1,96,...Uc(b.slice(1)),...Uc("v"===b[0]?"":b[0])]),2,7,1,1,101,1,102,0,0,7,5,1,1,102,0,0);b=new WebAssembly.Module(b);b=(new WebAssembly.Instance(b,{e:{f:a}})).exports.f;Z.set(c,b)}Qc.set(a,c);return c};S=Array(4096);Tb(P,"/");V("/tmp");V("/home");V("/home/web_user");
(function(){V("/dev");lb(259,{read:()=>0,write:(d,e,g,h)=>h,Va:()=>0});Vb("/dev/null",259);kb(1280,ob);kb(1536,wb);Vb("/dev/tty",1280);Vb("/dev/tty1",1536);var a=new Uint8Array(1024),b=0,c=()=>{0===b&&(eb(a),b=a.byteLength);return a[--b]};X("random",c);X("urandom",c);V("/dev/shm");V("/dev/shm/tmp")})();
(function(){V("/proc");var a=V("/proc/self");V("/proc/self/fd");Tb({Xa(){var b=yb(a,"fd",16895,73);b.Ma={Va:P.Ma.Va};b.La={lookup(c,d){c=+d;var e=U(c);c={parent:null,Xa:{Db:"fake"},La:{readlink:()=>e.path},id:c+1};return c.parent=c},readdir(){return Array.from(Db.entries()).filter(([,c])=>c).map(([c])=>c.toString())}};return b}},"/proc/self/fd")})();k.noExitRuntime&&(Ya=k.noExitRuntime);k.print&&(Da=k.print);k.printErr&&(C=k.printErr);k.wasmBinary&&(Ea=k.wasmBinary);k.thisProgram&&(va=k.thisProgram);
if(k.preInit)for("function"==typeof k.preInit&&(k.preInit=[k.preInit]);0<k.preInit.length;)k.preInit.shift()();k.stackSave=()=>pa();k.stackRestore=a=>ra(a);k.stackAlloc=a=>z(a);k.cwrap=(a,b,c,d)=>{var e=!c||c.every(g=>"number"===g||"boolean"===g);return"string"!==b&&e&&!d?k["_"+a]:(...g)=>Pc(a,b,c,g)};k.addFunction=ua;k.removeFunction=B;k.UTF8ToString=A;k.stringToNewUTF8=ea;k.writeArrayToMemory=(a,b)=>{m.set(a,b)};
var da,t,Ab,Vc,ra,z,pa,La,Z,Wc={a:(a,b,c,d)=>Ma(`Assertion failed: ${A(a)}, at: `+[b?A(b):"unknown filename",c,d?A(d):"unknown function"]),i:function(a,b){try{return a=A(a),ka(a,b),0}catch(c){if("undefined"==typeof Y||"ErrnoError"!==c.name)throw c;return-c.Pa}},L:function(a,b,c){try{b=A(b);b=cc(a,b);if(c&-8)return-28;var d=T(b,{ab:!0}).node;if(!d)return-44;a="";c&4&&(a+="r");c&2&&(a+="w");c&1&&(a+="x");return a&&Lb(d,a)?-2:0}catch(e){if("undefined"==typeof Y||"ErrnoError"!==e.name)throw e;return-e.Pa}},
j:function(a,b){try{var c=U(a);Zb(c,c.node,b,!1);return 0}catch(d){if("undefined"==typeof Y||"ErrnoError"!==d.name)throw d;return-d.Pa}},h:function(a){try{var b=U(a);Sb(b,b.node,{timestamp:Date.now(),Lb:!1});return 0}catch(c){if("undefined"==typeof Y||"ErrnoError"!==c.name)throw c;return-c.Pa}},b:function(a,b,c){Dc=c;try{var d=U(a);switch(b){case 0:var e=Fc();if(0>e)break;for(;Db[e];)e++;return Rb(d,e).fd;case 1:case 2:return 0;case 3:return d.flags;case 4:return e=Fc(),d.flags|=e,0;case 12:return e=
Fc(),Ha[e+0>>1]=2,0;case 13:case 14:return 0}return-28}catch(g){if("undefined"==typeof Y||"ErrnoError"!==g.name)throw g;return-g.Pa}},g:function(a,b){try{var c=U(a),d=c.node,e=c.Ma.Ta;a=e?c:d;e??=d.La.Ta;Pb(e);var g=e(a);return mc(b,g)}catch(h){if("undefined"==typeof Y||"ErrnoError"!==h.name)throw h;return-h.Pa}},H:function(a,b){b=-9007199254740992>b||9007199254740992<b?NaN:Number(b);try{if(isNaN(b))return-61;var c=U(a);if(0>b||0===(c.flags&2097155))throw new O(28);$b(c,c.node,b);return 0}catch(d){if("undefined"==
typeof Y||"ErrnoError"!==d.name)throw d;return-d.Pa}},G:function(a,b){try{if(0===b)return-28;var c=ib("/")+1;if(b<c)return-68;N("/",E,a,b);return c}catch(d){if("undefined"==typeof Y||"ErrnoError"!==d.name)throw d;return-d.Pa}},K:function(a,b){try{return a=A(a),mc(b,Yb(a,!0))}catch(c){if("undefined"==typeof Y||"ErrnoError"!==c.name)throw c;return-c.Pa}},C:function(a,b,c){try{return b=A(b),b=cc(a,b),V(b,c),0}catch(d){if("undefined"==typeof Y||"ErrnoError"!==d.name)throw d;return-d.Pa}},J:function(a,
b,c,d){try{b=A(b);var e=d&256;b=cc(a,b,d&4096);return mc(c,e?Yb(b,!0):Yb(b))}catch(g){if("undefined"==typeof Y||"ErrnoError"!==g.name)throw g;return-g.Pa}},x:function(a,b,c,d){Dc=d;try{b=A(b);b=cc(a,b);var e=d?Fc():0;return la(b,c,e).fd}catch(g){if("undefined"==typeof Y||"ErrnoError"!==g.name)throw g;return-g.Pa}},v:function(a,b,c,d){try{b=A(b);b=cc(a,b);if(0>=d)return-28;var e=T(b).node;if(!e)throw new O(44);if(!e.La.readlink)throw new O(28);var g=e.La.readlink(e);var h=Math.min(d,ib(g)),q=m[c+h];
N(g,E,c,d+1);m[c+h]=q;return h}catch(v){if("undefined"==typeof Y||"ErrnoError"!==v.name)throw v;return-v.Pa}},u:function(a){try{return a=A(a),Xb(a),0}catch(b){if("undefined"==typeof Y||"ErrnoError"!==b.name)throw b;return-b.Pa}},f:function(a,b){try{return a=A(a),mc(b,Yb(a))}catch(c){if("undefined"==typeof Y||"ErrnoError"!==c.name)throw c;return-c.Pa}},r:function(a,b,c){try{b=A(b);b=cc(a,b);if(c)if(512===c)Xb(b);else return-28;else ta(b);return 0}catch(d){if("undefined"==typeof Y||"ErrnoError"!==d.name)throw d;
return-d.Pa}},q:function(a,b,c){try{b=A(b);b=cc(a,b,!0);var d=Date.now(),e,g;if(c){var h=H[c>>2]+4294967296*F[c+4>>2],q=F[c+8>>2];1073741823==q?e=d:1073741822==q?e=null:e=1E3*h+q/1E6;c+=16;h=H[c>>2]+4294967296*F[c+4>>2];q=F[c+8>>2];1073741823==q?g=d:1073741822==q?g=null:g=1E3*h+q/1E6}else g=e=d;if(null!==(g??e)){a=e;var v=T(b,{ab:!0}).node;Pb(v.La.Ua)(v,{atime:a,mtime:g})}return 0}catch(u){if("undefined"==typeof Y||"ErrnoError"!==u.name)throw u;return-u.Pa}},m:()=>Ma(""),l:()=>{Ya=!1;Gc=0},A:function(a,
b){a=-9007199254740992>a||9007199254740992<a?NaN:Number(a);a=new Date(1E3*a);F[b>>2]=a.getSeconds();F[b+4>>2]=a.getMinutes();F[b+8>>2]=a.getHours();F[b+12>>2]=a.getDate();F[b+16>>2]=a.getMonth();F[b+20>>2]=a.getFullYear()-1900;F[b+24>>2]=a.getDay();var c=a.getFullYear();F[b+28>>2]=(0!==c%4||0===c%100&&0!==c%400?Ic:Hc)[a.getMonth()]+a.getDate()-1|0;F[b+36>>2]=-(60*a.getTimezoneOffset());c=(new Date(a.getFullYear(),6,1)).getTimezoneOffset();var d=(new Date(a.getFullYear(),0,1)).getTimezoneOffset();
F[b+32>>2]=(c!=d&&a.getTimezoneOffset()==Math.min(d,c))|0},y:function(a,b,c,d,e,g,h){e=-9007199254740992>e||9007199254740992<e?NaN:Number(e);try{var q=U(d);if(0!==(b&2)&&0===(c&2)&&2!==(q.flags&2097155))throw new O(2);if(1===(q.flags&2097155))throw new O(2);if(!q.Ma.jb)throw new O(43);if(!a)throw new O(28);var v=q.Ma.jb(q,a,e,b,c);var u=v.Xb;F[g>>2]=v.Eb;H[h>>2]=u;return 0}catch(x){if("undefined"==typeof Y||"ErrnoError"!==x.name)throw x;return-x.Pa}},z:function(a,b,c,d,e,g){g=-9007199254740992>g||
9007199254740992<g?NaN:Number(g);try{var h=U(e);if(c&2){c=g;if(32768!==(h.node.mode&61440))throw new O(43);if(!(d&2)){var q=E.slice(a,a+b);h.Ma.kb&&h.Ma.kb(h,q,c,b,d)}}}catch(v){if("undefined"==typeof Y||"ErrnoError"!==v.name)throw v;return-v.Pa}},n:(a,b)=>{Jc[a]&&(clearTimeout(Jc[a].id),delete Jc[a]);if(!b)return 0;var c=setTimeout(()=>{delete Jc[a];Lc(()=>Vc(a,performance.now()))},b);Jc[a]={id:c,lc:b};return 0},B:(a,b,c,d)=>{var e=(new Date).getFullYear(),g=(new Date(e,0,1)).getTimezoneOffset();
e=(new Date(e,6,1)).getTimezoneOffset();H[a>>2]=60*Math.max(g,e);F[b>>2]=Number(g!=e);b=h=>{var q=Math.abs(h);return`UTC${0<=h?"-":"+"}${String(Math.floor(q/60)).padStart(2,"0")}${String(q%60).padStart(2,"0")}`};a=b(g);b=b(e);e<g?(N(a,E,c,17),N(b,E,d,17)):(N(a,E,d,17),N(b,E,c,17))},d:()=>Date.now(),s:()=>2147483648,c:()=>performance.now(),o:a=>{var b=E.length;a>>>=0;if(2147483648<a)return!1;for(var c=1;4>=c;c*=2){var d=b*(1+.2/c);d=Math.min(d,a+100663296);a:{d=(Math.min(2147483648,65536*Math.ceil(Math.max(a,
d)/65536))-La.buffer.byteLength+65535)/65536|0;try{La.grow(d);Ka();var e=1;break a}catch(g){}e=void 0}if(e)return!0}return!1},E:(a,b)=>{var c=0,d=0,e;for(e of Oc()){var g=b+c;H[a+d>>2]=g;c+=N(e,E,g,Infinity)+1;d+=4}return 0},F:(a,b)=>{var c=Oc();H[a>>2]=c.length;a=0;for(var d of c)a+=ib(d)+1;H[b>>2]=a;return 0},e:function(a){try{var b=U(a);oa(b);return 0}catch(c){if("undefined"==typeof Y||"ErrnoError"!==c.name)throw c;return c.Pa}},p:function(a,b){try{var c=U(a);m[b]=c.tty?2:Q(c.mode)?3:40960===(c.mode&
61440)?7:4;Ha[b+2>>1]=0;K[b+8>>3]=BigInt(0);K[b+16>>3]=BigInt(0);return 0}catch(d){if("undefined"==typeof Y||"ErrnoError"!==d.name)throw d;return d.Pa}},w:function(a,b,c,d){try{a:{var e=U(a);a=b;for(var g,h=b=0;h<c;h++){var q=H[a>>2],v=H[a+4>>2];a+=8;var u=bc(e,m,q,v,g);if(0>u){var x=-1;break a}b+=u;if(u<v)break;"undefined"!=typeof g&&(g+=u)}x=b}H[d>>2]=x;return 0}catch(D){if("undefined"==typeof Y||"ErrnoError"!==D.name)throw D;return D.Pa}},D:function(a,b,c,d){b=-9007199254740992>b||9007199254740992<
b?NaN:Number(b);try{if(isNaN(b))return 61;var e=U(a);ac(e,b,c);K[d>>3]=BigInt(e.position);e.rb&&0===b&&0===c&&(e.rb=null);return 0}catch(g){if("undefined"==typeof Y||"ErrnoError"!==g.name)throw g;return g.Pa}},I:function(a){try{var b=U(a);return b.Ma?.fsync?.(b)}catch(c){if("undefined"==typeof Y||"ErrnoError"!==c.name)throw c;return c.Pa}},t:function(a,b,c,d){try{a:{var e=U(a);a=b;for(var g,h=b=0;h<c;h++){var q=H[a>>2],v=H[a+4>>2];a+=8;var u=na(e,m,q,v,g);if(0>u){var x=-1;break a}b+=u;if(u<v)break;
"undefined"!=typeof g&&(g+=u)}x=b}H[d>>2]=x;return 0}catch(D){if("undefined"==typeof Y||"ErrnoError"!==D.name)throw D;return D.Pa}},k:Kc};
function Xc(){function a(){k.calledRun=!0;if(!Fa){if(!k.noFSInit&&!Fb){var b,c;Fb=!0;b??=k.stdin;c??=k.stdout;d??=k.stderr;b?X("stdin",b):Wb("/dev/tty","/dev/stdin");c?X("stdout",null,c):Wb("/dev/tty","/dev/stdout");d?X("stderr",null,d):Wb("/dev/tty1","/dev/stderr");la("/dev/stdin",0);la("/dev/stdout",1);la("/dev/stderr",1)}Yc.N();Gb=!1;k.onRuntimeInitialized?.();if(k.postRun)for("function"==typeof k.postRun&&(k.postRun=[k.postRun]);k.postRun.length;){var d=k.postRun.shift();Ua.push(d)}Ta(Ua)}}if(0<
M)Xa=Xc;else{if(k.preRun)for("function"==typeof k.preRun&&(k.preRun=[k.preRun]);k.preRun.length;)Wa();Ta(Va);0<M?Xa=Xc:k.setStatus?(k.setStatus("Running..."),setTimeout(()=>{setTimeout(()=>k.setStatus(""),1);a()},1)):a()}}var Yc;
(async function(){function a(c){c=Yc=c.exports;k._sqlite3_free=c.P;k._sqlite3_value_text=c.Q;k._sqlite3_prepare_v2=c.R;k._sqlite3_step=c.S;k._sqlite3_reset=c.T;k._sqlite3_exec=c.U;k._sqlite3_finalize=c.V;k._sqlite3_column_name=c.W;k._sqlite3_column_text=c.X;k._sqlite3_column_type=c.Y;k._sqlite3_errmsg=c.Z;k._sqlite3_clear_bindings=c._;k._sqlite3_value_blob=c.$;k._sqlite3_value_bytes=c.aa;k._sqlite3_value_double=c.ba;k._sqlite3_value_int=c.ca;k._sqlite3_value_type=c.da;k._sqlite3_result_blob=c.ea;
k._sqlite3_result_double=c.fa;k._sqlite3_result_error=c.ga;k._sqlite3_result_int=c.ha;k._sqlite3_result_int64=c.ia;k._sqlite3_result_null=c.ja;k._sqlite3_result_text=c.ka;k._sqlite3_aggregate_context=c.la;k._sqlite3_column_count=c.ma;k._sqlite3_data_count=c.na;k._sqlite3_column_blob=c.oa;k._sqlite3_column_bytes=c.pa;k._sqlite3_column_double=c.qa;k._sqlite3_bind_blob=c.ra;k._sqlite3_bind_double=c.sa;k._sqlite3_bind_int=c.ta;k._sqlite3_bind_text=c.ua;k._sqlite3_bind_parameter_index=c.va;k._sqlite3_sql=
c.wa;k._sqlite3_normalized_sql=c.xa;k._sqlite3_changes=c.ya;k._sqlite3_close_v2=c.za;k._sqlite3_create_function_v2=c.Aa;k._sqlite3_update_hook=c.Ba;k._sqlite3_open=c.Ca;da=k._malloc=c.Da;t=k._free=c.Ea;k._RegisterExtensionFunctions=c.Fa;Ab=c.Ga;Vc=c.Ha;ra=c.Ia;z=c.Ja;pa=c.Ka;La=c.M;Z=c.O;Ka();M--;k.monitorRunDependencies?.(M);0==M&&Xa&&(c=Xa,Xa=null,c());return Yc}M++;k.monitorRunDependencies?.(M);var b={a:Wc};if(k.instantiateWasm)return new Promise(c=>{k.instantiateWasm(b,(d,e)=>{c(a(d,e))})});Na??=
k.locateFile?k.locateFile("sql-wasm.wasm",za):za+"sql-wasm.wasm";return a((await Ra(b)).instance)})();Xc();


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
