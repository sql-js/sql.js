
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

var e;e||(e=typeof Module !== 'undefined' ? Module : {});null;
e.onRuntimeInitialized=function(){function a(h,l){this.Qa=h;this.db=l;this.Oa=1;this.kb=[]}function b(h,l){this.db=l;l=aa(h)+1;this.cb=da(l);if(null===this.cb)throw Error("Unable to allocate memory for the SQL string");k(h,n,this.cb,l);this.ib=this.cb;this.Za=this.ob=null}function c(h){this.filename="dbfile_"+(4294967295*Math.random()>>>0);if(null!=h){var l=this.filename,q=l?r("//"+l):"/";l=ea(!0,!0);q=fa(q,(void 0!==l?l:438)&4095|32768,0);if(h){if("string"===typeof h){for(var p=Array(h.length),z=
0,N=h.length;z<N;++z)p[z]=h.charCodeAt(z);h=p}ha(q,l|146);p=ia(q,577);ka(p,h,0,h.length,0,void 0);la(p);ha(q,l)}}this.handleError(g(this.filename,d));this.db=v(d,"i32");hc(this.db);this.eb={};this.Wa={}}var d=x(4),f=e.cwrap,g=f("sqlite3_open","number",["string","number"]),m=f("sqlite3_close_v2","number",["number"]),t=f("sqlite3_exec","number",["number","string","number","number","number"]),w=f("sqlite3_changes","number",["number"]),u=f("sqlite3_prepare_v2","number",["number","string","number","number",
"number"]),C=f("sqlite3_sql","string",["number"]),I=f("sqlite3_normalized_sql","string",["number"]),ba=f("sqlite3_prepare_v2","number",["number","number","number","number","number"]),ic=f("sqlite3_bind_text","number",["number","number","number","number","number"]),qb=f("sqlite3_bind_blob","number",["number","number","number","number","number"]),jc=f("sqlite3_bind_double","number",["number","number","number"]),kc=f("sqlite3_bind_int","number",["number","number","number"]),lc=f("sqlite3_bind_parameter_index",
"number",["number","string"]),mc=f("sqlite3_step","number",["number"]),nc=f("sqlite3_errmsg","string",["number"]),oc=f("sqlite3_column_count","number",["number"]),pc=f("sqlite3_data_count","number",["number"]),qc=f("sqlite3_column_double","number",["number","number"]),rb=f("sqlite3_column_text","string",["number","number"]),rc=f("sqlite3_column_blob","number",["number","number"]),sc=f("sqlite3_column_bytes","number",["number","number"]),tc=f("sqlite3_column_type","number",["number","number"]),uc=
f("sqlite3_column_name","string",["number","number"]),vc=f("sqlite3_reset","number",["number"]),wc=f("sqlite3_clear_bindings","number",["number"]),xc=f("sqlite3_finalize","number",["number"]),yc=f("sqlite3_create_function_v2","number","number string number number number number number number number".split(" ")),zc=f("sqlite3_value_type","number",["number"]),Ac=f("sqlite3_value_bytes","number",["number"]),Bc=f("sqlite3_value_text","string",["number"]),Cc=f("sqlite3_value_blob","number",["number"]),
Dc=f("sqlite3_value_double","number",["number"]),Ec=f("sqlite3_result_double","",["number","number"]),sb=f("sqlite3_result_null","",["number"]),Fc=f("sqlite3_result_text","",["number","string","number","number"]),Gc=f("sqlite3_result_blob","",["number","number","number","number"]),Hc=f("sqlite3_result_int","",["number","number"]),tb=f("sqlite3_result_error","",["number","string","number"]),hc=f("RegisterExtensionFunctions","number",["number"]);a.prototype.bind=function(h){if(!this.Qa)throw"Statement closed";
this.reset();return Array.isArray(h)?this.Cb(h):null!=h&&"object"===typeof h?this.Db(h):!0};a.prototype.step=function(){if(!this.Qa)throw"Statement closed";this.Oa=1;var h=mc(this.Qa);switch(h){case 100:return!0;case 101:return!1;default:throw this.db.handleError(h);}};a.prototype.yb=function(h){null==h&&(h=this.Oa,this.Oa+=1);return qc(this.Qa,h)};a.prototype.Gb=function(h){null==h&&(h=this.Oa,this.Oa+=1);h=rb(this.Qa,h);if("function"!==typeof BigInt)throw Error("BigInt is not supported");return BigInt(h)};
a.prototype.Hb=function(h){null==h&&(h=this.Oa,this.Oa+=1);return rb(this.Qa,h)};a.prototype.getBlob=function(h){null==h&&(h=this.Oa,this.Oa+=1);var l=sc(this.Qa,h);h=rc(this.Qa,h);for(var q=new Uint8Array(l),p=0;p<l;p+=1)q[p]=y[h+p];return q};a.prototype.get=function(h,l){l=l||{};null!=h&&this.bind(h)&&this.step();h=[];for(var q=pc(this.Qa),p=0;p<q;p+=1)switch(tc(this.Qa,p)){case 1:var z=l.useBigInt?this.Gb(p):this.yb(p);h.push(z);break;case 2:h.push(this.yb(p));break;case 3:h.push(this.Hb(p));break;
case 4:h.push(this.getBlob(p));break;default:h.push(null)}return h};a.prototype.getColumnNames=function(){for(var h=[],l=oc(this.Qa),q=0;q<l;q+=1)h.push(uc(this.Qa,q));return h};a.prototype.getAsObject=function(h,l){h=this.get(h,l);l=this.getColumnNames();for(var q={},p=0;p<l.length;p+=1)q[l[p]]=h[p];return q};a.prototype.getSQL=function(){return C(this.Qa)};a.prototype.getNormalizedSQL=function(){return I(this.Qa)};a.prototype.run=function(h){null!=h&&this.bind(h);this.step();return this.reset()};
a.prototype.tb=function(h,l){null==l&&(l=this.Oa,this.Oa+=1);h=ma(h);var q=na(h);this.kb.push(q);this.db.handleError(ic(this.Qa,l,q,h.length-1,0))};a.prototype.Bb=function(h,l){null==l&&(l=this.Oa,this.Oa+=1);var q=na(h);this.kb.push(q);this.db.handleError(qb(this.Qa,l,q,h.length,0))};a.prototype.sb=function(h,l){null==l&&(l=this.Oa,this.Oa+=1);this.db.handleError((h===(h|0)?kc:jc)(this.Qa,l,h))};a.prototype.Eb=function(h){null==h&&(h=this.Oa,this.Oa+=1);qb(this.Qa,h,0,0,0)};a.prototype.ub=function(h,
l){null==l&&(l=this.Oa,this.Oa+=1);switch(typeof h){case "string":this.tb(h,l);return;case "number":this.sb(h,l);return;case "bigint":this.tb(h.toString(),l);return;case "boolean":this.sb(h+0,l);return;case "object":if(null===h){this.Eb(l);return}if(null!=h.length){this.Bb(h,l);return}}throw"Wrong API use : tried to bind a value of an unknown type ("+h+").";};a.prototype.Db=function(h){var l=this;Object.keys(h).forEach(function(q){var p=lc(l.Qa,q);0!==p&&l.ub(h[q],p)});return!0};a.prototype.Cb=function(h){for(var l=
0;l<h.length;l+=1)this.ub(h[l],l+1);return!0};a.prototype.reset=function(){this.freemem();return 0===wc(this.Qa)&&0===vc(this.Qa)};a.prototype.freemem=function(){for(var h;void 0!==(h=this.kb.pop());)oa(h)};a.prototype.free=function(){this.freemem();var h=0===xc(this.Qa);delete this.db.eb[this.Qa];this.Qa=0;return h};b.prototype.next=function(){if(null===this.cb)return{done:!0};null!==this.Za&&(this.Za.free(),this.Za=null);if(!this.db.db)throw this.mb(),Error("Database closed");var h=pa(),l=x(4);
qa(d);qa(l);try{this.db.handleError(ba(this.db.db,this.ib,-1,d,l));this.ib=v(l,"i32");var q=v(d,"i32");if(0===q)return this.mb(),{done:!0};this.Za=new a(q,this.db);this.db.eb[q]=this.Za;return{value:this.Za,done:!1}}catch(p){throw this.ob=A(this.ib),this.mb(),p;}finally{ra(h)}};b.prototype.mb=function(){oa(this.cb);this.cb=null};b.prototype.getRemainingSQL=function(){return null!==this.ob?this.ob:A(this.ib)};"function"===typeof Symbol&&"symbol"===typeof Symbol.iterator&&(b.prototype[Symbol.iterator]=
function(){return this});c.prototype.run=function(h,l){if(!this.db)throw"Database closed";if(l){h=this.prepare(h,l);try{h.step()}finally{h.free()}}else this.handleError(t(this.db,h,0,0,d));return this};c.prototype.exec=function(h,l,q){if(!this.db)throw"Database closed";var p=pa(),z=null;try{var N=aa(h)+1,G=x(N);k(h,y,G,N);var ja=G;var ca=x(4);for(h=[];0!==v(ja,"i8");){qa(d);qa(ca);this.handleError(ba(this.db,ja,-1,d,ca));var D=v(d,"i32");ja=v(ca,"i32");if(0!==D){N=null;z=new a(D,this);for(null!=l&&
z.bind(l);z.step();)null===N&&(N={columns:z.getColumnNames(),values:[]},h.push(N)),N.values.push(z.get(null,q));z.free()}}return h}catch(O){throw z&&z.free(),O;}finally{ra(p)}};c.prototype.each=function(h,l,q,p,z){"function"===typeof l&&(p=q,q=l,l=void 0);h=this.prepare(h,l);try{for(;h.step();)q(h.getAsObject(null,z))}finally{h.free()}if("function"===typeof p)return p()};c.prototype.prepare=function(h,l){qa(d);this.handleError(u(this.db,h,-1,d,0));h=v(d,"i32");if(0===h)throw"Nothing to prepare";var q=
new a(h,this);null!=l&&q.bind(l);return this.eb[h]=q};c.prototype.iterateStatements=function(h){return new b(h,this)};c.prototype["export"]=function(){Object.values(this.eb).forEach(function(l){l.free()});Object.values(this.Wa).forEach(sa);this.Wa={};this.handleError(m(this.db));var h=ta(this.filename);this.handleError(g(this.filename,d));this.db=v(d,"i32");return h};c.prototype.close=function(){null!==this.db&&(Object.values(this.eb).forEach(function(h){h.free()}),Object.values(this.Wa).forEach(sa),
this.Wa={},this.handleError(m(this.db)),ua("/"+this.filename),this.db=null)};c.prototype.handleError=function(h){if(0===h)return null;h=nc(this.db);throw Error(h);};c.prototype.getRowsModified=function(){return w(this.db)};c.prototype.create_function=function(h,l){Object.prototype.hasOwnProperty.call(this.Wa,h)&&(sa(this.Wa[h]),delete this.Wa[h]);var q=va(function(p,z,N){for(var G,ja=[],ca=0;ca<z;ca+=1){var D=v(N+4*ca,"i32"),O=zc(D);if(1===O||2===O)D=Dc(D);else if(3===O)D=Bc(D);else if(4===O){O=D;
D=Ac(O);O=Cc(O);for(var wb=new Uint8Array(D),Aa=0;Aa<D;Aa+=1)wb[Aa]=y[O+Aa];D=wb}else D=null;ja.push(D)}try{G=l.apply(null,ja)}catch(Kc){tb(p,Kc,-1);return}switch(typeof G){case "boolean":Hc(p,G?1:0);break;case "number":Ec(p,G);break;case "string":Fc(p,G,-1,-1);break;case "object":null===G?sb(p):null!=G.length?(z=na(G),Gc(p,z,G.length,-1),oa(z)):tb(p,"Wrong API use : tried to return a value of an unknown type ("+G+").",-1);break;default:sb(p)}});this.Wa[h]=q;this.handleError(yc(this.db,h,l.length,
1,0,q,0,0,0));return this};e.Database=c};var wa={},B;for(B in e)e.hasOwnProperty(B)&&(wa[B]=e[B]);var xa="./this.program",ya="object"===typeof window,za="function"===typeof importScripts,Ba="object"===typeof process&&"object"===typeof process.versions&&"string"===typeof process.versions.node,E="",Ca,Da,Ea,Fa,Ga;
if(Ba)E=za?require("path").dirname(E)+"/":__dirname+"/",Ca=function(a,b){Fa||(Fa=require("fs"));Ga||(Ga=require("path"));a=Ga.normalize(a);return Fa.readFileSync(a,b?null:"utf8")},Ea=function(a){a=Ca(a,!0);a.buffer||(a=new Uint8Array(a));a.buffer||F("Assertion failed: undefined");return a},Da=function(a,b,c){Fa||(Fa=require("fs"));Ga||(Ga=require("path"));a=Ga.normalize(a);Fa.readFile(a,function(d,f){d?c(d):b(f.buffer)})},1<process.argv.length&&(xa=process.argv[1].replace(/\\/g,"/")),process.argv.slice(2),
"undefined"!==typeof module&&(module.exports=e),e.inspect=function(){return"[Emscripten Module object]"};else if(ya||za)za?E=self.location.href:"undefined"!==typeof document&&document.currentScript&&(E=document.currentScript.src),E=0!==E.indexOf("blob:")?E.substr(0,E.lastIndexOf("/")+1):"",Ca=function(a){var b=new XMLHttpRequest;b.open("GET",a,!1);b.send(null);return b.responseText},za&&(Ea=function(a){var b=new XMLHttpRequest;b.open("GET",a,!1);b.responseType="arraybuffer";b.send(null);return new Uint8Array(b.response)}),
Da=function(a,b,c){var d=new XMLHttpRequest;d.open("GET",a,!0);d.responseType="arraybuffer";d.onload=function(){200==d.status||0==d.status&&d.response?b(d.response):c()};d.onerror=c;d.send(null)};var Ha=e.print||console.log.bind(console),H=e.printErr||console.warn.bind(console);for(B in wa)wa.hasOwnProperty(B)&&(e[B]=wa[B]);wa=null;e.thisProgram&&(xa=e.thisProgram);var Ia=[],Ja;function sa(a){Ja.delete(J.get(a));Ia.push(a)}
function va(a){if(!Ja){Ja=new WeakMap;for(var b=0;b<J.length;b++){var c=J.get(b);c&&Ja.set(c,b)}}if(Ja.has(a))a=Ja.get(a);else{if(Ia.length)b=Ia.pop();else{try{J.grow(1)}catch(g){if(!(g instanceof RangeError))throw g;throw"Unable to grow wasm table. Set ALLOW_TABLE_GROWTH.";}b=J.length-1}try{J.set(b,a)}catch(g){if(!(g instanceof TypeError))throw g;if("function"===typeof WebAssembly.Function){var d={i:"i32",j:"i64",f:"f32",d:"f64"},f={parameters:[],results:[]};for(c=1;4>c;++c)f.parameters.push(d["viii"[c]]);
c=new WebAssembly.Function(f,a)}else{d=[1,0,1,96];f={i:127,j:126,f:125,d:124};d.push(3);for(c=0;3>c;++c)d.push(f["iii"[c]]);d.push(0);d[1]=d.length-2;c=new Uint8Array([0,97,115,109,1,0,0,0].concat(d,[2,7,1,1,101,1,102,0,0,7,5,1,1,102,0,0]));c=new WebAssembly.Module(c);c=(new WebAssembly.Instance(c,{e:{f:a}})).exports.f}J.set(b,c)}Ja.set(a,b);a=b}return a}var Ka;e.wasmBinary&&(Ka=e.wasmBinary);var noExitRuntime=e.noExitRuntime||!0;"object"!==typeof WebAssembly&&F("no native wasm support detected");
function qa(a){var b="i32";"*"===b.charAt(b.length-1)&&(b="i32");switch(b){case "i1":y[a>>0]=0;break;case "i8":y[a>>0]=0;break;case "i16":La[a>>1]=0;break;case "i32":K[a>>2]=0;break;case "i64":L=[0,(M=0,1<=+Math.abs(M)?0<M?(Math.min(+Math.floor(M/4294967296),4294967295)|0)>>>0:~~+Math.ceil((M-+(~~M>>>0))/4294967296)>>>0:0)];K[a>>2]=L[0];K[a+4>>2]=L[1];break;case "float":Ma[a>>2]=0;break;case "double":Na[a>>3]=0;break;default:F("invalid type for setValue: "+b)}}
function v(a,b){b=b||"i8";"*"===b.charAt(b.length-1)&&(b="i32");switch(b){case "i1":return y[a>>0];case "i8":return y[a>>0];case "i16":return La[a>>1];case "i32":return K[a>>2];case "i64":return K[a>>2];case "float":return Ma[a>>2];case "double":return Na[a>>3];default:F("invalid type for getValue: "+b)}return null}var Oa,Pa=!1;function Qa(a){var b=e["_"+a];b||F("Assertion failed: Cannot call unknown function "+(a+", make sure it is exported"));return b}
function Ra(a,b,c,d){var f={string:function(u){var C=0;if(null!==u&&void 0!==u&&0!==u){var I=(u.length<<2)+1;C=x(I);k(u,n,C,I)}return C},array:function(u){var C=x(u.length);y.set(u,C);return C}};a=Qa(a);var g=[],m=0;if(d)for(var t=0;t<d.length;t++){var w=f[c[t]];w?(0===m&&(m=pa()),g[t]=w(d[t])):g[t]=d[t]}c=a.apply(null,g);return c=function(u){0!==m&&ra(m);return"string"===b?A(u):"boolean"===b?!!u:u}(c)}var Sa=0,Ta=1;
function na(a){var b=Sa==Ta?x(a.length):da(a.length);a.subarray||a.slice?n.set(a,b):n.set(new Uint8Array(a),b);return b}var Ua="undefined"!==typeof TextDecoder?new TextDecoder("utf8"):void 0;
function Va(a,b,c){var d=b+c;for(c=b;a[c]&&!(c>=d);)++c;if(16<c-b&&a.subarray&&Ua)return Ua.decode(a.subarray(b,c));for(d="";b<c;){var f=a[b++];if(f&128){var g=a[b++]&63;if(192==(f&224))d+=String.fromCharCode((f&31)<<6|g);else{var m=a[b++]&63;f=224==(f&240)?(f&15)<<12|g<<6|m:(f&7)<<18|g<<12|m<<6|a[b++]&63;65536>f?d+=String.fromCharCode(f):(f-=65536,d+=String.fromCharCode(55296|f>>10,56320|f&1023))}}else d+=String.fromCharCode(f)}return d}function A(a,b){return a?Va(n,a,b):""}
function k(a,b,c,d){if(!(0<d))return 0;var f=c;d=c+d-1;for(var g=0;g<a.length;++g){var m=a.charCodeAt(g);if(55296<=m&&57343>=m){var t=a.charCodeAt(++g);m=65536+((m&1023)<<10)|t&1023}if(127>=m){if(c>=d)break;b[c++]=m}else{if(2047>=m){if(c+1>=d)break;b[c++]=192|m>>6}else{if(65535>=m){if(c+2>=d)break;b[c++]=224|m>>12}else{if(c+3>=d)break;b[c++]=240|m>>18;b[c++]=128|m>>12&63}b[c++]=128|m>>6&63}b[c++]=128|m&63}}b[c]=0;return c-f}
function aa(a){for(var b=0,c=0;c<a.length;++c){var d=a.charCodeAt(c);55296<=d&&57343>=d&&(d=65536+((d&1023)<<10)|a.charCodeAt(++c)&1023);127>=d?++b:b=2047>=d?b+2:65535>=d?b+3:b+4}return b}function Wa(a){var b=aa(a)+1,c=da(b);c&&k(a,y,c,b);return c}var Xa,y,n,La,K,Ma,Na;
function Ya(){var a=Oa.buffer;Xa=a;e.HEAP8=y=new Int8Array(a);e.HEAP16=La=new Int16Array(a);e.HEAP32=K=new Int32Array(a);e.HEAPU8=n=new Uint8Array(a);e.HEAPU16=new Uint16Array(a);e.HEAPU32=new Uint32Array(a);e.HEAPF32=Ma=new Float32Array(a);e.HEAPF64=Na=new Float64Array(a)}var J,Za=[],$a=[],ab=[];function bb(){var a=e.preRun.shift();Za.unshift(a)}var cb=0,db=null,eb=null;e.preloadedImages={};e.preloadedAudios={};
function F(a){if(e.onAbort)e.onAbort(a);H(a);Pa=!0;throw new WebAssembly.RuntimeError("abort("+a+"). Build with -s ASSERTIONS=1 for more info.");}function fb(){return P.startsWith("data:application/octet-stream;base64,")}var P;P="sql-wasm.wasm";if(!fb()){var gb=P;P=e.locateFile?e.locateFile(gb,E):E+gb}function hb(){var a=P;try{if(a==P&&Ka)return new Uint8Array(Ka);if(Ea)return Ea(a);throw"both async and sync fetching of the wasm failed";}catch(b){F(b)}}
function ib(){if(!Ka&&(ya||za)){if("function"===typeof fetch&&!P.startsWith("file://"))return fetch(P,{credentials:"same-origin"}).then(function(a){if(!a.ok)throw"failed to load wasm binary file at '"+P+"'";return a.arrayBuffer()}).catch(function(){return hb()});if(Da)return new Promise(function(a,b){Da(P,function(c){a(new Uint8Array(c))},b)})}return Promise.resolve().then(function(){return hb()})}var M,L;
function jb(a){for(;0<a.length;){var b=a.shift();if("function"==typeof b)b(e);else{var c=b.Qb;"number"===typeof c?void 0===b.lb?J.get(c)():J.get(c)(b.lb):c(void 0===b.lb?null:b.lb)}}}function kb(a){return a.replace(/\b_Z[\w\d_]+/g,function(b){return b===b?b:b+" ["+b+"]"})}
function lb(){function a(m){return(m=m.toTimeString().match(/\(([A-Za-z ]+)\)$/))?m[1]:"GMT"}var b=(new Date).getFullYear(),c=new Date(b,0,1),d=new Date(b,6,1);b=c.getTimezoneOffset();var f=d.getTimezoneOffset(),g=Math.max(b,f);K[mb()>>2]=60*g;K[nb()>>2]=Number(b!=f);c=a(c);d=a(d);c=Wa(c);d=Wa(d);f<b?(K[ob()>>2]=c,K[ob()+4>>2]=d):(K[ob()>>2]=d,K[ob()+4>>2]=c)}var pb;
function ub(a,b){for(var c=0,d=a.length-1;0<=d;d--){var f=a[d];"."===f?a.splice(d,1):".."===f?(a.splice(d,1),c++):c&&(a.splice(d,1),c--)}if(b)for(;c;c--)a.unshift("..");return a}function r(a){var b="/"===a.charAt(0),c="/"===a.substr(-1);(a=ub(a.split("/").filter(function(d){return!!d}),!b).join("/"))||b||(a=".");a&&c&&(a+="/");return(b?"/":"")+a}
function vb(a){var b=/^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/.exec(a).slice(1);a=b[0];b=b[1];if(!a&&!b)return".";b&&(b=b.substr(0,b.length-1));return a+b}function xb(a){if("/"===a)return"/";a=r(a);a=a.replace(/\/$/,"");var b=a.lastIndexOf("/");return-1===b?a:a.substr(b+1)}
function yb(){if("object"===typeof crypto&&"function"===typeof crypto.getRandomValues){var a=new Uint8Array(1);return function(){crypto.getRandomValues(a);return a[0]}}if(Ba)try{var b=require("crypto");return function(){return b.randomBytes(1)[0]}}catch(c){}return function(){F("randomDevice")}}
function zb(){for(var a="",b=!1,c=arguments.length-1;-1<=c&&!b;c--){b=0<=c?arguments[c]:"/";if("string"!==typeof b)throw new TypeError("Arguments to path.resolve must be strings");if(!b)return"";a=b+"/"+a;b="/"===b.charAt(0)}a=ub(a.split("/").filter(function(d){return!!d}),!b).join("/");return(b?"/":"")+a||"."}var Ab=[];function Bb(a,b){Ab[a]={input:[],output:[],bb:b};Cb(a,Db)}
var Db={open:function(a){var b=Ab[a.node.rdev];if(!b)throw new Q(43);a.tty=b;a.seekable=!1},close:function(a){a.tty.bb.flush(a.tty)},flush:function(a){a.tty.bb.flush(a.tty)},read:function(a,b,c,d){if(!a.tty||!a.tty.bb.zb)throw new Q(60);for(var f=0,g=0;g<d;g++){try{var m=a.tty.bb.zb(a.tty)}catch(t){throw new Q(29);}if(void 0===m&&0===f)throw new Q(6);if(null===m||void 0===m)break;f++;b[c+g]=m}f&&(a.node.timestamp=Date.now());return f},write:function(a,b,c,d){if(!a.tty||!a.tty.bb.pb)throw new Q(60);
try{for(var f=0;f<d;f++)a.tty.bb.pb(a.tty,b[c+f])}catch(g){throw new Q(29);}d&&(a.node.timestamp=Date.now());return f}},Eb={zb:function(a){if(!a.input.length){var b=null;if(Ba){var c=Buffer.alloc(256),d=0;try{d=Fa.readSync(process.stdin.fd,c,0,256,null)}catch(f){if(f.toString().includes("EOF"))d=0;else throw f;}0<d?b=c.slice(0,d).toString("utf-8"):b=null}else"undefined"!=typeof window&&"function"==typeof window.prompt?(b=window.prompt("Input: "),null!==b&&(b+="\n")):"function"==typeof readline&&(b=
readline(),null!==b&&(b+="\n"));if(!b)return null;a.input=ma(b,!0)}return a.input.shift()},pb:function(a,b){null===b||10===b?(Ha(Va(a.output,0)),a.output=[]):0!=b&&a.output.push(b)},flush:function(a){a.output&&0<a.output.length&&(Ha(Va(a.output,0)),a.output=[])}},Fb={pb:function(a,b){null===b||10===b?(H(Va(a.output,0)),a.output=[]):0!=b&&a.output.push(b)},flush:function(a){a.output&&0<a.output.length&&(H(Va(a.output,0)),a.output=[])}};
function Gb(a){a=65536*Math.ceil(a/65536);var b=Hb(65536,a);if(!b)return 0;n.fill(0,b,b+a);return b}
var R={Ua:null,Va:function(){return R.createNode(null,"/",16895,0)},createNode:function(a,b,c,d){if(24576===(c&61440)||4096===(c&61440))throw new Q(63);R.Ua||(R.Ua={dir:{node:{Ta:R.La.Ta,Sa:R.La.Sa,lookup:R.La.lookup,fb:R.La.fb,rename:R.La.rename,unlink:R.La.unlink,rmdir:R.La.rmdir,readdir:R.La.readdir,symlink:R.La.symlink},stream:{Ya:R.Ma.Ya}},file:{node:{Ta:R.La.Ta,Sa:R.La.Sa},stream:{Ya:R.Ma.Ya,read:R.Ma.read,write:R.Ma.write,rb:R.Ma.rb,gb:R.Ma.gb,hb:R.Ma.hb}},link:{node:{Ta:R.La.Ta,Sa:R.La.Sa,
readlink:R.La.readlink},stream:{}},vb:{node:{Ta:R.La.Ta,Sa:R.La.Sa},stream:Ib}});c=Jb(a,b,c,d);S(c.mode)?(c.La=R.Ua.dir.node,c.Ma=R.Ua.dir.stream,c.Na={}):32768===(c.mode&61440)?(c.La=R.Ua.file.node,c.Ma=R.Ua.file.stream,c.Ra=0,c.Na=null):40960===(c.mode&61440)?(c.La=R.Ua.link.node,c.Ma=R.Ua.link.stream):8192===(c.mode&61440)&&(c.La=R.Ua.vb.node,c.Ma=R.Ua.vb.stream);c.timestamp=Date.now();a&&(a.Na[b]=c,a.timestamp=c.timestamp);return c},Rb:function(a){return a.Na?a.Na.subarray?a.Na.subarray(0,a.Ra):
new Uint8Array(a.Na):new Uint8Array(0)},wb:function(a,b){var c=a.Na?a.Na.length:0;c>=b||(b=Math.max(b,c*(1048576>c?2:1.125)>>>0),0!=c&&(b=Math.max(b,256)),c=a.Na,a.Na=new Uint8Array(b),0<a.Ra&&a.Na.set(c.subarray(0,a.Ra),0))},Nb:function(a,b){if(a.Ra!=b)if(0==b)a.Na=null,a.Ra=0;else{var c=a.Na;a.Na=new Uint8Array(b);c&&a.Na.set(c.subarray(0,Math.min(b,a.Ra)));a.Ra=b}},La:{Ta:function(a){var b={};b.dev=8192===(a.mode&61440)?a.id:1;b.ino=a.id;b.mode=a.mode;b.nlink=1;b.uid=0;b.gid=0;b.rdev=a.rdev;S(a.mode)?
b.size=4096:32768===(a.mode&61440)?b.size=a.Ra:40960===(a.mode&61440)?b.size=a.link.length:b.size=0;b.atime=new Date(a.timestamp);b.mtime=new Date(a.timestamp);b.ctime=new Date(a.timestamp);b.Fb=4096;b.blocks=Math.ceil(b.size/b.Fb);return b},Sa:function(a,b){void 0!==b.mode&&(a.mode=b.mode);void 0!==b.timestamp&&(a.timestamp=b.timestamp);void 0!==b.size&&R.Nb(a,b.size)},lookup:function(){throw Kb[44];},fb:function(a,b,c,d){return R.createNode(a,b,c,d)},rename:function(a,b,c){if(S(a.mode)){try{var d=
Lb(b,c)}catch(g){}if(d)for(var f in d.Na)throw new Q(55);}delete a.parent.Na[a.name];a.parent.timestamp=Date.now();a.name=c;b.Na[c]=a;b.timestamp=a.parent.timestamp;a.parent=b},unlink:function(a,b){delete a.Na[b];a.timestamp=Date.now()},rmdir:function(a,b){var c=Lb(a,b),d;for(d in c.Na)throw new Q(55);delete a.Na[b];a.timestamp=Date.now()},readdir:function(a){var b=[".",".."],c;for(c in a.Na)a.Na.hasOwnProperty(c)&&b.push(c);return b},symlink:function(a,b,c){a=R.createNode(a,b,41471,0);a.link=c;return a},
readlink:function(a){if(40960!==(a.mode&61440))throw new Q(28);return a.link}},Ma:{read:function(a,b,c,d,f){var g=a.node.Na;if(f>=a.node.Ra)return 0;a=Math.min(a.node.Ra-f,d);if(8<a&&g.subarray)b.set(g.subarray(f,f+a),c);else for(d=0;d<a;d++)b[c+d]=g[f+d];return a},write:function(a,b,c,d,f,g){b.buffer===y.buffer&&(g=!1);if(!d)return 0;a=a.node;a.timestamp=Date.now();if(b.subarray&&(!a.Na||a.Na.subarray)){if(g)return a.Na=b.subarray(c,c+d),a.Ra=d;if(0===a.Ra&&0===f)return a.Na=b.slice(c,c+d),a.Ra=
d;if(f+d<=a.Ra)return a.Na.set(b.subarray(c,c+d),f),d}R.wb(a,f+d);if(a.Na.subarray&&b.subarray)a.Na.set(b.subarray(c,c+d),f);else for(g=0;g<d;g++)a.Na[f+g]=b[c+g];a.Ra=Math.max(a.Ra,f+d);return d},Ya:function(a,b,c){1===c?b+=a.position:2===c&&32768===(a.node.mode&61440)&&(b+=a.node.Ra);if(0>b)throw new Q(28);return b},rb:function(a,b,c){R.wb(a.node,b+c);a.node.Ra=Math.max(a.node.Ra,b+c)},gb:function(a,b,c,d,f,g){if(0!==b)throw new Q(28);if(32768!==(a.node.mode&61440))throw new Q(43);a=a.node.Na;if(g&
2||a.buffer!==Xa){if(0<d||d+c<a.length)a.subarray?a=a.subarray(d,d+c):a=Array.prototype.slice.call(a,d,d+c);d=!0;c=Gb(c);if(!c)throw new Q(48);y.set(a,c)}else d=!1,c=a.byteOffset;return{Mb:c,jb:d}},hb:function(a,b,c,d,f){if(32768!==(a.node.mode&61440))throw new Q(43);if(f&2)return 0;R.Ma.write(a,b,0,d,c,!1);return 0}}},Mb=null,Nb={},T=[],Ob=1,U=null,Pb=!0,V={},Q=null,Kb={};
function W(a,b){a=zb("/",a);b=b||{};if(!a)return{path:"",node:null};var c={xb:!0,qb:0},d;for(d in c)void 0===b[d]&&(b[d]=c[d]);if(8<b.qb)throw new Q(32);a=ub(a.split("/").filter(function(m){return!!m}),!1);var f=Mb;c="/";for(d=0;d<a.length;d++){var g=d===a.length-1;if(g&&b.parent)break;f=Lb(f,a[d]);c=r(c+"/"+a[d]);f.$a&&(!g||g&&b.xb)&&(f=f.$a.root);if(!g||b.Xa)for(g=0;40960===(f.mode&61440);)if(f=Qb(c),c=zb(vb(c),f),f=W(c,{qb:b.qb}).node,40<g++)throw new Q(32);}return{path:c,node:f}}
function Rb(a){for(var b;;){if(a===a.parent)return a=a.Va.Ab,b?"/"!==a[a.length-1]?a+"/"+b:a+b:a;b=b?a.name+"/"+b:a.name;a=a.parent}}function Sb(a,b){for(var c=0,d=0;d<b.length;d++)c=(c<<5)-c+b.charCodeAt(d)|0;return(a+c>>>0)%U.length}function Tb(a){var b=Sb(a.parent.id,a.name);if(U[b]===a)U[b]=a.ab;else for(b=U[b];b;){if(b.ab===a){b.ab=a.ab;break}b=b.ab}}
function Lb(a,b){var c;if(c=(c=Ub(a,"x"))?c:a.La.lookup?0:2)throw new Q(c,a);for(c=U[Sb(a.id,b)];c;c=c.ab){var d=c.name;if(c.parent.id===a.id&&d===b)return c}return a.La.lookup(a,b)}function Jb(a,b,c,d){a=new Vb(a,b,c,d);b=Sb(a.parent.id,a.name);a.ab=U[b];return U[b]=a}function S(a){return 16384===(a&61440)}var Wb={r:0,"r+":2,w:577,"w+":578,a:1089,"a+":1090};function Xb(a){var b=["r","w","rw"][a&3];a&512&&(b+="w");return b}
function Ub(a,b){if(Pb)return 0;if(!b.includes("r")||a.mode&292){if(b.includes("w")&&!(a.mode&146)||b.includes("x")&&!(a.mode&73))return 2}else return 2;return 0}function Yb(a,b){try{return Lb(a,b),20}catch(c){}return Ub(a,"wx")}function Zb(a,b,c){try{var d=Lb(a,b)}catch(f){return f.Pa}if(a=Ub(a,"wx"))return a;if(c){if(!S(d.mode))return 54;if(d===d.parent||"/"===Rb(d))return 10}else if(S(d.mode))return 31;return 0}function $b(a){var b=4096;for(a=a||0;a<=b;a++)if(!T[a])return a;throw new Q(33);}
function ac(a,b){bc||(bc=function(){},bc.prototype={});var c=new bc,d;for(d in a)c[d]=a[d];a=c;b=$b(b);a.fd=b;return T[b]=a}var Ib={open:function(a){a.Ma=Nb[a.node.rdev].Ma;a.Ma.open&&a.Ma.open(a)},Ya:function(){throw new Q(70);}};function Cb(a,b){Nb[a]={Ma:b}}
function cc(a,b){var c="/"===b,d=!b;if(c&&Mb)throw new Q(10);if(!c&&!d){var f=W(b,{xb:!1});b=f.path;f=f.node;if(f.$a)throw new Q(10);if(!S(f.mode))throw new Q(54);}b={type:a,Sb:{},Ab:b,Kb:[]};a=a.Va(b);a.Va=b;b.root=a;c?Mb=a:f&&(f.$a=b,f.Va&&f.Va.Kb.push(b))}function fa(a,b,c){var d=W(a,{parent:!0}).node;a=xb(a);if(!a||"."===a||".."===a)throw new Q(28);var f=Yb(d,a);if(f)throw new Q(f);if(!d.La.fb)throw new Q(63);return d.La.fb(d,a,b,c)}
function X(a,b){return fa(a,(void 0!==b?b:511)&1023|16384,0)}function dc(a,b,c){"undefined"===typeof c&&(c=b,b=438);fa(a,b|8192,c)}function ec(a,b){if(!zb(a))throw new Q(44);var c=W(b,{parent:!0}).node;if(!c)throw new Q(44);b=xb(b);var d=Yb(c,b);if(d)throw new Q(d);if(!c.La.symlink)throw new Q(63);c.La.symlink(c,b,a)}
function ua(a){var b=W(a,{parent:!0}).node,c=xb(a),d=Lb(b,c),f=Zb(b,c,!1);if(f)throw new Q(f);if(!b.La.unlink)throw new Q(63);if(d.$a)throw new Q(10);try{V.willDeletePath&&V.willDeletePath(a)}catch(g){H("FS.trackingDelegate['willDeletePath']('"+a+"') threw an exception: "+g.message)}b.La.unlink(b,c);Tb(d);try{if(V.onDeletePath)V.onDeletePath(a)}catch(g){H("FS.trackingDelegate['onDeletePath']('"+a+"') threw an exception: "+g.message)}}
function Qb(a){a=W(a).node;if(!a)throw new Q(44);if(!a.La.readlink)throw new Q(28);return zb(Rb(a.parent),a.La.readlink(a))}function fc(a,b){a=W(a,{Xa:!b}).node;if(!a)throw new Q(44);if(!a.La.Ta)throw new Q(63);return a.La.Ta(a)}function gc(a){return fc(a,!0)}function ha(a,b){a="string"===typeof a?W(a,{Xa:!0}).node:a;if(!a.La.Sa)throw new Q(63);a.La.Sa(a,{mode:b&4095|a.mode&-4096,timestamp:Date.now()})}
function Ic(a){a="string"===typeof a?W(a,{Xa:!0}).node:a;if(!a.La.Sa)throw new Q(63);a.La.Sa(a,{timestamp:Date.now()})}function Jc(a,b){if(0>b)throw new Q(28);a="string"===typeof a?W(a,{Xa:!0}).node:a;if(!a.La.Sa)throw new Q(63);if(S(a.mode))throw new Q(31);if(32768!==(a.mode&61440))throw new Q(28);var c=Ub(a,"w");if(c)throw new Q(c);a.La.Sa(a,{size:b,timestamp:Date.now()})}
function ia(a,b,c,d){if(""===a)throw new Q(44);if("string"===typeof b){var f=Wb[b];if("undefined"===typeof f)throw Error("Unknown file open mode: "+b);b=f}c=b&64?("undefined"===typeof c?438:c)&4095|32768:0;if("object"===typeof a)var g=a;else{a=r(a);try{g=W(a,{Xa:!(b&131072)}).node}catch(m){}}f=!1;if(b&64)if(g){if(b&128)throw new Q(20);}else g=fa(a,c,0),f=!0;if(!g)throw new Q(44);8192===(g.mode&61440)&&(b&=-513);if(b&65536&&!S(g.mode))throw new Q(54);if(!f&&(c=g?40960===(g.mode&61440)?32:S(g.mode)&&
("r"!==Xb(b)||b&512)?31:Ub(g,Xb(b)):44))throw new Q(c);b&512&&Jc(g,0);b&=-131713;d=ac({node:g,path:Rb(g),flags:b,seekable:!0,position:0,Ma:g.Ma,Pb:[],error:!1},d);d.Ma.open&&d.Ma.open(d);!e.logReadFiles||b&1||(Lc||(Lc={}),a in Lc||(Lc[a]=1,H("FS.trackingDelegate error on read file: "+a)));try{V.onOpenFile&&(g=0,1!==(b&2097155)&&(g|=1),0!==(b&2097155)&&(g|=2),V.onOpenFile(a,g))}catch(m){H("FS.trackingDelegate['onOpenFile']('"+a+"', flags) threw an exception: "+m.message)}return d}
function la(a){if(null===a.fd)throw new Q(8);a.nb&&(a.nb=null);try{a.Ma.close&&a.Ma.close(a)}catch(b){throw b;}finally{T[a.fd]=null}a.fd=null}function Mc(a,b,c){if(null===a.fd)throw new Q(8);if(!a.seekable||!a.Ma.Ya)throw new Q(70);if(0!=c&&1!=c&&2!=c)throw new Q(28);a.position=a.Ma.Ya(a,b,c);a.Pb=[]}
function Nc(a,b,c,d,f){if(0>d||0>f)throw new Q(28);if(null===a.fd)throw new Q(8);if(1===(a.flags&2097155))throw new Q(8);if(S(a.node.mode))throw new Q(31);if(!a.Ma.read)throw new Q(28);var g="undefined"!==typeof f;if(!g)f=a.position;else if(!a.seekable)throw new Q(70);b=a.Ma.read(a,b,c,d,f);g||(a.position+=b);return b}
function ka(a,b,c,d,f,g){if(0>d||0>f)throw new Q(28);if(null===a.fd)throw new Q(8);if(0===(a.flags&2097155))throw new Q(8);if(S(a.node.mode))throw new Q(31);if(!a.Ma.write)throw new Q(28);a.seekable&&a.flags&1024&&Mc(a,0,2);var m="undefined"!==typeof f;if(!m)f=a.position;else if(!a.seekable)throw new Q(70);b=a.Ma.write(a,b,c,d,f,g);m||(a.position+=b);try{if(a.path&&V.onWriteToFile)V.onWriteToFile(a.path)}catch(t){H("FS.trackingDelegate['onWriteToFile']('"+a.path+"') threw an exception: "+t.message)}return b}
function ta(a){var b={encoding:"binary"};b=b||{};b.flags=b.flags||0;b.encoding=b.encoding||"binary";if("utf8"!==b.encoding&&"binary"!==b.encoding)throw Error('Invalid encoding type "'+b.encoding+'"');var c,d=ia(a,b.flags);a=fc(a).size;var f=new Uint8Array(a);Nc(d,f,0,a,0);"utf8"===b.encoding?c=Va(f,0):"binary"===b.encoding&&(c=f);la(d);return c}
function Oc(){Q||(Q=function(a,b){this.node=b;this.Ob=function(c){this.Pa=c};this.Ob(a);this.message="FS error"},Q.prototype=Error(),Q.prototype.constructor=Q,[44].forEach(function(a){Kb[a]=new Q(a);Kb[a].stack="<generic error, no stack>"}))}var Pc;function ea(a,b){var c=0;a&&(c|=365);b&&(c|=146);return c}
function Qc(a,b,c){a=r("/dev/"+a);var d=ea(!!b,!!c);Rc||(Rc=64);var f=Rc++<<8|0;Cb(f,{open:function(g){g.seekable=!1},close:function(){c&&c.buffer&&c.buffer.length&&c(10)},read:function(g,m,t,w){for(var u=0,C=0;C<w;C++){try{var I=b()}catch(ba){throw new Q(29);}if(void 0===I&&0===u)throw new Q(6);if(null===I||void 0===I)break;u++;m[t+C]=I}u&&(g.node.timestamp=Date.now());return u},write:function(g,m,t,w){for(var u=0;u<w;u++)try{c(m[t+u])}catch(C){throw new Q(29);}w&&(g.node.timestamp=Date.now());return u}});
dc(a,d,f)}var Rc,Y={},bc,Lc,Sc={};
function Tc(a,b,c){try{var d=a(b)}catch(f){if(f&&f.node&&r(b)!==r(Rb(f.node)))return-54;throw f;}K[c>>2]=d.dev;K[c+4>>2]=0;K[c+8>>2]=d.ino;K[c+12>>2]=d.mode;K[c+16>>2]=d.nlink;K[c+20>>2]=d.uid;K[c+24>>2]=d.gid;K[c+28>>2]=d.rdev;K[c+32>>2]=0;L=[d.size>>>0,(M=d.size,1<=+Math.abs(M)?0<M?(Math.min(+Math.floor(M/4294967296),4294967295)|0)>>>0:~~+Math.ceil((M-+(~~M>>>0))/4294967296)>>>0:0)];K[c+40>>2]=L[0];K[c+44>>2]=L[1];K[c+48>>2]=4096;K[c+52>>2]=d.blocks;K[c+56>>2]=d.atime.getTime()/1E3|0;K[c+60>>2]=
0;K[c+64>>2]=d.mtime.getTime()/1E3|0;K[c+68>>2]=0;K[c+72>>2]=d.ctime.getTime()/1E3|0;K[c+76>>2]=0;L=[d.ino>>>0,(M=d.ino,1<=+Math.abs(M)?0<M?(Math.min(+Math.floor(M/4294967296),4294967295)|0)>>>0:~~+Math.ceil((M-+(~~M>>>0))/4294967296)>>>0:0)];K[c+80>>2]=L[0];K[c+84>>2]=L[1];return 0}var Uc=void 0;function Vc(){Uc+=4;return K[Uc-4>>2]}function Z(a){a=T[a];if(!a)throw new Q(8);return a}var Wc;Wc=Ba?function(){var a=process.hrtime();return 1E3*a[0]+a[1]/1E6}:function(){return performance.now()};
var Xc={};function Yc(){if(!Zc){var a={USER:"web_user",LOGNAME:"web_user",PATH:"/",PWD:"/",HOME:"/home/web_user",LANG:("object"===typeof navigator&&navigator.languages&&navigator.languages[0]||"C").replace("-","_")+".UTF-8",_:xa||"./this.program"},b;for(b in Xc)void 0===Xc[b]?delete a[b]:a[b]=Xc[b];var c=[];for(b in a)c.push(b+"="+a[b]);Zc=c}return Zc}var Zc;
function Vb(a,b,c,d){a||(a=this);this.parent=a;this.Va=a.Va;this.$a=null;this.id=Ob++;this.name=b;this.mode=c;this.La={};this.Ma={};this.rdev=d}Object.defineProperties(Vb.prototype,{read:{get:function(){return 365===(this.mode&365)},set:function(a){a?this.mode|=365:this.mode&=-366}},write:{get:function(){return 146===(this.mode&146)},set:function(a){a?this.mode|=146:this.mode&=-147}}});Oc();U=Array(4096);cc(R,"/");X("/tmp");X("/home");X("/home/web_user");
(function(){X("/dev");Cb(259,{read:function(){return 0},write:function(b,c,d,f){return f}});dc("/dev/null",259);Bb(1280,Eb);Bb(1536,Fb);dc("/dev/tty",1280);dc("/dev/tty1",1536);var a=yb();Qc("random",a);Qc("urandom",a);X("/dev/shm");X("/dev/shm/tmp")})();
(function(){X("/proc");var a=X("/proc/self");X("/proc/self/fd");cc({Va:function(){var b=Jb(a,"fd",16895,73);b.La={lookup:function(c,d){var f=T[+d];if(!f)throw new Q(8);c={parent:null,Va:{Ab:"fake"},La:{readlink:function(){return f.path}}};return c.parent=c}};return b}},"/proc/self/fd")})();function ma(a,b){var c=Array(aa(a)+1);a=k(a,c,0,c.length);b&&(c.length=a);return c}
var ad={a:function(a,b,c,d){F("Assertion failed: "+A(a)+", at: "+[b?A(b):"unknown filename",c,d?A(d):"unknown function"])},s:function(a,b){pb||(pb=!0,lb());a=new Date(1E3*K[a>>2]);K[b>>2]=a.getSeconds();K[b+4>>2]=a.getMinutes();K[b+8>>2]=a.getHours();K[b+12>>2]=a.getDate();K[b+16>>2]=a.getMonth();K[b+20>>2]=a.getFullYear()-1900;K[b+24>>2]=a.getDay();var c=new Date(a.getFullYear(),0,1);K[b+28>>2]=(a.getTime()-c.getTime())/864E5|0;K[b+36>>2]=-(60*a.getTimezoneOffset());var d=(new Date(a.getFullYear(),
6,1)).getTimezoneOffset();c=c.getTimezoneOffset();a=(d!=c&&a.getTimezoneOffset()==Math.min(c,d))|0;K[b+32>>2]=a;a=K[ob()+(a?4:0)>>2];K[b+40>>2]=a;return b},y:function(a,b){try{a=A(a);if(b&-8)var c=-28;else{var d;(d=W(a,{Xa:!0}).node)?(a="",b&4&&(a+="r"),b&2&&(a+="w"),b&1&&(a+="x"),c=a&&Ub(d,a)?-2:0):c=-44}return c}catch(f){return"undefined"!==typeof Y&&f instanceof Q||F(f),-f.Pa}},i:function(a,b){try{return a=A(a),ha(a,b),0}catch(c){return"undefined"!==typeof Y&&c instanceof Q||F(c),-c.Pa}},z:function(a){try{return a=
A(a),Ic(a),0}catch(b){return"undefined"!==typeof Y&&b instanceof Q||F(b),-b.Pa}},j:function(a,b){try{var c=T[a];if(!c)throw new Q(8);ha(c.node,b);return 0}catch(d){return"undefined"!==typeof Y&&d instanceof Q||F(d),-d.Pa}},A:function(a){try{var b=T[a];if(!b)throw new Q(8);Ic(b.node);return 0}catch(c){return"undefined"!==typeof Y&&c instanceof Q||F(c),-c.Pa}},b:function(a,b,c){Uc=c;try{var d=Z(a);switch(b){case 0:var f=Vc();return 0>f?-28:ia(d.path,d.flags,0,f).fd;case 1:case 2:return 0;case 3:return d.flags;
case 4:return f=Vc(),d.flags|=f,0;case 12:return f=Vc(),La[f+0>>1]=2,0;case 13:case 14:return 0;case 16:case 8:return-28;case 9:return K[$c()>>2]=28,-1;default:return-28}}catch(g){return"undefined"!==typeof Y&&g instanceof Q||F(g),-g.Pa}},k:function(a,b){try{var c=Z(a);return Tc(fc,c.path,b)}catch(d){return"undefined"!==typeof Y&&d instanceof Q||F(d),-d.Pa}},E:function(a,b,c){try{var d=T[a];if(!d)throw new Q(8);if(0===(d.flags&2097155))throw new Q(28);Jc(d.node,c);return 0}catch(f){return"undefined"!==
typeof Y&&f instanceof Q||F(f),-f.Pa}},D:function(a,b){try{if(0===b)return-28;if(b<aa("/")+1)return-68;k("/",n,a,b);return a}catch(c){return"undefined"!==typeof Y&&c instanceof Q||F(c),-c.Pa}},v:function(){return 0},d:function(){return 42},h:function(a,b){try{return a=A(a),Tc(gc,a,b)}catch(c){return"undefined"!==typeof Y&&c instanceof Q||F(c),-c.Pa}},l:function(a,b){try{return a=A(a),a=r(a),"/"===a[a.length-1]&&(a=a.substr(0,a.length-1)),X(a,b),0}catch(c){return"undefined"!==typeof Y&&c instanceof
Q||F(c),-c.Pa}},t:function(a,b,c,d,f,g){try{a:{g<<=12;var m=!1;if(0!==(d&16)&&0!==a%65536)var t=-28;else{if(0!==(d&32)){var w=Gb(b);if(!w){t=-48;break a}m=!0}else{var u=T[f];if(!u){t=-8;break a}var C=g;if(0!==(c&2)&&0===(d&2)&&2!==(u.flags&2097155))throw new Q(2);if(1===(u.flags&2097155))throw new Q(2);if(!u.Ma.gb)throw new Q(43);var I=u.Ma.gb(u,a,b,C,c,d);w=I.Mb;m=I.jb}Sc[w]={Jb:w,Ib:b,jb:m,fd:f,Lb:c,flags:d,offset:g};t=w}}return t}catch(ba){return"undefined"!==typeof Y&&ba instanceof Q||F(ba),-ba.Pa}},
u:function(a,b){try{var c=Sc[a];if(0!==b&&c){if(b===c.Ib){var d=T[c.fd];if(d&&c.Lb&2){var f=c.flags,g=c.offset,m=n.slice(a,a+b);d&&d.Ma.hb&&d.Ma.hb(d,m,g,b,f)}Sc[a]=null;c.jb&&oa(c.Jb)}var t=0}else t=-28;return t}catch(w){return"undefined"!==typeof Y&&w instanceof Q||F(w),-w.Pa}},I:function(a,b,c){Uc=c;try{var d=A(a),f=c?Vc():0;return ia(d,b,f).fd}catch(g){return"undefined"!==typeof Y&&g instanceof Q||F(g),-g.Pa}},F:function(a,b,c){try{a=A(a);if(0>=c)var d=-28;else{var f=Qb(a),g=Math.min(c,aa(f)),
m=y[b+g];k(f,n,b,c+1);y[b+g]=m;d=g}return d}catch(t){return"undefined"!==typeof Y&&t instanceof Q||F(t),-t.Pa}},H:function(a){try{a=A(a);var b=W(a,{parent:!0}).node,c=xb(a),d=Lb(b,c),f=Zb(b,c,!0);if(f)throw new Q(f);if(!b.La.rmdir)throw new Q(63);if(d.$a)throw new Q(10);try{V.willDeletePath&&V.willDeletePath(a)}catch(g){H("FS.trackingDelegate['willDeletePath']('"+a+"') threw an exception: "+g.message)}b.La.rmdir(b,c);Tb(d);try{if(V.onDeletePath)V.onDeletePath(a)}catch(g){H("FS.trackingDelegate['onDeletePath']('"+
a+"') threw an exception: "+g.message)}return 0}catch(g){return"undefined"!==typeof Y&&g instanceof Q||F(g),-g.Pa}},e:function(a,b){try{return a=A(a),Tc(fc,a,b)}catch(c){return"undefined"!==typeof Y&&c instanceof Q||F(c),-c.Pa}},x:function(a){try{return a=A(a),ua(a),0}catch(b){return"undefined"!==typeof Y&&b instanceof Q||F(b),-b.Pa}},J:function(){return 2147483648},n:function(a,b,c){n.copyWithin(a,b,b+c)},c:function(a){var b=n.length;a>>>=0;if(2147483648<a)return!1;for(var c=1;4>=c;c*=2){var d=b*
(1+.2/c);d=Math.min(d,a+100663296);d=Math.max(a,d);0<d%65536&&(d+=65536-d%65536);a:{try{Oa.grow(Math.min(2147483648,d)-Xa.byteLength+65535>>>16);Ya();var f=1;break a}catch(g){}f=void 0}if(f)return!0}return!1},r:function(a){for(var b=Wc();Wc()-b<a;);},p:function(a,b){var c=0;Yc().forEach(function(d,f){var g=b+c;f=K[a+4*f>>2]=g;for(g=0;g<d.length;++g)y[f++>>0]=d.charCodeAt(g);y[f>>0]=0;c+=d.length+1});return 0},q:function(a,b){var c=Yc();K[a>>2]=c.length;var d=0;c.forEach(function(f){d+=f.length+1});
K[b>>2]=d;return 0},f:function(a){try{var b=Z(a);la(b);return 0}catch(c){return"undefined"!==typeof Y&&c instanceof Q||F(c),c.Pa}},o:function(a,b){try{var c=Z(a);y[b>>0]=c.tty?2:S(c.mode)?3:40960===(c.mode&61440)?7:4;return 0}catch(d){return"undefined"!==typeof Y&&d instanceof Q||F(d),d.Pa}},w:function(a,b,c,d){try{a:{for(var f=Z(a),g=a=0;g<c;g++){var m=K[b+(8*g+4)>>2],t=Nc(f,y,K[b+8*g>>2],m,void 0);if(0>t){var w=-1;break a}a+=t;if(t<m)break}w=a}K[d>>2]=w;return 0}catch(u){return"undefined"!==typeof Y&&
u instanceof Q||F(u),u.Pa}},m:function(a,b,c,d,f){try{var g=Z(a);a=4294967296*c+(b>>>0);if(-9007199254740992>=a||9007199254740992<=a)return-61;Mc(g,a,d);L=[g.position>>>0,(M=g.position,1<=+Math.abs(M)?0<M?(Math.min(+Math.floor(M/4294967296),4294967295)|0)>>>0:~~+Math.ceil((M-+(~~M>>>0))/4294967296)>>>0:0)];K[f>>2]=L[0];K[f+4>>2]=L[1];g.nb&&0===a&&0===d&&(g.nb=null);return 0}catch(m){return"undefined"!==typeof Y&&m instanceof Q||F(m),m.Pa}},G:function(a){try{var b=Z(a);return b.Ma&&b.Ma.fsync?-b.Ma.fsync(b):
0}catch(c){return"undefined"!==typeof Y&&c instanceof Q||F(c),c.Pa}},B:function(a,b,c,d){try{a:{for(var f=Z(a),g=a=0;g<c;g++){var m=ka(f,y,K[b+8*g>>2],K[b+(8*g+4)>>2],void 0);if(0>m){var t=-1;break a}a+=m}t=a}K[d>>2]=t;return 0}catch(w){return"undefined"!==typeof Y&&w instanceof Q||F(w),w.Pa}},g:function(a){var b=Date.now();K[a>>2]=b/1E3|0;K[a+4>>2]=b%1E3*1E3|0;return 0},K:function(a){var b=Date.now()/1E3|0;a&&(K[a>>2]=b);return b},C:function(a,b){if(b){var c=b+8;b=1E3*K[c>>2];b+=K[c+4>>2]/1E3}else b=
Date.now();a=A(a);try{var d=W(a,{Xa:!0}).node;d.La.Sa(d,{timestamp:Math.max(b,b)});var f=0}catch(g){if(!(g instanceof Q)){b:{f=Error();if(!f.stack){try{throw Error();}catch(m){f=m}if(!f.stack){f="(no stack trace available)";break b}}f=f.stack.toString()}e.extraStackTrace&&(f+="\n"+e.extraStackTrace());f=kb(f);throw g+" : "+f;}f=g.Pa;K[$c()>>2]=f;f=-1}return f}};
(function(){function a(f){e.asm=f.exports;Oa=e.asm.L;Ya();J=e.asm.Ca;$a.unshift(e.asm.M);cb--;e.monitorRunDependencies&&e.monitorRunDependencies(cb);0==cb&&(null!==db&&(clearInterval(db),db=null),eb&&(f=eb,eb=null,f()))}function b(f){a(f.instance)}function c(f){return ib().then(function(g){return WebAssembly.instantiate(g,d)}).then(function(g){return g}).then(f,function(g){H("failed to asynchronously prepare wasm: "+g);F(g)})}var d={a:ad};cb++;e.monitorRunDependencies&&e.monitorRunDependencies(cb);
if(e.instantiateWasm)try{return e.instantiateWasm(d,a)}catch(f){return H("Module.instantiateWasm callback failed with error: "+f),!1}(function(){return Ka||"function"!==typeof WebAssembly.instantiateStreaming||fb()||P.startsWith("file://")||"function"!==typeof fetch?c(b):fetch(P,{credentials:"same-origin"}).then(function(f){return WebAssembly.instantiateStreaming(f,d).then(b,function(g){H("wasm streaming compile failed: "+g);H("falling back to ArrayBuffer instantiation");return c(b)})})})();return{}})();
e.___wasm_call_ctors=function(){return(e.___wasm_call_ctors=e.asm.M).apply(null,arguments)};e._sqlite3_free=function(){return(e._sqlite3_free=e.asm.N).apply(null,arguments)};var $c=e.___errno_location=function(){return($c=e.___errno_location=e.asm.O).apply(null,arguments)};e._sqlite3_step=function(){return(e._sqlite3_step=e.asm.P).apply(null,arguments)};e._sqlite3_finalize=function(){return(e._sqlite3_finalize=e.asm.Q).apply(null,arguments)};
e._sqlite3_prepare_v2=function(){return(e._sqlite3_prepare_v2=e.asm.R).apply(null,arguments)};e._sqlite3_reset=function(){return(e._sqlite3_reset=e.asm.S).apply(null,arguments)};e._sqlite3_clear_bindings=function(){return(e._sqlite3_clear_bindings=e.asm.T).apply(null,arguments)};e._sqlite3_value_blob=function(){return(e._sqlite3_value_blob=e.asm.U).apply(null,arguments)};e._sqlite3_value_text=function(){return(e._sqlite3_value_text=e.asm.V).apply(null,arguments)};
e._sqlite3_value_bytes=function(){return(e._sqlite3_value_bytes=e.asm.W).apply(null,arguments)};e._sqlite3_value_double=function(){return(e._sqlite3_value_double=e.asm.X).apply(null,arguments)};e._sqlite3_value_int=function(){return(e._sqlite3_value_int=e.asm.Y).apply(null,arguments)};e._sqlite3_value_type=function(){return(e._sqlite3_value_type=e.asm.Z).apply(null,arguments)};e._sqlite3_result_blob=function(){return(e._sqlite3_result_blob=e.asm._).apply(null,arguments)};
e._sqlite3_result_double=function(){return(e._sqlite3_result_double=e.asm.$).apply(null,arguments)};e._sqlite3_result_error=function(){return(e._sqlite3_result_error=e.asm.aa).apply(null,arguments)};e._sqlite3_result_int=function(){return(e._sqlite3_result_int=e.asm.ba).apply(null,arguments)};e._sqlite3_result_int64=function(){return(e._sqlite3_result_int64=e.asm.ca).apply(null,arguments)};e._sqlite3_result_null=function(){return(e._sqlite3_result_null=e.asm.da).apply(null,arguments)};
e._sqlite3_result_text=function(){return(e._sqlite3_result_text=e.asm.ea).apply(null,arguments)};e._sqlite3_column_count=function(){return(e._sqlite3_column_count=e.asm.fa).apply(null,arguments)};e._sqlite3_data_count=function(){return(e._sqlite3_data_count=e.asm.ga).apply(null,arguments)};e._sqlite3_column_blob=function(){return(e._sqlite3_column_blob=e.asm.ha).apply(null,arguments)};e._sqlite3_column_bytes=function(){return(e._sqlite3_column_bytes=e.asm.ia).apply(null,arguments)};
e._sqlite3_column_double=function(){return(e._sqlite3_column_double=e.asm.ja).apply(null,arguments)};e._sqlite3_column_text=function(){return(e._sqlite3_column_text=e.asm.ka).apply(null,arguments)};e._sqlite3_column_type=function(){return(e._sqlite3_column_type=e.asm.la).apply(null,arguments)};e._sqlite3_column_name=function(){return(e._sqlite3_column_name=e.asm.ma).apply(null,arguments)};e._sqlite3_bind_blob=function(){return(e._sqlite3_bind_blob=e.asm.na).apply(null,arguments)};
e._sqlite3_bind_double=function(){return(e._sqlite3_bind_double=e.asm.oa).apply(null,arguments)};e._sqlite3_bind_int=function(){return(e._sqlite3_bind_int=e.asm.pa).apply(null,arguments)};e._sqlite3_bind_text=function(){return(e._sqlite3_bind_text=e.asm.qa).apply(null,arguments)};e._sqlite3_bind_parameter_index=function(){return(e._sqlite3_bind_parameter_index=e.asm.ra).apply(null,arguments)};e._sqlite3_sql=function(){return(e._sqlite3_sql=e.asm.sa).apply(null,arguments)};
e._sqlite3_normalized_sql=function(){return(e._sqlite3_normalized_sql=e.asm.ta).apply(null,arguments)};e._sqlite3_errmsg=function(){return(e._sqlite3_errmsg=e.asm.ua).apply(null,arguments)};e._sqlite3_exec=function(){return(e._sqlite3_exec=e.asm.va).apply(null,arguments)};e._sqlite3_changes=function(){return(e._sqlite3_changes=e.asm.wa).apply(null,arguments)};e._sqlite3_close_v2=function(){return(e._sqlite3_close_v2=e.asm.xa).apply(null,arguments)};
e._sqlite3_create_function_v2=function(){return(e._sqlite3_create_function_v2=e.asm.ya).apply(null,arguments)};e._sqlite3_open=function(){return(e._sqlite3_open=e.asm.za).apply(null,arguments)};var da=e._malloc=function(){return(da=e._malloc=e.asm.Aa).apply(null,arguments)},oa=e._free=function(){return(oa=e._free=e.asm.Ba).apply(null,arguments)};e._RegisterExtensionFunctions=function(){return(e._RegisterExtensionFunctions=e.asm.Da).apply(null,arguments)};
var ob=e.__get_tzname=function(){return(ob=e.__get_tzname=e.asm.Ea).apply(null,arguments)},nb=e.__get_daylight=function(){return(nb=e.__get_daylight=e.asm.Fa).apply(null,arguments)},mb=e.__get_timezone=function(){return(mb=e.__get_timezone=e.asm.Ga).apply(null,arguments)},pa=e.stackSave=function(){return(pa=e.stackSave=e.asm.Ha).apply(null,arguments)},ra=e.stackRestore=function(){return(ra=e.stackRestore=e.asm.Ia).apply(null,arguments)},x=e.stackAlloc=function(){return(x=e.stackAlloc=e.asm.Ja).apply(null,
arguments)},Hb=e._memalign=function(){return(Hb=e._memalign=e.asm.Ka).apply(null,arguments)};e.cwrap=function(a,b,c,d){c=c||[];var f=c.every(function(g){return"number"===g});return"string"!==b&&f&&!d?Qa(a):function(){return Ra(a,b,c,arguments)}};e.UTF8ToString=A;e.stackSave=pa;e.stackRestore=ra;e.stackAlloc=x;var bd;eb=function cd(){bd||dd();bd||(eb=cd)};
function dd(){function a(){if(!bd&&(bd=!0,e.calledRun=!0,!Pa)){e.noFSInit||Pc||(Pc=!0,Oc(),e.stdin=e.stdin,e.stdout=e.stdout,e.stderr=e.stderr,e.stdin?Qc("stdin",e.stdin):ec("/dev/tty","/dev/stdin"),e.stdout?Qc("stdout",null,e.stdout):ec("/dev/tty","/dev/stdout"),e.stderr?Qc("stderr",null,e.stderr):ec("/dev/tty1","/dev/stderr"),ia("/dev/stdin",0),ia("/dev/stdout",1),ia("/dev/stderr",1));Pb=!1;jb($a);if(e.onRuntimeInitialized)e.onRuntimeInitialized();if(e.postRun)for("function"==typeof e.postRun&&
(e.postRun=[e.postRun]);e.postRun.length;){var b=e.postRun.shift();ab.unshift(b)}jb(ab)}}if(!(0<cb)){if(e.preRun)for("function"==typeof e.preRun&&(e.preRun=[e.preRun]);e.preRun.length;)bb();jb(Za);0<cb||(e.setStatus?(e.setStatus("Running..."),setTimeout(function(){setTimeout(function(){e.setStatus("")},1);a()},1)):a())}}e.run=dd;if(e.preInit)for("function"==typeof e.preInit&&(e.preInit=[e.preInit]);0<e.preInit.length;)e.preInit.pop()();dd();


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

if (typeof importScripts === "function") {
    db = null;
    var sqlModuleReady = initSqlJs();
    self.onmessage = function onmessage(event) {
        return sqlModuleReady
            .then(onModuleReady.bind(event))
            .catch(onError.bind(event));
    };
}
