
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
var f;f||=typeof Module != 'undefined' ? Module : {};var aa="object"==typeof window,ba="undefined"!=typeof WorkerGlobalScope,ca="object"==typeof process&&"object"==typeof process.versions&&"string"==typeof process.versions.node&&"renderer"!=process.type;"use strict";
f.onRuntimeInitialized=function(){function a(g,l){switch(typeof l){case "boolean":cc(g,l?1:0);break;case "number":dc(g,l);break;case "string":ec(g,l,-1,-1);break;case "object":if(null===l)lb(g);else if(null!=l.length){var n=da(l,ea);fc(g,n,l.length,-1);fa(n)}else ua(g,"Wrong API use : tried to return a value of an unknown type ("+l+").",-1);break;default:lb(g)}}function b(g,l){for(var n=[],r=0;r<g;r+=1){var v=m(l+4*r,"i32"),z=gc(v);if(1===z||2===z)v=hc(v);else if(3===z)v=ic(v);else if(4===z){z=v;
v=jc(z);z=kc(z);for(var L=new Uint8Array(v),J=0;J<v;J+=1)L[J]=q[z+J];v=L}else v=null;n.push(v)}return n}function c(g,l){this.Pa=g;this.db=l;this.Na=1;this.jb=[]}function d(g,l){this.db=l;l=ha(g)+1;this.bb=ia(l);if(null===this.bb)throw Error("Unable to allocate memory for the SQL string");t(g,x,this.bb,l);this.ib=this.bb;this.Xa=this.nb=null}function e(g){this.filename="dbfile_"+(4294967295*Math.random()>>>0);if(null!=g){var l=this.filename,n="/",r=l;n&&(n="string"==typeof n?n:ja(n),r=l?ka(n+"/"+l):
n);l=la(!0,!0);r=ma(r,l);if(g){if("string"==typeof g){n=Array(g.length);for(var v=0,z=g.length;v<z;++v)n[v]=g.charCodeAt(v);g=n}na(r,l|146);n=oa(r,577);pa(n,g,0,g.length,0);qa(n);na(r,l)}}this.handleError(p(this.filename,h));this.db=m(h,"i32");ob(this.db);this.cb={};this.Ra={}}var h=y(4),k=f.cwrap,p=k("sqlite3_open","number",["string","number"]),w=k("sqlite3_close_v2","number",["number"]),u=k("sqlite3_exec","number",["number","string","number","number","number"]),B=k("sqlite3_changes","number",["number"]),
G=k("sqlite3_prepare_v2","number",["number","string","number","number","number"]),pb=k("sqlite3_sql","string",["number"]),mc=k("sqlite3_normalized_sql","string",["number"]),qb=k("sqlite3_prepare_v2","number",["number","number","number","number","number"]),nc=k("sqlite3_bind_text","number",["number","number","number","number","number"]),rb=k("sqlite3_bind_blob","number",["number","number","number","number","number"]),oc=k("sqlite3_bind_double","number",["number","number","number"]),pc=k("sqlite3_bind_int",
"number",["number","number","number"]),qc=k("sqlite3_bind_parameter_index","number",["number","string"]),rc=k("sqlite3_step","number",["number"]),sc=k("sqlite3_errmsg","string",["number"]),tc=k("sqlite3_column_count","number",["number"]),uc=k("sqlite3_data_count","number",["number"]),vc=k("sqlite3_column_double","number",["number","number"]),sb=k("sqlite3_column_text","string",["number","number"]),wc=k("sqlite3_column_blob","number",["number","number"]),xc=k("sqlite3_column_bytes","number",["number",
"number"]),yc=k("sqlite3_column_type","number",["number","number"]),zc=k("sqlite3_column_name","string",["number","number"]),Ac=k("sqlite3_reset","number",["number"]),Bc=k("sqlite3_clear_bindings","number",["number"]),Cc=k("sqlite3_finalize","number",["number"]),tb=k("sqlite3_create_function_v2","number","number string number number number number number number number".split(" ")),gc=k("sqlite3_value_type","number",["number"]),jc=k("sqlite3_value_bytes","number",["number"]),ic=k("sqlite3_value_text",
"string",["number"]),kc=k("sqlite3_value_blob","number",["number"]),hc=k("sqlite3_value_double","number",["number"]),dc=k("sqlite3_result_double","",["number","number"]),lb=k("sqlite3_result_null","",["number"]),ec=k("sqlite3_result_text","",["number","string","number","number"]),fc=k("sqlite3_result_blob","",["number","number","number","number"]),cc=k("sqlite3_result_int","",["number","number"]),ua=k("sqlite3_result_error","",["number","string","number"]),ub=k("sqlite3_aggregate_context","number",
["number","number"]),ob=k("RegisterExtensionFunctions","number",["number"]);c.prototype.bind=function(g){if(!this.Pa)throw"Statement closed";this.reset();return Array.isArray(g)?this.Ab(g):null!=g&&"object"===typeof g?this.Bb(g):!0};c.prototype.step=function(){if(!this.Pa)throw"Statement closed";this.Na=1;var g=rc(this.Pa);switch(g){case 100:return!0;case 101:return!1;default:throw this.db.handleError(g);}};c.prototype.ub=function(g){null==g&&(g=this.Na,this.Na+=1);return vc(this.Pa,g)};c.prototype.Eb=
function(g){null==g&&(g=this.Na,this.Na+=1);g=sb(this.Pa,g);if("function"!==typeof BigInt)throw Error("BigInt is not supported");return BigInt(g)};c.prototype.Fb=function(g){null==g&&(g=this.Na,this.Na+=1);return sb(this.Pa,g)};c.prototype.getBlob=function(g){null==g&&(g=this.Na,this.Na+=1);var l=xc(this.Pa,g);g=wc(this.Pa,g);for(var n=new Uint8Array(l),r=0;r<l;r+=1)n[r]=q[g+r];return n};c.prototype.get=function(g,l){l=l||{};null!=g&&this.bind(g)&&this.step();g=[];for(var n=uc(this.Pa),r=0;r<n;r+=
1)switch(yc(this.Pa,r)){case 1:var v=l.useBigInt?this.Eb(r):this.ub(r);g.push(v);break;case 2:g.push(this.ub(r));break;case 3:g.push(this.Fb(r));break;case 4:g.push(this.getBlob(r));break;default:g.push(null)}return g};c.prototype.getColumnNames=function(){for(var g=[],l=tc(this.Pa),n=0;n<l;n+=1)g.push(zc(this.Pa,n));return g};c.prototype.getAsObject=function(g,l){g=this.get(g,l);l=this.getColumnNames();for(var n={},r=0;r<l.length;r+=1)n[l[r]]=g[r];return n};c.prototype.getSQL=function(){return pb(this.Pa)};
c.prototype.getNormalizedSQL=function(){return mc(this.Pa)};c.prototype.run=function(g){null!=g&&this.bind(g);this.step();return this.reset()};c.prototype.qb=function(g,l){null==l&&(l=this.Na,this.Na+=1);g=ra(g);var n=da(g,ea);this.jb.push(n);this.db.handleError(nc(this.Pa,l,n,g.length-1,0))};c.prototype.zb=function(g,l){null==l&&(l=this.Na,this.Na+=1);var n=da(g,ea);this.jb.push(n);this.db.handleError(rb(this.Pa,l,n,g.length,0))};c.prototype.pb=function(g,l){null==l&&(l=this.Na,this.Na+=1);this.db.handleError((g===
(g|0)?pc:oc)(this.Pa,l,g))};c.prototype.Cb=function(g){null==g&&(g=this.Na,this.Na+=1);rb(this.Pa,g,0,0,0)};c.prototype.rb=function(g,l){null==l&&(l=this.Na,this.Na+=1);switch(typeof g){case "string":this.qb(g,l);return;case "number":this.pb(g,l);return;case "bigint":this.qb(g.toString(),l);return;case "boolean":this.pb(g+0,l);return;case "object":if(null===g){this.Cb(l);return}if(null!=g.length){this.zb(g,l);return}}throw"Wrong API use : tried to bind a value of an unknown type ("+g+").";};c.prototype.Bb=
function(g){var l=this;Object.keys(g).forEach(function(n){var r=qc(l.Pa,n);0!==r&&l.rb(g[n],r)});return!0};c.prototype.Ab=function(g){for(var l=0;l<g.length;l+=1)this.rb(g[l],l+1);return!0};c.prototype.reset=function(){this.freemem();return 0===Bc(this.Pa)&&0===Ac(this.Pa)};c.prototype.freemem=function(){for(var g;void 0!==(g=this.jb.pop());)fa(g)};c.prototype.free=function(){this.freemem();var g=0===Cc(this.Pa);delete this.db.cb[this.Pa];this.Pa=0;return g};d.prototype.next=function(){if(null===
this.bb)return{done:!0};null!==this.Xa&&(this.Xa.free(),this.Xa=null);if(!this.db.db)throw this.kb(),Error("Database closed");var g=sa(),l=y(4);ta(h);ta(l);try{this.db.handleError(qb(this.db.db,this.ib,-1,h,l));this.ib=m(l,"i32");var n=m(h,"i32");if(0===n)return this.kb(),{done:!0};this.Xa=new c(n,this.db);this.db.cb[n]=this.Xa;return{value:this.Xa,done:!1}}catch(r){throw this.nb=va(this.ib),this.kb(),r;}finally{wa(g)}};d.prototype.kb=function(){fa(this.bb);this.bb=null};d.prototype.getRemainingSQL=
function(){return null!==this.nb?this.nb:va(this.ib)};"function"===typeof Symbol&&"symbol"===typeof Symbol.iterator&&(d.prototype[Symbol.iterator]=function(){return this});e.prototype.run=function(g,l){if(!this.db)throw"Database closed";if(l){g=this.prepare(g,l);try{g.step()}finally{g.free()}}else this.handleError(u(this.db,g,0,0,h));return this};e.prototype.exec=function(g,l,n){if(!this.db)throw"Database closed";var r=sa(),v=null;try{var z=xa(g),L=y(4);for(g=[];0!==m(z,"i8");){ta(h);ta(L);this.handleError(qb(this.db,
z,-1,h,L));var J=m(h,"i32");z=m(L,"i32");if(0!==J){var I=null;v=new c(J,this);for(null!=l&&v.bind(l);v.step();)null===I&&(I={columns:v.getColumnNames(),values:[]},g.push(I)),I.values.push(v.get(null,n));v.free()}}return g}catch(M){throw v&&v.free(),M;}finally{wa(r)}};e.prototype.each=function(g,l,n,r,v){"function"===typeof l&&(r=n,n=l,l=void 0);g=this.prepare(g,l);try{for(;g.step();)n(g.getAsObject(null,v))}finally{g.free()}if("function"===typeof r)return r()};e.prototype.prepare=function(g,l){ta(h);
this.handleError(G(this.db,g,-1,h,0));g=m(h,"i32");if(0===g)throw"Nothing to prepare";var n=new c(g,this);null!=l&&n.bind(l);return this.cb[g]=n};e.prototype.iterateStatements=function(g){return new d(g,this)};e.prototype["export"]=function(){Object.values(this.cb).forEach(function(l){l.free()});Object.values(this.Ra).forEach(ya);this.Ra={};this.handleError(w(this.db));var g=za(this.filename);this.handleError(p(this.filename,h));this.db=m(h,"i32");ob(this.db);return g};e.prototype.close=function(){null!==
this.db&&(Object.values(this.cb).forEach(function(g){g.free()}),Object.values(this.Ra).forEach(ya),this.Ra={},this.handleError(w(this.db)),Aa("/"+this.filename),this.db=null)};e.prototype.handleError=function(g){if(0===g)return null;g=sc(this.db);throw Error(g);};e.prototype.getRowsModified=function(){return B(this.db)};e.prototype.create_function=function(g,l){Object.prototype.hasOwnProperty.call(this.Ra,g)&&(ya(this.Ra[g]),delete this.Ra[g]);var n=Ba(function(r,v,z){v=b(v,z);try{var L=l.apply(null,
v)}catch(J){ua(r,J,-1);return}a(r,L)},"viii");this.Ra[g]=n;this.handleError(tb(this.db,g,l.length,1,0,n,0,0,0));return this};e.prototype.create_aggregate=function(g,l){var n=l.init||function(){return null},r=l.finalize||function(I){return I},v=l.step;if(!v)throw"An aggregate function must have a step function in "+g;var z={};Object.hasOwnProperty.call(this.Ra,g)&&(ya(this.Ra[g]),delete this.Ra[g]);l=g+"__finalize";Object.hasOwnProperty.call(this.Ra,l)&&(ya(this.Ra[l]),delete this.Ra[l]);var L=Ba(function(I,
M,Ra){var W=ub(I,1);Object.hasOwnProperty.call(z,W)||(z[W]=n());M=b(M,Ra);M=[z[W]].concat(M);try{z[W]=v.apply(null,M)}catch(Ec){delete z[W],ua(I,Ec,-1)}},"viii"),J=Ba(function(I){var M=ub(I,1);try{var Ra=r(z[M])}catch(W){delete z[M];ua(I,W,-1);return}a(I,Ra);delete z[M]},"vi");this.Ra[g]=L;this.Ra[l]=J;this.handleError(tb(this.db,g,v.length-1,1,0,0,L,J,0));return this};f.Database=e};var Ca={...f},Da="./this.program",Ea=(a,b)=>{throw b;},A="",Fa,Ga;
if(ca){var fs=require("fs");require("path");A=__dirname+"/";Ga=a=>{a=Ha(a)?new URL(a):a;return fs.readFileSync(a)};Fa=async a=>{a=Ha(a)?new URL(a):a;return fs.readFileSync(a,void 0)};!f.thisProgram&&1<process.argv.length&&(Da=process.argv[1].replace(/\\/g,"/"));process.argv.slice(2);"undefined"!=typeof module&&(module.exports=f);Ea=(a,b)=>{process.exitCode=a;throw b;}}else if(aa||ba)ba?A=self.location.href:"undefined"!=typeof document&&document.currentScript&&(A=document.currentScript.src),A=A.startsWith("blob:")?
"":A.slice(0,A.replace(/[?#].*/,"").lastIndexOf("/")+1),ba&&(Ga=a=>{var b=new XMLHttpRequest;b.open("GET",a,!1);b.responseType="arraybuffer";b.send(null);return new Uint8Array(b.response)}),Fa=async a=>{if(Ha(a))return new Promise((c,d)=>{var e=new XMLHttpRequest;e.open("GET",a,!0);e.responseType="arraybuffer";e.onload=()=>{200==e.status||0==e.status&&e.response?c(e.response):d(e.status)};e.onerror=d;e.send(null)});var b=await fetch(a,{credentials:"same-origin"});if(b.ok)return b.arrayBuffer();throw Error(b.status+
" : "+b.url);};var Ia=f.print||console.log.bind(console),Ja=f.printErr||console.error.bind(console);Object.assign(f,Ca);Ca=null;f.thisProgram&&(Da=f.thisProgram);var Ka=f.wasmBinary,La,Ma=!1,Na,q,x,Oa,C,D,Pa,E,Qa,Ha=a=>a.startsWith("file://");
function Sa(){var a=La.buffer;f.HEAP8=q=new Int8Array(a);f.HEAP16=Oa=new Int16Array(a);f.HEAPU8=x=new Uint8Array(a);f.HEAPU16=new Uint16Array(a);f.HEAP32=C=new Int32Array(a);f.HEAPU32=D=new Uint32Array(a);f.HEAPF32=Pa=new Float32Array(a);f.HEAPF64=Qa=new Float64Array(a);f.HEAP64=E=new BigInt64Array(a);f.HEAPU64=new BigUint64Array(a)}var F=0,Ta=null;function Ua(a){f.onAbort?.(a);a="Aborted("+a+")";Ja(a);Ma=!0;throw new WebAssembly.RuntimeError(a+". Build with -sASSERTIONS for more info.");}var Va;
async function Wa(a){if(!Ka)try{var b=await Fa(a);return new Uint8Array(b)}catch{}if(a==Va&&Ka)a=new Uint8Array(Ka);else if(Ga)a=Ga(a);else throw"both async and sync fetching of the wasm failed";return a}async function Xa(a,b){try{var c=await Wa(a);return await WebAssembly.instantiate(c,b)}catch(d){Ja(`failed to asynchronously prepare wasm: ${d}`),Ua(d)}}
async function Ya(a){var b=Va;if(!Ka&&"function"==typeof WebAssembly.instantiateStreaming&&!Ha(b)&&!ca)try{var c=fetch(b,{credentials:"same-origin"});return await WebAssembly.instantiateStreaming(c,a)}catch(d){Ja(`wasm streaming compile failed: ${d}`),Ja("falling back to ArrayBuffer instantiation")}return Xa(b,a)}class Za{name="ExitStatus";constructor(a){this.message=`Program terminated with exit(${a})`;this.status=a}}
var $a=a=>{for(;0<a.length;)a.shift()(f)},ab=[],bb=[],cb=()=>{var a=f.preRun.shift();bb.unshift(a)};function m(a,b="i8"){b.endsWith("*")&&(b="*");switch(b){case "i1":return q[a];case "i8":return q[a];case "i16":return Oa[a>>1];case "i32":return C[a>>2];case "i64":return E[a>>3];case "float":return Pa[a>>2];case "double":return Qa[a>>3];case "*":return D[a>>2];default:Ua(`invalid type for getValue: ${b}`)}}var db=f.noExitRuntime||!0;
function ta(a){var b="i32";b.endsWith("*")&&(b="*");switch(b){case "i1":q[a]=0;break;case "i8":q[a]=0;break;case "i16":Oa[a>>1]=0;break;case "i32":C[a>>2]=0;break;case "i64":E[a>>3]=BigInt(0);break;case "float":Pa[a>>2]=0;break;case "double":Qa[a>>3]=0;break;case "*":D[a>>2]=0;break;default:Ua(`invalid type for setValue: ${b}`)}}
var eb="undefined"!=typeof TextDecoder?new TextDecoder:void 0,H=(a,b=0,c=NaN)=>{var d=b+c;for(c=b;a[c]&&!(c>=d);)++c;if(16<c-b&&a.buffer&&eb)return eb.decode(a.subarray(b,c));for(d="";b<c;){var e=a[b++];if(e&128){var h=a[b++]&63;if(192==(e&224))d+=String.fromCharCode((e&31)<<6|h);else{var k=a[b++]&63;e=224==(e&240)?(e&15)<<12|h<<6|k:(e&7)<<18|h<<12|k<<6|a[b++]&63;65536>e?d+=String.fromCharCode(e):(e-=65536,d+=String.fromCharCode(55296|e>>10,56320|e&1023))}}else d+=String.fromCharCode(e)}return d},
va=(a,b)=>a?H(x,a,b):"",fb=(a,b)=>{for(var c=0,d=a.length-1;0<=d;d--){var e=a[d];"."===e?a.splice(d,1):".."===e?(a.splice(d,1),c++):c&&(a.splice(d,1),c--)}if(b)for(;c;c--)a.unshift("..");return a},ka=a=>{var b="/"===a.charAt(0),c="/"===a.slice(-1);(a=fb(a.split("/").filter(d=>!!d),!b).join("/"))||b||(a=".");a&&c&&(a+="/");return(b?"/":"")+a},gb=a=>{var b=/^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/.exec(a).slice(1);a=b[0];b=b[1];if(!a&&!b)return".";b&&=b.slice(0,-1);return a+b},
hb=a=>a&&a.match(/([^\/]+|\/)\/*$/)[1],ib=()=>{if(ca){var a=require("crypto");return b=>a.randomFillSync(b)}return b=>crypto.getRandomValues(b)},jb=a=>{(jb=ib())(a)},kb=(...a)=>{for(var b="",c=!1,d=a.length-1;-1<=d&&!c;d--){c=0<=d?a[d]:"/";if("string"!=typeof c)throw new TypeError("Arguments to path.resolve must be strings");if(!c)return"";b=c+"/"+b;c="/"===c.charAt(0)}b=fb(b.split("/").filter(e=>!!e),!c).join("/");return(c?"/":"")+b||"."},mb=[],ha=a=>{for(var b=0,c=0;c<a.length;++c){var d=a.charCodeAt(c);
127>=d?b++:2047>=d?b+=2:55296<=d&&57343>=d?(b+=4,++c):b+=3}return b},t=(a,b,c,d)=>{if(!(0<d))return 0;var e=c;d=c+d-1;for(var h=0;h<a.length;++h){var k=a.charCodeAt(h);if(55296<=k&&57343>=k){var p=a.charCodeAt(++h);k=65536+((k&1023)<<10)|p&1023}if(127>=k){if(c>=d)break;b[c++]=k}else{if(2047>=k){if(c+1>=d)break;b[c++]=192|k>>6}else{if(65535>=k){if(c+2>=d)break;b[c++]=224|k>>12}else{if(c+3>=d)break;b[c++]=240|k>>18;b[c++]=128|k>>12&63}b[c++]=128|k>>6&63}b[c++]=128|k&63}}b[c]=0;return c-e},ra=(a,b)=>
{var c=Array(ha(a)+1);a=t(a,c,0,c.length);b&&(c.length=a);return c},nb=[];function vb(a,b){nb[a]={input:[],output:[],ab:b};wb(a,xb)}
var xb={open(a){var b=nb[a.node.rdev];if(!b)throw new K(43);a.tty=b;a.seekable=!1},close(a){a.tty.ab.fsync(a.tty)},fsync(a){a.tty.ab.fsync(a.tty)},read(a,b,c,d){if(!a.tty||!a.tty.ab.vb)throw new K(60);for(var e=0,h=0;h<d;h++){try{var k=a.tty.ab.vb(a.tty)}catch(p){throw new K(29);}if(void 0===k&&0===e)throw new K(6);if(null===k||void 0===k)break;e++;b[c+h]=k}e&&(a.node.atime=Date.now());return e},write(a,b,c,d){if(!a.tty||!a.tty.ab.ob)throw new K(60);try{for(var e=0;e<d;e++)a.tty.ab.ob(a.tty,b[c+e])}catch(h){throw new K(29);
}d&&(a.node.mtime=a.node.ctime=Date.now());return e}},yb={vb(){a:{if(!mb.length){var a=null;if(ca){var b=Buffer.alloc(256),c=0,d=process.stdin.fd;try{c=fs.readSync(d,b,0,256)}catch(e){if(e.toString().includes("EOF"))c=0;else throw e;}0<c&&(a=b.slice(0,c).toString("utf-8"))}else"undefined"!=typeof window&&"function"==typeof window.prompt&&(a=window.prompt("Input: "),null!==a&&(a+="\n"));if(!a){a=null;break a}mb=ra(a,!0)}a=mb.shift()}return a},ob(a,b){null===b||10===b?(Ia(H(a.output)),a.output=[]):
0!=b&&a.output.push(b)},fsync(a){0<a.output?.length&&(Ia(H(a.output)),a.output=[])},Rb(){return{Mb:25856,Ob:5,Lb:191,Nb:35387,Kb:[3,28,127,21,4,0,1,0,17,19,26,0,18,15,23,22,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]}},Sb(){return 0},Tb(){return[24,80]}},zb={ob(a,b){null===b||10===b?(Ja(H(a.output)),a.output=[]):0!=b&&a.output.push(b)},fsync(a){0<a.output?.length&&(Ja(H(a.output)),a.output=[])}},N={Va:null,Wa(){return N.createNode(null,"/",16895,0)},createNode(a,b,c,d){if(24576===(c&61440)||4096===(c&61440))throw new K(63);
N.Va||(N.Va={dir:{node:{Sa:N.Ka.Sa,Ta:N.Ka.Ta,lookup:N.Ka.lookup,fb:N.Ka.fb,rename:N.Ka.rename,unlink:N.Ka.unlink,rmdir:N.Ka.rmdir,readdir:N.Ka.readdir,symlink:N.Ka.symlink},stream:{Ua:N.La.Ua}},file:{node:{Sa:N.Ka.Sa,Ta:N.Ka.Ta},stream:{Ua:N.La.Ua,read:N.La.read,write:N.La.write,gb:N.La.gb,hb:N.La.hb}},link:{node:{Sa:N.Ka.Sa,Ta:N.Ka.Ta,readlink:N.Ka.readlink},stream:{}},sb:{node:{Sa:N.Ka.Sa,Ta:N.Ka.Ta},stream:Ab}});c=Bb(a,b,c,d);O(c.mode)?(c.Ka=N.Va.dir.node,c.La=N.Va.dir.stream,c.Ma={}):32768===
(c.mode&61440)?(c.Ka=N.Va.file.node,c.La=N.Va.file.stream,c.Qa=0,c.Ma=null):40960===(c.mode&61440)?(c.Ka=N.Va.link.node,c.La=N.Va.link.stream):8192===(c.mode&61440)&&(c.Ka=N.Va.sb.node,c.La=N.Va.sb.stream);c.atime=c.mtime=c.ctime=Date.now();a&&(a.Ma[b]=c,a.atime=a.mtime=a.ctime=c.atime);return c},Qb(a){return a.Ma?a.Ma.subarray?a.Ma.subarray(0,a.Qa):new Uint8Array(a.Ma):new Uint8Array(0)},Ka:{Sa(a){var b={};b.dev=8192===(a.mode&61440)?a.id:1;b.ino=a.id;b.mode=a.mode;b.nlink=1;b.uid=0;b.gid=0;b.rdev=
a.rdev;O(a.mode)?b.size=4096:32768===(a.mode&61440)?b.size=a.Qa:40960===(a.mode&61440)?b.size=a.link.length:b.size=0;b.atime=new Date(a.atime);b.mtime=new Date(a.mtime);b.ctime=new Date(a.ctime);b.blksize=4096;b.blocks=Math.ceil(b.size/b.blksize);return b},Ta(a,b){for(var c of["mode","atime","mtime","ctime"])null!=b[c]&&(a[c]=b[c]);void 0!==b.size&&(b=b.size,a.Qa!=b&&(0==b?(a.Ma=null,a.Qa=0):(c=a.Ma,a.Ma=new Uint8Array(b),c&&a.Ma.set(c.subarray(0,Math.min(b,a.Qa))),a.Qa=b)))},lookup(){throw N.tb;
},fb(a,b,c,d){return N.createNode(a,b,c,d)},rename(a,b,c){try{var d=P(b,c)}catch(h){}if(d){if(O(a.mode))for(var e in d.Ma)throw new K(55);Cb(d)}delete a.parent.Ma[a.name];b.Ma[c]=a;a.name=c;b.ctime=b.mtime=a.parent.ctime=a.parent.mtime=Date.now()},unlink(a,b){delete a.Ma[b];a.ctime=a.mtime=Date.now()},rmdir(a,b){var c=P(a,b),d;for(d in c.Ma)throw new K(55);delete a.Ma[b];a.ctime=a.mtime=Date.now()},readdir(a){return[".","..",...Object.keys(a.Ma)]},symlink(a,b,c){a=N.createNode(a,b,41471,0);a.link=
c;return a},readlink(a){if(40960!==(a.mode&61440))throw new K(28);return a.link}},La:{read(a,b,c,d,e){var h=a.node.Ma;if(e>=a.node.Qa)return 0;a=Math.min(a.node.Qa-e,d);if(8<a&&h.subarray)b.set(h.subarray(e,e+a),c);else for(d=0;d<a;d++)b[c+d]=h[e+d];return a},write(a,b,c,d,e,h){b.buffer===q.buffer&&(h=!1);if(!d)return 0;a=a.node;a.mtime=a.ctime=Date.now();if(b.subarray&&(!a.Ma||a.Ma.subarray)){if(h)return a.Ma=b.subarray(c,c+d),a.Qa=d;if(0===a.Qa&&0===e)return a.Ma=b.slice(c,c+d),a.Qa=d;if(e+d<=a.Qa)return a.Ma.set(b.subarray(c,
c+d),e),d}h=e+d;var k=a.Ma?a.Ma.length:0;k>=h||(h=Math.max(h,k*(1048576>k?2:1.125)>>>0),0!=k&&(h=Math.max(h,256)),k=a.Ma,a.Ma=new Uint8Array(h),0<a.Qa&&a.Ma.set(k.subarray(0,a.Qa),0));if(a.Ma.subarray&&b.subarray)a.Ma.set(b.subarray(c,c+d),e);else for(h=0;h<d;h++)a.Ma[e+h]=b[c+h];a.Qa=Math.max(a.Qa,e+d);return d},Ua(a,b,c){1===c?b+=a.position:2===c&&32768===(a.node.mode&61440)&&(b+=a.node.Qa);if(0>b)throw new K(28);return b},gb(a,b,c,d,e){if(32768!==(a.node.mode&61440))throw new K(43);a=a.node.Ma;
if(e&2||!a||a.buffer!==q.buffer){e=!0;d=65536*Math.ceil(b/65536);var h=Db(65536,d);h&&x.fill(0,h,h+d);d=h;if(!d)throw new K(48);if(a){if(0<c||c+b<a.length)a.subarray?a=a.subarray(c,c+b):a=Array.prototype.slice.call(a,c,c+b);q.set(a,d)}}else e=!1,d=a.byteOffset;return{Ib:d,yb:e}},hb(a,b,c,d){N.La.write(a,b,0,d,c,!1);return 0}}},la=(a,b)=>{var c=0;a&&(c|=365);b&&(c|=146);return c},Eb=null,Fb={},Gb=[],Hb=1,Q=null,Ib=!1,Jb=!0,Kb={},K=class{name="ErrnoError";constructor(a){this.Oa=a}},Lb=class{eb={};node=null;get flags(){return this.eb.flags}set flags(a){this.eb.flags=
a}get position(){return this.eb.position}set position(a){this.eb.position=a}},Mb=class{Ka={};La={};Za=null;constructor(a,b,c,d){a||=this;this.parent=a;this.Wa=a.Wa;this.id=Hb++;this.name=b;this.mode=c;this.rdev=d;this.atime=this.mtime=this.ctime=Date.now()}get read(){return 365===(this.mode&365)}set read(a){a?this.mode|=365:this.mode&=-366}get write(){return 146===(this.mode&146)}set write(a){a?this.mode|=146:this.mode&=-147}};
function R(a,b={}){if(!a)throw new K(44);b.lb??(b.lb=!0);"/"===a.charAt(0)||(a="//"+a);var c=0;a:for(;40>c;c++){a=a.split("/").filter(p=>!!p);for(var d=Eb,e="/",h=0;h<a.length;h++){var k=h===a.length-1;if(k&&b.parent)break;if("."!==a[h])if(".."===a[h])e=gb(e),d=d.parent;else{e=ka(e+"/"+a[h]);try{d=P(d,a[h])}catch(p){if(44===p?.Oa&&k&&b.Hb)return{path:e};throw p;}!d.Za||k&&!b.lb||(d=d.Za.root);if(40960===(d.mode&61440)&&(!k||b.Ya)){if(!d.Ka.readlink)throw new K(52);d=d.Ka.readlink(d);"/"===d.charAt(0)||
(d=gb(e)+"/"+d);a=d+"/"+a.slice(h+1).join("/");continue a}}}return{path:e,node:d}}throw new K(32);}function ja(a){for(var b;;){if(a===a.parent)return a=a.Wa.xb,b?"/"!==a[a.length-1]?`${a}/${b}`:a+b:a;b=b?`${a.name}/${b}`:a.name;a=a.parent}}function Nb(a,b){for(var c=0,d=0;d<b.length;d++)c=(c<<5)-c+b.charCodeAt(d)|0;return(a+c>>>0)%Q.length}function Cb(a){var b=Nb(a.parent.id,a.name);if(Q[b]===a)Q[b]=a.$a;else for(b=Q[b];b;){if(b.$a===a){b.$a=a.$a;break}b=b.$a}}
function P(a,b){var c=O(a.mode)?(c=Ob(a,"x"))?c:a.Ka.lookup?0:2:54;if(c)throw new K(c);for(c=Q[Nb(a.id,b)];c;c=c.$a){var d=c.name;if(c.parent.id===a.id&&d===b)return c}return a.Ka.lookup(a,b)}function Bb(a,b,c,d){a=new Mb(a,b,c,d);b=Nb(a.parent.id,a.name);a.$a=Q[b];return Q[b]=a}function O(a){return 16384===(a&61440)}function Pb(a){var b=["r","w","rw"][a&3];a&512&&(b+="w");return b}
function Ob(a,b){if(Jb)return 0;if(!b.includes("r")||a.mode&292){if(b.includes("w")&&!(a.mode&146)||b.includes("x")&&!(a.mode&73))return 2}else return 2;return 0}function Qb(a,b){if(!O(a.mode))return 54;try{return P(a,b),20}catch(c){}return Ob(a,"wx")}function Rb(a,b,c){try{var d=P(a,b)}catch(e){return e.Oa}if(a=Ob(a,"wx"))return a;if(c){if(!O(d.mode))return 54;if(d===d.parent||"/"===ja(d))return 10}else if(O(d.mode))return 31;return 0}function Sb(a){if(!a)throw new K(63);return a}
function S(a){a=Gb[a];if(!a)throw new K(8);return a}function Tb(a,b=-1){a=Object.assign(new Lb,a);if(-1==b)a:{for(b=0;4096>=b;b++)if(!Gb[b])break a;throw new K(33);}a.fd=b;return Gb[b]=a}function Ub(a,b=-1){a=Tb(a,b);a.La?.Pb?.(a);return a}function Vb(a,b,c){var d=a?.La.Ta;a=d?a:b;d??=b.Ka.Ta;Sb(d);d(a,c)}var Ab={open(a){a.La=Fb[a.node.rdev].La;a.La.open?.(a)},Ua(){throw new K(70);}};function wb(a,b){Fb[a]={La:b}}
function Wb(a,b){var c="/"===b;if(c&&Eb)throw new K(10);if(!c&&b){var d=R(b,{lb:!1});b=d.path;d=d.node;if(d.Za)throw new K(10);if(!O(d.mode))throw new K(54);}b={type:a,Ub:{},xb:b,Gb:[]};a=a.Wa(b);a.Wa=b;b.root=a;c?Eb=a:d&&(d.Za=b,d.Wa&&d.Wa.Gb.push(b))}function Xb(a,b,c){var d=R(a,{parent:!0}).node;a=hb(a);if(!a)throw new K(28);if("."===a||".."===a)throw new K(20);var e=Qb(d,a);if(e)throw new K(e);if(!d.Ka.fb)throw new K(63);return d.Ka.fb(d,a,b,c)}
function ma(a,b=438){return Xb(a,b&4095|32768,0)}function T(a,b=511){return Xb(a,b&1023|16384,0)}function Yb(a,b,c){"undefined"==typeof c&&(c=b,b=438);Xb(a,b|8192,c)}function Zb(a,b){if(!kb(a))throw new K(44);var c=R(b,{parent:!0}).node;if(!c)throw new K(44);b=hb(b);var d=Qb(c,b);if(d)throw new K(d);if(!c.Ka.symlink)throw new K(63);c.Ka.symlink(c,b,a)}
function $b(a){var b=R(a,{parent:!0}).node;a=hb(a);var c=P(b,a),d=Rb(b,a,!0);if(d)throw new K(d);if(!b.Ka.rmdir)throw new K(63);if(c.Za)throw new K(10);b.Ka.rmdir(b,a);Cb(c)}function Aa(a){var b=R(a,{parent:!0}).node;if(!b)throw new K(44);a=hb(a);var c=P(b,a),d=Rb(b,a,!1);if(d)throw new K(d);if(!b.Ka.unlink)throw new K(63);if(c.Za)throw new K(10);b.Ka.unlink(b,a);Cb(c)}function ac(a,b){a=R(a,{Ya:!b}).node;return Sb(a.Ka.Sa)(a)}
function bc(a,b,c,d){Vb(a,b,{mode:c&4095|b.mode&-4096,ctime:Date.now(),Db:d})}function na(a,b){a="string"==typeof a?R(a,{Ya:!0}).node:a;bc(null,a,b)}function lc(a,b,c){if(O(b.mode))throw new K(31);if(32768!==(b.mode&61440))throw new K(28);var d=Ob(b,"w");if(d)throw new K(d);Vb(a,b,{size:c,timestamp:Date.now()})}
function oa(a,b,c=438){if(""===a)throw new K(44);if("string"==typeof b){var d={r:0,"r+":2,w:577,"w+":578,a:1089,"a+":1090}[b];if("undefined"==typeof d)throw Error(`Unknown file open mode: ${b}`);b=d}c=b&64?c&4095|32768:0;if("object"==typeof a)d=a;else{var e=a.endsWith("/");a=R(a,{Ya:!(b&131072),Hb:!0});d=a.node;a=a.path}var h=!1;if(b&64)if(d){if(b&128)throw new K(20);}else{if(e)throw new K(31);d=Xb(a,c|511,0);h=!0}if(!d)throw new K(44);8192===(d.mode&61440)&&(b&=-513);if(b&65536&&!O(d.mode))throw new K(54);
if(!h&&(e=d?40960===(d.mode&61440)?32:O(d.mode)&&("r"!==Pb(b)||b&576)?31:Ob(d,Pb(b)):44))throw new K(e);b&512&&!h&&(e=d,e="string"==typeof e?R(e,{Ya:!0}).node:e,lc(null,e,0));b&=-131713;e=Tb({node:d,path:ja(d),flags:b,seekable:!0,position:0,La:d.La,Jb:[],error:!1});e.La.open&&e.La.open(e);h&&na(d,c&511);!f.logReadFiles||b&1||a in Kb||(Kb[a]=1);return e}function qa(a){if(null===a.fd)throw new K(8);a.mb&&(a.mb=null);try{a.La.close&&a.La.close(a)}catch(b){throw b;}finally{Gb[a.fd]=null}a.fd=null}
function Dc(a,b,c){if(null===a.fd)throw new K(8);if(!a.seekable||!a.La.Ua)throw new K(70);if(0!=c&&1!=c&&2!=c)throw new K(28);a.position=a.La.Ua(a,b,c);a.Jb=[]}function Fc(a,b,c,d,e){if(0>d||0>e)throw new K(28);if(null===a.fd)throw new K(8);if(1===(a.flags&2097155))throw new K(8);if(O(a.node.mode))throw new K(31);if(!a.La.read)throw new K(28);var h="undefined"!=typeof e;if(!h)e=a.position;else if(!a.seekable)throw new K(70);b=a.La.read(a,b,c,d,e);h||(a.position+=b);return b}
function pa(a,b,c,d,e){if(0>d||0>e)throw new K(28);if(null===a.fd)throw new K(8);if(0===(a.flags&2097155))throw new K(8);if(O(a.node.mode))throw new K(31);if(!a.La.write)throw new K(28);a.seekable&&a.flags&1024&&Dc(a,0,2);var h="undefined"!=typeof e;if(!h)e=a.position;else if(!a.seekable)throw new K(70);b=a.La.write(a,b,c,d,e,void 0);h||(a.position+=b);return b}
function za(a){var b="binary";if("utf8"!==b&&"binary"!==b)throw Error(`Invalid encoding type "${b}"`);var c;var d=oa(a,d||0);a=ac(a).size;var e=new Uint8Array(a);Fc(d,e,0,a,0);"utf8"===b?c=H(e):"binary"===b&&(c=e);qa(d);return c}
function U(a,b,c){a=ka("/dev/"+a);var d=la(!!b,!!c);U.wb??(U.wb=64);var e=U.wb++<<8|0;wb(e,{open(h){h.seekable=!1},close(){c?.buffer?.length&&c(10)},read(h,k,p,w){for(var u=0,B=0;B<w;B++){try{var G=b()}catch(pb){throw new K(29);}if(void 0===G&&0===u)throw new K(6);if(null===G||void 0===G)break;u++;k[p+B]=G}u&&(h.node.atime=Date.now());return u},write(h,k,p,w){for(var u=0;u<w;u++)try{c(k[p+u])}catch(B){throw new K(29);}w&&(h.node.mtime=h.node.ctime=Date.now());return u}});Yb(a,d,e)}var V={};
function X(a,b,c){if("/"===b.charAt(0))return b;a=-100===a?"/":S(a).path;if(0==b.length){if(!c)throw new K(44);return a}return a+"/"+b}
function Gc(a,b){C[a>>2]=b.dev;C[a+4>>2]=b.mode;D[a+8>>2]=b.nlink;C[a+12>>2]=b.uid;C[a+16>>2]=b.gid;C[a+20>>2]=b.rdev;E[a+24>>3]=BigInt(b.size);C[a+32>>2]=4096;C[a+36>>2]=b.blocks;var c=b.atime.getTime(),d=b.mtime.getTime(),e=b.ctime.getTime();E[a+40>>3]=BigInt(Math.floor(c/1E3));D[a+48>>2]=c%1E3*1E6;E[a+56>>3]=BigInt(Math.floor(d/1E3));D[a+64>>2]=d%1E3*1E6;E[a+72>>3]=BigInt(Math.floor(e/1E3));D[a+80>>2]=e%1E3*1E6;E[a+88>>3]=BigInt(b.ino);return 0}
var Hc=void 0,Ic=()=>{var a=C[+Hc>>2];Hc+=4;return a},Jc=0,Kc=[0,31,60,91,121,152,182,213,244,274,305,335],Lc=[0,31,59,90,120,151,181,212,243,273,304,334],Mc={},Nc=a=>{Na=a;db||0<Jc||(f.onExit?.(a),Ma=!0);Ea(a,new Za(a))},Oc=a=>{if(!Ma)try{if(a(),!(db||0<Jc))try{Na=a=Na,Nc(a)}catch(b){b instanceof Za||"unwind"==b||Ea(1,b)}}catch(b){b instanceof Za||"unwind"==b||Ea(1,b)}},Pc={},Rc=()=>{if(!Qc){var a={USER:"web_user",LOGNAME:"web_user",PATH:"/",PWD:"/",HOME:"/home/web_user",LANG:("object"==typeof navigator&&
navigator.languages&&navigator.languages[0]||"C").replace("-","_")+".UTF-8",_:Da||"./this.program"},b;for(b in Pc)void 0===Pc[b]?delete a[b]:a[b]=Pc[b];var c=[];for(b in a)c.push(`${b}=${a[b]}`);Qc=c}return Qc},Qc,xa=a=>{var b=ha(a)+1,c=y(b);t(a,x,c,b);return c},Sc=(a,b,c,d)=>{var e={string:u=>{var B=0;null!==u&&void 0!==u&&0!==u&&(B=xa(u));return B},array:u=>{var B=y(u.length);q.set(u,B);return B}};a=f["_"+a];var h=[],k=0;if(d)for(var p=0;p<d.length;p++){var w=e[c[p]];w?(0===k&&(k=sa()),h[p]=w(d[p])):
h[p]=d[p]}c=a(...h);return c=function(u){0!==k&&wa(k);return"string"===b?u?H(x,u):"":"boolean"===b?!!u:u}(c)},ea=0,da=(a,b)=>{b=1==b?y(a.length):ia(a.length);a.subarray||a.slice||(a=new Uint8Array(a));x.set(a,b);return b},Tc,Uc=[],Y,ya=a=>{Tc.delete(Y.get(a));Y.set(a,null);Uc.push(a)},Ba=(a,b)=>{if(!Tc){Tc=new WeakMap;var c=Y.length;if(Tc)for(var d=0;d<0+c;d++){var e=Y.get(d);e&&Tc.set(e,d)}}if(c=Tc.get(a)||0)return c;if(Uc.length)c=Uc.pop();else{try{Y.grow(1)}catch(w){if(!(w instanceof RangeError))throw w;
throw"Unable to grow wasm table. Set ALLOW_TABLE_GROWTH.";}c=Y.length-1}try{Y.set(c,a)}catch(w){if(!(w instanceof TypeError))throw w;if("function"==typeof WebAssembly.Function){var h=WebAssembly.Function;d={i:"i32",j:"i64",f:"f32",d:"f64",e:"externref",p:"i32"};e={parameters:[],results:"v"==b[0]?[]:[d[b[0]]]};for(var k=1;k<b.length;++k)e.parameters.push(d[b[k]]);b=new h(e,a)}else{d=[1];e=b.slice(0,1);b=b.slice(1);k={i:127,p:127,j:126,f:125,d:124,e:111};d.push(96);var p=b.length;128>p?d.push(p):d.push(p%
128|128,p>>7);for(h of b)d.push(k[h]);"v"==e?d.push(0):d.push(1,k[e]);b=[0,97,115,109,1,0,0,0,1];h=d.length;128>h?b.push(h):b.push(h%128|128,h>>7);b.push(...d);b.push(2,7,1,1,101,1,102,0,0,7,5,1,1,102,0,0);b=new WebAssembly.Module(new Uint8Array(b));b=(new WebAssembly.Instance(b,{e:{f:a}})).exports.f}Y.set(c,b)}Tc.set(a,c);return c};Q=Array(4096);Wb(N,"/");T("/tmp");T("/home");T("/home/web_user");
(function(){T("/dev");wb(259,{read:()=>0,write:(d,e,h,k)=>k,Ua:()=>0});Yb("/dev/null",259);vb(1280,yb);vb(1536,zb);Yb("/dev/tty",1280);Yb("/dev/tty1",1536);var a=new Uint8Array(1024),b=0,c=()=>{0===b&&(jb(a),b=a.byteLength);return a[--b]};U("random",c);U("urandom",c);T("/dev/shm");T("/dev/shm/tmp")})();
(function(){T("/proc");var a=T("/proc/self");T("/proc/self/fd");Wb({Wa(){var b=Bb(a,"fd",16895,73);b.La={Ua:N.La.Ua};b.Ka={lookup(c,d){c=+d;var e=S(c);c={parent:null,Wa:{xb:"fake"},Ka:{readlink:()=>e.path},id:c+1};return c.parent=c},readdir(){return Array.from(Gb.entries()).filter(([,c])=>c).map(([c])=>c.toString())}};return b}},"/proc/self/fd")})();N.tb=new K(44);N.tb.stack="<generic error, no stack>";
var Wc={a:(a,b,c,d)=>Ua(`Assertion failed: ${a?H(x,a):""}, at: `+[b?b?H(x,b):"":"unknown filename",c,d?d?H(x,d):"":"unknown function"]),i:function(a,b){try{return a=a?H(x,a):"",na(a,b),0}catch(c){if("undefined"==typeof V||"ErrnoError"!==c.name)throw c;return-c.Oa}},L:function(a,b,c){try{b=b?H(x,b):"";b=X(a,b);if(c&-8)return-28;var d=R(b,{Ya:!0}).node;if(!d)return-44;a="";c&4&&(a+="r");c&2&&(a+="w");c&1&&(a+="x");return a&&Ob(d,a)?-2:0}catch(e){if("undefined"==typeof V||"ErrnoError"!==e.name)throw e;
return-e.Oa}},j:function(a,b){try{var c=S(a);bc(c,c.node,b,!1);return 0}catch(d){if("undefined"==typeof V||"ErrnoError"!==d.name)throw d;return-d.Oa}},h:function(a){try{var b=S(a);Vb(b,b.node,{timestamp:Date.now(),Db:!1});return 0}catch(c){if("undefined"==typeof V||"ErrnoError"!==c.name)throw c;return-c.Oa}},b:function(a,b,c){Hc=c;try{var d=S(a);switch(b){case 0:var e=Ic();if(0>e)break;for(;Gb[e];)e++;return Ub(d,e).fd;case 1:case 2:return 0;case 3:return d.flags;case 4:return e=Ic(),d.flags|=e,0;
case 12:return e=Ic(),Oa[e+0>>1]=2,0;case 13:case 14:return 0}return-28}catch(h){if("undefined"==typeof V||"ErrnoError"!==h.name)throw h;return-h.Oa}},g:function(a,b){try{var c=S(a),d=c.node,e=c.La.Sa;a=e?c:d;e??=d.Ka.Sa;Sb(e);var h=e(a);return Gc(b,h)}catch(k){if("undefined"==typeof V||"ErrnoError"!==k.name)throw k;return-k.Oa}},H:function(a,b){b=-9007199254740992>b||9007199254740992<b?NaN:Number(b);try{if(isNaN(b))return 61;var c=S(a);if(0>b||0===(c.flags&2097155))throw new K(28);lc(c,c.node,b);
return 0}catch(d){if("undefined"==typeof V||"ErrnoError"!==d.name)throw d;return-d.Oa}},G:function(a,b){try{if(0===b)return-28;var c=ha("/")+1;if(b<c)return-68;t("/",x,a,b);return c}catch(d){if("undefined"==typeof V||"ErrnoError"!==d.name)throw d;return-d.Oa}},K:function(a,b){try{return a=a?H(x,a):"",Gc(b,ac(a,!0))}catch(c){if("undefined"==typeof V||"ErrnoError"!==c.name)throw c;return-c.Oa}},C:function(a,b,c){try{return b=b?H(x,b):"",b=X(a,b),T(b,c),0}catch(d){if("undefined"==typeof V||"ErrnoError"!==
d.name)throw d;return-d.Oa}},J:function(a,b,c,d){try{b=b?H(x,b):"";var e=d&256;b=X(a,b,d&4096);return Gc(c,e?ac(b,!0):ac(b))}catch(h){if("undefined"==typeof V||"ErrnoError"!==h.name)throw h;return-h.Oa}},x:function(a,b,c,d){Hc=d;try{b=b?H(x,b):"";b=X(a,b);var e=d?Ic():0;return oa(b,c,e).fd}catch(h){if("undefined"==typeof V||"ErrnoError"!==h.name)throw h;return-h.Oa}},v:function(a,b,c,d){try{b=b?H(x,b):"";b=X(a,b);if(0>=d)return-28;var e=R(b).node;if(!e)throw new K(44);if(!e.Ka.readlink)throw new K(28);
var h=e.Ka.readlink(e);var k=Math.min(d,ha(h)),p=q[c+k];t(h,x,c,d+1);q[c+k]=p;return k}catch(w){if("undefined"==typeof V||"ErrnoError"!==w.name)throw w;return-w.Oa}},u:function(a){try{return a=a?H(x,a):"",$b(a),0}catch(b){if("undefined"==typeof V||"ErrnoError"!==b.name)throw b;return-b.Oa}},f:function(a,b){try{return a=a?H(x,a):"",Gc(b,ac(a))}catch(c){if("undefined"==typeof V||"ErrnoError"!==c.name)throw c;return-c.Oa}},r:function(a,b,c){try{return b=b?H(x,b):"",b=X(a,b),0===c?Aa(b):512===c?$b(b):
Ua("Invalid flags passed to unlinkat"),0}catch(d){if("undefined"==typeof V||"ErrnoError"!==d.name)throw d;return-d.Oa}},q:function(a,b,c){try{b=b?H(x,b):"";b=X(a,b,!0);var d=Date.now(),e,h;if(c){var k=D[c>>2]+4294967296*C[c+4>>2],p=C[c+8>>2];1073741823==p?e=d:1073741822==p?e=null:e=1E3*k+p/1E6;c+=16;k=D[c>>2]+4294967296*C[c+4>>2];p=C[c+8>>2];1073741823==p?h=d:1073741822==p?h=null:h=1E3*k+p/1E6}else h=e=d;if(null!==(h??e)){a=e;var w=R(b,{Ya:!0}).node;Sb(w.Ka.Ta)(w,{atime:a,mtime:h})}return 0}catch(u){if("undefined"==
typeof V||"ErrnoError"!==u.name)throw u;return-u.Oa}},m:()=>Ua(""),l:()=>{db=!1;Jc=0},A:function(a,b){a=-9007199254740992>a||9007199254740992<a?NaN:Number(a);a=new Date(1E3*a);C[b>>2]=a.getSeconds();C[b+4>>2]=a.getMinutes();C[b+8>>2]=a.getHours();C[b+12>>2]=a.getDate();C[b+16>>2]=a.getMonth();C[b+20>>2]=a.getFullYear()-1900;C[b+24>>2]=a.getDay();var c=a.getFullYear();C[b+28>>2]=(0!==c%4||0===c%100&&0!==c%400?Lc:Kc)[a.getMonth()]+a.getDate()-1|0;C[b+36>>2]=-(60*a.getTimezoneOffset());c=(new Date(a.getFullYear(),
6,1)).getTimezoneOffset();var d=(new Date(a.getFullYear(),0,1)).getTimezoneOffset();C[b+32>>2]=(c!=d&&a.getTimezoneOffset()==Math.min(d,c))|0},y:function(a,b,c,d,e,h,k){e=-9007199254740992>e||9007199254740992<e?NaN:Number(e);try{if(isNaN(e))return 61;var p=S(d);if(0!==(b&2)&&0===(c&2)&&2!==(p.flags&2097155))throw new K(2);if(1===(p.flags&2097155))throw new K(2);if(!p.La.gb)throw new K(43);if(!a)throw new K(28);var w=p.La.gb(p,a,e,b,c);var u=w.Ib;C[h>>2]=w.yb;D[k>>2]=u;return 0}catch(B){if("undefined"==
typeof V||"ErrnoError"!==B.name)throw B;return-B.Oa}},z:function(a,b,c,d,e,h){h=-9007199254740992>h||9007199254740992<h?NaN:Number(h);try{var k=S(e);if(c&2){c=h;if(32768!==(k.node.mode&61440))throw new K(43);if(!(d&2)){var p=x.slice(a,a+b);k.La.hb&&k.La.hb(k,p,c,b,d)}}}catch(w){if("undefined"==typeof V||"ErrnoError"!==w.name)throw w;return-w.Oa}},n:(a,b)=>{Mc[a]&&(clearTimeout(Mc[a].id),delete Mc[a]);if(!b)return 0;var c=setTimeout(()=>{delete Mc[a];Oc(()=>Vc(a,performance.now()))},b);Mc[a]={id:c,
Vb:b};return 0},B:(a,b,c,d)=>{var e=(new Date).getFullYear(),h=(new Date(e,0,1)).getTimezoneOffset();e=(new Date(e,6,1)).getTimezoneOffset();D[a>>2]=60*Math.max(h,e);C[b>>2]=Number(h!=e);b=k=>{var p=Math.abs(k);return`UTC${0<=k?"-":"+"}${String(Math.floor(p/60)).padStart(2,"0")}${String(p%60).padStart(2,"0")}`};a=b(h);b=b(e);e<h?(t(a,x,c,17),t(b,x,d,17)):(t(a,x,d,17),t(b,x,c,17))},d:()=>Date.now(),s:()=>2147483648,c:()=>performance.now(),o:a=>{var b=x.length;a>>>=0;if(2147483648<a)return!1;for(var c=
1;4>=c;c*=2){var d=b*(1+.2/c);d=Math.min(d,a+100663296);a:{d=(Math.min(2147483648,65536*Math.ceil(Math.max(a,d)/65536))-La.buffer.byteLength+65535)/65536|0;try{La.grow(d);Sa();var e=1;break a}catch(h){}e=void 0}if(e)return!0}return!1},E:(a,b)=>{var c=0;Rc().forEach((d,e)=>{var h=b+c;e=D[a+4*e>>2]=h;for(h=0;h<d.length;++h)q[e++]=d.charCodeAt(h);q[e]=0;c+=d.length+1});return 0},F:(a,b)=>{var c=Rc();D[a>>2]=c.length;var d=0;c.forEach(e=>d+=e.length+1);D[b>>2]=d;return 0},e:function(a){try{var b=S(a);
qa(b);return 0}catch(c){if("undefined"==typeof V||"ErrnoError"!==c.name)throw c;return c.Oa}},p:function(a,b){try{var c=S(a);q[b]=c.tty?2:O(c.mode)?3:40960===(c.mode&61440)?7:4;Oa[b+2>>1]=0;E[b+8>>3]=BigInt(0);E[b+16>>3]=BigInt(0);return 0}catch(d){if("undefined"==typeof V||"ErrnoError"!==d.name)throw d;return d.Oa}},w:function(a,b,c,d){try{a:{var e=S(a);a=b;for(var h,k=b=0;k<c;k++){var p=D[a>>2],w=D[a+4>>2];a+=8;var u=Fc(e,q,p,w,h);if(0>u){var B=-1;break a}b+=u;if(u<w)break;"undefined"!=typeof h&&
(h+=u)}B=b}D[d>>2]=B;return 0}catch(G){if("undefined"==typeof V||"ErrnoError"!==G.name)throw G;return G.Oa}},D:function(a,b,c,d){b=-9007199254740992>b||9007199254740992<b?NaN:Number(b);try{if(isNaN(b))return 61;var e=S(a);Dc(e,b,c);E[d>>3]=BigInt(e.position);e.mb&&0===b&&0===c&&(e.mb=null);return 0}catch(h){if("undefined"==typeof V||"ErrnoError"!==h.name)throw h;return h.Oa}},I:function(a){try{var b=S(a);return b.La?.fsync?b.La.fsync(b):0}catch(c){if("undefined"==typeof V||"ErrnoError"!==c.name)throw c;
return c.Oa}},t:function(a,b,c,d){try{a:{var e=S(a);a=b;for(var h,k=b=0;k<c;k++){var p=D[a>>2],w=D[a+4>>2];a+=8;var u=pa(e,q,p,w,h);if(0>u){var B=-1;break a}b+=u;if(u<w)break;"undefined"!=typeof h&&(h+=u)}B=b}D[d>>2]=B;return 0}catch(G){if("undefined"==typeof V||"ErrnoError"!==G.name)throw G;return G.Oa}},k:Nc},Z;
(async function(){function a(c){Z=c.exports;La=Z.M;Sa();Y=Z.O;F--;f.monitorRunDependencies?.(F);0==F&&Ta&&(c=Ta,Ta=null,c());return Z}F++;f.monitorRunDependencies?.(F);var b={a:Wc};if(f.instantiateWasm)return new Promise(c=>{f.instantiateWasm(b,(d,e)=>{a(d,e);c(d.exports)})});Va??=f.locateFile?f.locateFile("sql-wasm.wasm",A):A+"sql-wasm.wasm";return a((await Ya(b)).instance)})();f._sqlite3_free=a=>(f._sqlite3_free=Z.P)(a);f._sqlite3_value_text=a=>(f._sqlite3_value_text=Z.Q)(a);
f._sqlite3_prepare_v2=(a,b,c,d,e)=>(f._sqlite3_prepare_v2=Z.R)(a,b,c,d,e);f._sqlite3_step=a=>(f._sqlite3_step=Z.S)(a);f._sqlite3_reset=a=>(f._sqlite3_reset=Z.T)(a);f._sqlite3_exec=(a,b,c,d,e)=>(f._sqlite3_exec=Z.U)(a,b,c,d,e);f._sqlite3_finalize=a=>(f._sqlite3_finalize=Z.V)(a);f._sqlite3_column_name=(a,b)=>(f._sqlite3_column_name=Z.W)(a,b);f._sqlite3_column_text=(a,b)=>(f._sqlite3_column_text=Z.X)(a,b);f._sqlite3_column_type=(a,b)=>(f._sqlite3_column_type=Z.Y)(a,b);
f._sqlite3_errmsg=a=>(f._sqlite3_errmsg=Z.Z)(a);f._sqlite3_clear_bindings=a=>(f._sqlite3_clear_bindings=Z._)(a);f._sqlite3_value_blob=a=>(f._sqlite3_value_blob=Z.$)(a);f._sqlite3_value_bytes=a=>(f._sqlite3_value_bytes=Z.aa)(a);f._sqlite3_value_double=a=>(f._sqlite3_value_double=Z.ba)(a);f._sqlite3_value_int=a=>(f._sqlite3_value_int=Z.ca)(a);f._sqlite3_value_type=a=>(f._sqlite3_value_type=Z.da)(a);f._sqlite3_result_blob=(a,b,c,d)=>(f._sqlite3_result_blob=Z.ea)(a,b,c,d);
f._sqlite3_result_double=(a,b)=>(f._sqlite3_result_double=Z.fa)(a,b);f._sqlite3_result_error=(a,b,c)=>(f._sqlite3_result_error=Z.ga)(a,b,c);f._sqlite3_result_int=(a,b)=>(f._sqlite3_result_int=Z.ha)(a,b);f._sqlite3_result_int64=(a,b)=>(f._sqlite3_result_int64=Z.ia)(a,b);f._sqlite3_result_null=a=>(f._sqlite3_result_null=Z.ja)(a);f._sqlite3_result_text=(a,b,c,d)=>(f._sqlite3_result_text=Z.ka)(a,b,c,d);f._sqlite3_aggregate_context=(a,b)=>(f._sqlite3_aggregate_context=Z.la)(a,b);
f._sqlite3_column_count=a=>(f._sqlite3_column_count=Z.ma)(a);f._sqlite3_data_count=a=>(f._sqlite3_data_count=Z.na)(a);f._sqlite3_column_blob=(a,b)=>(f._sqlite3_column_blob=Z.oa)(a,b);f._sqlite3_column_bytes=(a,b)=>(f._sqlite3_column_bytes=Z.pa)(a,b);f._sqlite3_column_double=(a,b)=>(f._sqlite3_column_double=Z.qa)(a,b);f._sqlite3_bind_blob=(a,b,c,d,e)=>(f._sqlite3_bind_blob=Z.ra)(a,b,c,d,e);f._sqlite3_bind_double=(a,b,c)=>(f._sqlite3_bind_double=Z.sa)(a,b,c);
f._sqlite3_bind_int=(a,b,c)=>(f._sqlite3_bind_int=Z.ta)(a,b,c);f._sqlite3_bind_text=(a,b,c,d,e)=>(f._sqlite3_bind_text=Z.ua)(a,b,c,d,e);f._sqlite3_bind_parameter_index=(a,b)=>(f._sqlite3_bind_parameter_index=Z.va)(a,b);f._sqlite3_sql=a=>(f._sqlite3_sql=Z.wa)(a);f._sqlite3_normalized_sql=a=>(f._sqlite3_normalized_sql=Z.xa)(a);f._sqlite3_changes=a=>(f._sqlite3_changes=Z.ya)(a);f._sqlite3_close_v2=a=>(f._sqlite3_close_v2=Z.za)(a);
f._sqlite3_create_function_v2=(a,b,c,d,e,h,k,p,w)=>(f._sqlite3_create_function_v2=Z.Aa)(a,b,c,d,e,h,k,p,w);f._sqlite3_open=(a,b)=>(f._sqlite3_open=Z.Ba)(a,b);var ia=f._malloc=a=>(ia=f._malloc=Z.Ca)(a),fa=f._free=a=>(fa=f._free=Z.Da)(a);f._RegisterExtensionFunctions=a=>(f._RegisterExtensionFunctions=Z.Ea)(a);var Db=(a,b)=>(Db=Z.Fa)(a,b),Vc=(a,b)=>(Vc=Z.Ga)(a,b),wa=a=>(wa=Z.Ha)(a),y=a=>(y=Z.Ia)(a),sa=()=>(sa=Z.Ja)();f.stackSave=()=>sa();f.stackRestore=a=>wa(a);f.stackAlloc=a=>y(a);
f.cwrap=(a,b,c,d)=>{var e=!c||c.every(h=>"number"===h||"boolean"===h);return"string"!==b&&e&&!d?f["_"+a]:(...h)=>Sc(a,b,c,h)};f.addFunction=Ba;f.removeFunction=ya;f.UTF8ToString=va;f.ALLOC_NORMAL=ea;f.allocate=da;f.allocateUTF8OnStack=xa;
function Xc(){function a(){f.calledRun=!0;if(!Ma){if(!f.noFSInit&&!Ib){var b,c;Ib=!0;d??=f.stdin;b??=f.stdout;c??=f.stderr;d?U("stdin",d):Zb("/dev/tty","/dev/stdin");b?U("stdout",null,b):Zb("/dev/tty","/dev/stdout");c?U("stderr",null,c):Zb("/dev/tty1","/dev/stderr");oa("/dev/stdin",0);oa("/dev/stdout",1);oa("/dev/stderr",1)}Z.N();Jb=!1;f.onRuntimeInitialized?.();if(f.postRun)for("function"==typeof f.postRun&&(f.postRun=[f.postRun]);f.postRun.length;){var d=f.postRun.shift();ab.unshift(d)}$a(ab)}}
if(0<F)Ta=Xc;else{if(f.preRun)for("function"==typeof f.preRun&&(f.preRun=[f.preRun]);f.preRun.length;)cb();$a(bb);0<F?Ta=Xc:f.setStatus?(f.setStatus("Running..."),setTimeout(()=>{setTimeout(()=>f.setStatus(""),1);a()},1)):a()}}if(f.preInit)for("function"==typeof f.preInit&&(f.preInit=[f.preInit]);0<f.preInit.length;)f.preInit.pop()();Xc();


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
/* eslint-env worker */
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
    // eslint-disable-next-line global-require
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
