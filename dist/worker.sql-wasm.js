
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
var k;k||=typeof Module !== 'undefined' ? Module : {};
var aa=!!globalThis.window,ba=!!globalThis.WorkerGlobalScope,da=globalThis.process?.versions?.node&&globalThis.process?.type!="renderer",ea={SQLITE_ABORT:4,SQLITE_ABORT_ROLLBACK:516,SQLITE_ACCESS_EXISTS:0,SQLITE_ACCESS_READ:2,SQLITE_ACCESS_READWRITE:1,SQLITE_ALTER_TABLE:26,SQLITE_ANALYZE:28,SQLITE_ANY:5,SQLITE_ATTACH:24,SQLITE_AUTH:23,SQLITE_AUTH_USER:279,SQLITE_BLOB:4,SQLITE_BUSY:5,SQLITE_BUSY_RECOVERY:261,SQLITE_BUSY_SNAPSHOT:517,SQLITE_BUSY_TIMEOUT:773,SQLITE_CANTOPEN:14,SQLITE_CANTOPEN_CONVPATH:1038,
SQLITE_CANTOPEN_DIRTYWAL:1294,SQLITE_CANTOPEN_FULLPATH:782,SQLITE_CANTOPEN_ISDIR:526,SQLITE_CANTOPEN_NOTEMPDIR:270,SQLITE_CANTOPEN_SYMLINK:1550,SQLITE_CARRAY_BLOB:4,SQLITE_CARRAY_DOUBLE:2,SQLITE_CARRAY_INT32:0,SQLITE_CARRAY_INT64:1,SQLITE_CARRAY_TEXT:3,SQLITE_CHECKPOINT_FULL:1,SQLITE_CHECKPOINT_NOOP:-1,SQLITE_CHECKPOINT_PASSIVE:0,SQLITE_CHECKPOINT_RESTART:2,SQLITE_CHECKPOINT_TRUNCATE:3,SQLITE_CONFIG_COVERING_INDEX_SCAN:20,SQLITE_CONFIG_GETMALLOC:5,SQLITE_CONFIG_GETMUTEX:11,SQLITE_CONFIG_GETPCACHE:15,
SQLITE_CONFIG_GETPCACHE2:19,SQLITE_CONFIG_HEAP:8,SQLITE_CONFIG_LOG:16,SQLITE_CONFIG_LOOKASIDE:13,SQLITE_CONFIG_MALLOC:4,SQLITE_CONFIG_MEMDB_MAXSIZE:29,SQLITE_CONFIG_MEMSTATUS:9,SQLITE_CONFIG_MMAP_SIZE:22,SQLITE_CONFIG_MULTITHREAD:2,SQLITE_CONFIG_MUTEX:10,SQLITE_CONFIG_PAGECACHE:7,SQLITE_CONFIG_PCACHE:14,SQLITE_CONFIG_PCACHE2:18,SQLITE_CONFIG_PCACHE_HDRSZ:24,SQLITE_CONFIG_PMASZ:25,SQLITE_CONFIG_ROWID_IN_VIEW:30,SQLITE_CONFIG_SCRATCH:6,SQLITE_CONFIG_SERIALIZED:3,SQLITE_CONFIG_SINGLETHREAD:1,SQLITE_CONFIG_SMALL_MALLOC:27,
SQLITE_CONFIG_SORTERREF_SIZE:28,SQLITE_CONFIG_SQLLOG:21,SQLITE_CONFIG_STMTJRNL_SPILL:26,SQLITE_CONFIG_URI:17,SQLITE_CONFIG_WIN32_HEAPSIZE:23,SQLITE_CONSTRAINT:19,SQLITE_CONSTRAINT_CHECK:275,SQLITE_CONSTRAINT_COMMITHOOK:531,SQLITE_CONSTRAINT_DATATYPE:3091,SQLITE_CONSTRAINT_FOREIGNKEY:787,SQLITE_CONSTRAINT_FUNCTION:1043,SQLITE_CONSTRAINT_NOTNULL:1299,SQLITE_CONSTRAINT_PINNED:2835,SQLITE_CONSTRAINT_PRIMARYKEY:1555,SQLITE_CONSTRAINT_ROWID:2579,SQLITE_CONSTRAINT_TRIGGER:1811,SQLITE_CONSTRAINT_UNIQUE:2067,
SQLITE_CONSTRAINT_VTAB:2323,SQLITE_COPY:0,SQLITE_CORRUPT:11,SQLITE_CORRUPT_INDEX:779,SQLITE_CORRUPT_SEQUENCE:523,SQLITE_CORRUPT_VTAB:267,SQLITE_CREATE_INDEX:1,SQLITE_CREATE_TABLE:2,SQLITE_CREATE_TEMP_INDEX:3,SQLITE_CREATE_TEMP_TABLE:4,SQLITE_CREATE_TEMP_TRIGGER:5,SQLITE_CREATE_TEMP_VIEW:6,SQLITE_CREATE_TRIGGER:7,SQLITE_CREATE_VIEW:8,SQLITE_CREATE_VTABLE:29,SQLITE_DBCONFIG_DEFENSIVE:1010,SQLITE_DBCONFIG_DQS_DDL:1014,SQLITE_DBCONFIG_DQS_DML:1013,SQLITE_DBCONFIG_ENABLE_ATTACH_CREATE:1020,SQLITE_DBCONFIG_ENABLE_ATTACH_WRITE:1021,
SQLITE_DBCONFIG_ENABLE_COMMENTS:1022,SQLITE_DBCONFIG_ENABLE_FKEY:1002,SQLITE_DBCONFIG_ENABLE_FTS3_TOKENIZER:1004,SQLITE_DBCONFIG_ENABLE_LOAD_EXTENSION:1005,SQLITE_DBCONFIG_ENABLE_QPSG:1007,SQLITE_DBCONFIG_ENABLE_TRIGGER:1003,SQLITE_DBCONFIG_ENABLE_VIEW:1015,SQLITE_DBCONFIG_FP_DIGITS:1023,SQLITE_DBCONFIG_LEGACY_ALTER_TABLE:1012,SQLITE_DBCONFIG_LEGACY_FILE_FORMAT:1016,SQLITE_DBCONFIG_LOOKASIDE:1001,SQLITE_DBCONFIG_MAINDBNAME:1E3,SQLITE_DBCONFIG_MAX:1023,SQLITE_DBCONFIG_NO_CKPT_ON_CLOSE:1006,SQLITE_DBCONFIG_RESET_DATABASE:1009,
SQLITE_DBCONFIG_REVERSE_SCANORDER:1019,SQLITE_DBCONFIG_STMT_SCANSTATUS:1018,SQLITE_DBCONFIG_TRIGGER_EQP:1008,SQLITE_DBCONFIG_TRUSTED_SCHEMA:1017,SQLITE_DBCONFIG_WRITABLE_SCHEMA:1011,SQLITE_DBSTATUS_CACHE_HIT:7,SQLITE_DBSTATUS_CACHE_MISS:8,SQLITE_DBSTATUS_CACHE_SPILL:12,SQLITE_DBSTATUS_CACHE_USED:1,SQLITE_DBSTATUS_CACHE_USED_SHARED:11,SQLITE_DBSTATUS_CACHE_WRITE:9,SQLITE_DBSTATUS_DEFERRED_FKS:10,SQLITE_DBSTATUS_LOOKASIDE_HIT:4,SQLITE_DBSTATUS_LOOKASIDE_MISS_FULL:6,SQLITE_DBSTATUS_LOOKASIDE_MISS_SIZE:5,
SQLITE_DBSTATUS_LOOKASIDE_USED:0,SQLITE_DBSTATUS_MAX:13,SQLITE_DBSTATUS_SCHEMA_USED:2,SQLITE_DBSTATUS_STMT_USED:3,SQLITE_DBSTATUS_TEMPBUF_SPILL:13,SQLITE_DELETE:9,SQLITE_DENY:1,SQLITE_DESERIALIZE_FREEONCLOSE:1,SQLITE_DESERIALIZE_READONLY:4,SQLITE_DESERIALIZE_RESIZEABLE:2,SQLITE_DETACH:25,SQLITE_DETERMINISTIC:2048,SQLITE_DIRECTONLY:524288,SQLITE_DONE:101,SQLITE_DROP_INDEX:10,SQLITE_DROP_TABLE:11,SQLITE_DROP_TEMP_INDEX:12,SQLITE_DROP_TEMP_TABLE:13,SQLITE_DROP_TEMP_TRIGGER:14,SQLITE_DROP_TEMP_VIEW:15,
SQLITE_DROP_TRIGGER:16,SQLITE_DROP_VIEW:17,SQLITE_DROP_VTABLE:30,SQLITE_EMPTY:16,SQLITE_ERROR:1,SQLITE_ERROR_KEY:1281,SQLITE_ERROR_MISSING_COLLSEQ:257,SQLITE_ERROR_RESERVESIZE:1025,SQLITE_ERROR_RETRY:513,SQLITE_ERROR_SNAPSHOT:769,SQLITE_ERROR_UNABLE:1537,SQLITE_FAIL:3,SQLITE_FCNTL_BEGIN_ATOMIC_WRITE:31,SQLITE_FCNTL_BLOCK_ON_CONNECT:44,SQLITE_FCNTL_BUSYHANDLER:15,SQLITE_FCNTL_CHUNK_SIZE:6,SQLITE_FCNTL_CKPT_DONE:37,SQLITE_FCNTL_CKPT_START:39,SQLITE_FCNTL_CKSM_FILE:41,SQLITE_FCNTL_COMMIT_ATOMIC_WRITE:32,
SQLITE_FCNTL_COMMIT_PHASETWO:22,SQLITE_FCNTL_DATA_VERSION:35,SQLITE_FCNTL_EXTERNAL_READER:40,SQLITE_FCNTL_FILESTAT:45,SQLITE_FCNTL_FILE_POINTER:7,SQLITE_FCNTL_GET_LOCKPROXYFILE:2,SQLITE_FCNTL_HAS_MOVED:20,SQLITE_FCNTL_JOURNAL_POINTER:28,SQLITE_FCNTL_LAST_ERRNO:4,SQLITE_FCNTL_LOCKSTATE:1,SQLITE_FCNTL_LOCK_TIMEOUT:34,SQLITE_FCNTL_MMAP_SIZE:18,SQLITE_FCNTL_NULL_IO:43,SQLITE_FCNTL_OVERWRITE:11,SQLITE_FCNTL_PDB:30,SQLITE_FCNTL_PERSIST_WAL:10,SQLITE_FCNTL_POWERSAFE_OVERWRITE:13,SQLITE_FCNTL_PRAGMA:14,SQLITE_FCNTL_RBU:26,
SQLITE_FCNTL_RESERVE_BYTES:38,SQLITE_FCNTL_RESET_CACHE:42,SQLITE_FCNTL_ROLLBACK_ATOMIC_WRITE:33,SQLITE_FCNTL_SET_LOCKPROXYFILE:3,SQLITE_FCNTL_SIZE_HINT:5,SQLITE_FCNTL_SIZE_LIMIT:36,SQLITE_FCNTL_SYNC:21,SQLITE_FCNTL_SYNC_OMITTED:8,SQLITE_FCNTL_TEMPFILENAME:16,SQLITE_FCNTL_TRACE:19,SQLITE_FCNTL_VFSNAME:12,SQLITE_FCNTL_VFS_POINTER:27,SQLITE_FCNTL_WAL_BLOCK:24,SQLITE_FCNTL_WIN32_AV_RETRY:9,SQLITE_FCNTL_WIN32_GET_HANDLE:29,SQLITE_FCNTL_WIN32_SET_HANDLE:23,SQLITE_FCNTL_ZIPVFS:25,SQLITE_FINISH:2,SQLITE_FLOAT:2,
SQLITE_FORMAT:24,SQLITE_FULL:13,SQLITE_FUNCTION:31,SQLITE_GET_LOCKPROXYFILE:2,SQLITE_IGNORE:2,SQLITE_INDEX_CONSTRAINT_EQ:2,SQLITE_INDEX_CONSTRAINT_FUNCTION:150,SQLITE_INDEX_CONSTRAINT_GE:32,SQLITE_INDEX_CONSTRAINT_GLOB:66,SQLITE_INDEX_CONSTRAINT_GT:4,SQLITE_INDEX_CONSTRAINT_IS:72,SQLITE_INDEX_CONSTRAINT_ISNOT:69,SQLITE_INDEX_CONSTRAINT_ISNOTNULL:70,SQLITE_INDEX_CONSTRAINT_ISNULL:71,SQLITE_INDEX_CONSTRAINT_LE:8,SQLITE_INDEX_CONSTRAINT_LIKE:65,SQLITE_INDEX_CONSTRAINT_LIMIT:73,SQLITE_INDEX_CONSTRAINT_LT:16,
SQLITE_INDEX_CONSTRAINT_MATCH:64,SQLITE_INDEX_CONSTRAINT_NE:68,SQLITE_INDEX_CONSTRAINT_OFFSET:74,SQLITE_INDEX_CONSTRAINT_REGEXP:67,SQLITE_INDEX_SCAN_HEX:2,SQLITE_INDEX_SCAN_UNIQUE:1,SQLITE_INNOCUOUS:2097152,SQLITE_INSERT:18,SQLITE_INTEGER:1,SQLITE_INTERNAL:2,SQLITE_INTERRUPT:9,SQLITE_IOCAP_ATOMIC:1,SQLITE_IOCAP_ATOMIC16K:64,SQLITE_IOCAP_ATOMIC1K:4,SQLITE_IOCAP_ATOMIC2K:8,SQLITE_IOCAP_ATOMIC32K:128,SQLITE_IOCAP_ATOMIC4K:16,SQLITE_IOCAP_ATOMIC512:2,SQLITE_IOCAP_ATOMIC64K:256,SQLITE_IOCAP_ATOMIC8K:32,
SQLITE_IOCAP_BATCH_ATOMIC:16384,SQLITE_IOCAP_IMMUTABLE:8192,SQLITE_IOCAP_POWERSAFE_OVERWRITE:4096,SQLITE_IOCAP_SAFE_APPEND:512,SQLITE_IOCAP_SEQUENTIAL:1024,SQLITE_IOCAP_SUBPAGE_READ:32768,SQLITE_IOCAP_UNDELETABLE_WHEN_OPEN:2048,SQLITE_IOERR:10,SQLITE_IOERR_ACCESS:3338,SQLITE_IOERR_AUTH:7178,SQLITE_IOERR_BADKEY:8970,SQLITE_IOERR_BEGIN_ATOMIC:7434,SQLITE_IOERR_BLOCKED:2826,SQLITE_IOERR_CHECKRESERVEDLOCK:3594,SQLITE_IOERR_CLOSE:4106,SQLITE_IOERR_CODEC:9226,SQLITE_IOERR_COMMIT_ATOMIC:7690,SQLITE_IOERR_CONVPATH:6666,
SQLITE_IOERR_CORRUPTFS:8458,SQLITE_IOERR_DATA:8202,SQLITE_IOERR_DELETE:2570,SQLITE_IOERR_DELETE_NOENT:5898,SQLITE_IOERR_DIR_CLOSE:4362,SQLITE_IOERR_DIR_FSYNC:1290,SQLITE_IOERR_FSTAT:1802,SQLITE_IOERR_FSYNC:1034,SQLITE_IOERR_GETTEMPPATH:6410,SQLITE_IOERR_IN_PAGE:8714,SQLITE_IOERR_LOCK:3850,SQLITE_IOERR_MMAP:6154,SQLITE_IOERR_NOMEM:3082,SQLITE_IOERR_RDLOCK:2314,SQLITE_IOERR_READ:266,SQLITE_IOERR_ROLLBACK_ATOMIC:7946,SQLITE_IOERR_SEEK:5642,SQLITE_IOERR_SHMLOCK:5130,SQLITE_IOERR_SHMMAP:5386,SQLITE_IOERR_SHMOPEN:4618,
SQLITE_IOERR_SHMSIZE:4874,SQLITE_IOERR_SHORT_READ:522,SQLITE_IOERR_TRUNCATE:1546,SQLITE_IOERR_UNLOCK:2058,SQLITE_IOERR_VNODE:6922,SQLITE_IOERR_WRITE:778,SQLITE_LAST_ERRNO:4,SQLITE_LIMIT_ATTACHED:7,SQLITE_LIMIT_COLUMN:2,SQLITE_LIMIT_COMPOUND_SELECT:4,SQLITE_LIMIT_EXPR_DEPTH:3,SQLITE_LIMIT_FUNCTION_ARG:6,SQLITE_LIMIT_LENGTH:0,SQLITE_LIMIT_LIKE_PATTERN_LENGTH:8,SQLITE_LIMIT_PARSER_DEPTH:12,SQLITE_LIMIT_SCHEMA:13,SQLITE_LIMIT_SQL_LENGTH:1,SQLITE_LIMIT_TRIGGER_DEPTH:10,SQLITE_LIMIT_TRIGGER_STEPS:14,SQLITE_LIMIT_VARIABLE_NUMBER:9,
SQLITE_LIMIT_VDBE_OP:5,SQLITE_LIMIT_WORKER_THREADS:11,SQLITE_LOCKED:6,SQLITE_LOCKED_SHAREDCACHE:262,SQLITE_LOCKED_VTAB:518,SQLITE_LOCK_EXCLUSIVE:4,SQLITE_LOCK_NONE:0,SQLITE_LOCK_PENDING:3,SQLITE_LOCK_RESERVED:2,SQLITE_LOCK_SHARED:1,SQLITE_MISMATCH:20,SQLITE_MISUSE:21,SQLITE_MUTEX_FAST:0,SQLITE_MUTEX_RECURSIVE:1,SQLITE_MUTEX_STATIC_APP1:8,SQLITE_MUTEX_STATIC_APP2:9,SQLITE_MUTEX_STATIC_APP3:10,SQLITE_MUTEX_STATIC_LRU:6,SQLITE_MUTEX_STATIC_LRU2:7,SQLITE_MUTEX_STATIC_MAIN:2,SQLITE_MUTEX_STATIC_MASTER:2,
SQLITE_MUTEX_STATIC_MEM:3,SQLITE_MUTEX_STATIC_MEM2:4,SQLITE_MUTEX_STATIC_OPEN:4,SQLITE_MUTEX_STATIC_PMEM:7,SQLITE_MUTEX_STATIC_PRNG:5,SQLITE_MUTEX_STATIC_VFS1:11,SQLITE_MUTEX_STATIC_VFS2:12,SQLITE_MUTEX_STATIC_VFS3:13,SQLITE_NOLFS:22,SQLITE_NOMEM:7,SQLITE_NOTADB:26,SQLITE_NOTFOUND:12,SQLITE_NOTICE:27,SQLITE_NOTICE_RBU:795,SQLITE_NOTICE_RECOVER_ROLLBACK:539,SQLITE_NOTICE_RECOVER_WAL:283,SQLITE_NULL:5,SQLITE_OK:0,SQLITE_OK_LOAD_PERMANENTLY:256,SQLITE_OK_SYMLINK:512,SQLITE_OPEN_AUTOPROXY:32,SQLITE_OPEN_CREATE:4,
SQLITE_OPEN_DELETEONCLOSE:8,SQLITE_OPEN_EXCLUSIVE:16,SQLITE_OPEN_EXRESCODE:33554432,SQLITE_OPEN_FULLMUTEX:65536,SQLITE_OPEN_MAIN_DB:256,SQLITE_OPEN_MAIN_JOURNAL:2048,SQLITE_OPEN_MASTER_JOURNAL:16384,SQLITE_OPEN_MEMORY:128,SQLITE_OPEN_NOFOLLOW:16777216,SQLITE_OPEN_NOMUTEX:32768,SQLITE_OPEN_PRIVATECACHE:262144,SQLITE_OPEN_READONLY:1,SQLITE_OPEN_READWRITE:2,SQLITE_OPEN_SHAREDCACHE:131072,SQLITE_OPEN_SUBJOURNAL:8192,SQLITE_OPEN_SUPER_JOURNAL:16384,SQLITE_OPEN_TEMP_DB:512,SQLITE_OPEN_TEMP_JOURNAL:4096,
SQLITE_OPEN_TRANSIENT_DB:1024,SQLITE_OPEN_URI:64,SQLITE_OPEN_WAL:524288,SQLITE_PERM:3,SQLITE_PRAGMA:19,SQLITE_PREPARE_DONT_LOG:16,SQLITE_PREPARE_FROM_DDL:32,SQLITE_PREPARE_NORMALIZE:2,SQLITE_PREPARE_NO_VTAB:4,SQLITE_PREPARE_PERSISTENT:1,SQLITE_PROTOCOL:15,SQLITE_RANGE:25,SQLITE_READ:20,SQLITE_READONLY:8,SQLITE_READONLY_CANTINIT:1288,SQLITE_READONLY_CANTLOCK:520,SQLITE_READONLY_DBMOVED:1032,SQLITE_READONLY_DIRECTORY:1544,SQLITE_READONLY_RECOVERY:264,SQLITE_READONLY_ROLLBACK:776,SQLITE_RECURSIVE:33,
SQLITE_REINDEX:27,SQLITE_REPLACE:5,SQLITE_RESULT_SUBTYPE:16777216,SQLITE_ROLLBACK:1,SQLITE_ROW:100,SQLITE_SAVEPOINT:32,SQLITE_SCANSTAT_COMPLEX:1,SQLITE_SCANSTAT_EST:2,SQLITE_SCANSTAT_EXPLAIN:4,SQLITE_SCANSTAT_NAME:3,SQLITE_SCANSTAT_NCYCLE:7,SQLITE_SCANSTAT_NLOOP:0,SQLITE_SCANSTAT_NVISIT:1,SQLITE_SCANSTAT_PARENTID:6,SQLITE_SCANSTAT_SELECTID:5,SQLITE_SCHEMA:17,SQLITE_SELECT:21,SQLITE_SELFORDER1:33554432,SQLITE_SERIALIZE_NOCOPY:1,SQLITE_SETLK_BLOCK_ON_CONNECT:1,SQLITE_SET_LOCKPROXYFILE:3,SQLITE_SHM_EXCLUSIVE:8,
SQLITE_SHM_LOCK:2,SQLITE_SHM_NLOCK:8,SQLITE_SHM_SHARED:4,SQLITE_SHM_UNLOCK:1,SQLITE_STATUS_MALLOC_COUNT:9,SQLITE_STATUS_MALLOC_SIZE:5,SQLITE_STATUS_MEMORY_USED:0,SQLITE_STATUS_PAGECACHE_OVERFLOW:2,SQLITE_STATUS_PAGECACHE_SIZE:7,SQLITE_STATUS_PAGECACHE_USED:1,SQLITE_STATUS_PARSER_STACK:6,SQLITE_STATUS_SCRATCH_OVERFLOW:4,SQLITE_STATUS_SCRATCH_SIZE:8,SQLITE_STATUS_SCRATCH_USED:3,SQLITE_STMTSTATUS_AUTOINDEX:3,SQLITE_STMTSTATUS_FILTER_HIT:8,SQLITE_STMTSTATUS_FILTER_MISS:7,SQLITE_STMTSTATUS_FULLSCAN_STEP:1,
SQLITE_STMTSTATUS_MEMUSED:99,SQLITE_STMTSTATUS_REPREPARE:5,SQLITE_STMTSTATUS_RUN:6,SQLITE_STMTSTATUS_SORT:2,SQLITE_STMTSTATUS_VM_STEP:4,SQLITE_SUBTYPE:1048576,SQLITE_SYNC_DATAONLY:16,SQLITE_SYNC_FULL:3,SQLITE_SYNC_NORMAL:2,SQLITE_TESTCTRL_ALWAYS:13,SQLITE_TESTCTRL_ASSERT:12,SQLITE_TESTCTRL_ATOF:34,SQLITE_TESTCTRL_BENIGN_MALLOC_HOOKS:10,SQLITE_TESTCTRL_BITVEC_TEST:8,SQLITE_TESTCTRL_BYTEORDER:22,SQLITE_TESTCTRL_EXPLAIN_STMT:19,SQLITE_TESTCTRL_EXTRA_SCHEMA_CHECKS:29,SQLITE_TESTCTRL_FAULT_INSTALL:9,SQLITE_TESTCTRL_FIRST:5,
SQLITE_TESTCTRL_FK_NO_ACTION:7,SQLITE_TESTCTRL_GETOPT:16,SQLITE_TESTCTRL_IMPOSTER:25,SQLITE_TESTCTRL_INTERNAL_FUNCTIONS:17,SQLITE_TESTCTRL_ISINIT:23,SQLITE_TESTCTRL_ISKEYWORD:16,SQLITE_TESTCTRL_JSON_SELFCHECK:14,SQLITE_TESTCTRL_LAST:34,SQLITE_TESTCTRL_LOCALTIME_FAULT:18,SQLITE_TESTCTRL_LOGEST:33,SQLITE_TESTCTRL_NEVER_CORRUPT:20,SQLITE_TESTCTRL_ONCE_RESET_THRESHOLD:19,SQLITE_TESTCTRL_OPTIMIZATIONS:15,SQLITE_TESTCTRL_PARSER_COVERAGE:26,SQLITE_TESTCTRL_PENDING_BYTE:11,SQLITE_TESTCTRL_PRNG_RESET:7,SQLITE_TESTCTRL_PRNG_RESTORE:6,
SQLITE_TESTCTRL_PRNG_SAVE:5,SQLITE_TESTCTRL_PRNG_SEED:28,SQLITE_TESTCTRL_RESERVE:14,SQLITE_TESTCTRL_RESULT_INTREAL:27,SQLITE_TESTCTRL_SCRATCHMALLOC:17,SQLITE_TESTCTRL_SEEK_COUNT:30,SQLITE_TESTCTRL_SORTER_MMAP:24,SQLITE_TESTCTRL_TRACEFLAGS:31,SQLITE_TESTCTRL_TUNE:32,SQLITE_TESTCTRL_USELONGDOUBLE:34,SQLITE_TESTCTRL_VDBE_COVERAGE:21,SQLITE_TEXT:3,SQLITE_TOOBIG:18,SQLITE_TRACE_CLOSE:8,SQLITE_TRACE_PROFILE:2,SQLITE_TRACE_ROW:4,SQLITE_TRACE_STMT:1,SQLITE_TRANSACTION:22,SQLITE_TXN_NONE:0,SQLITE_TXN_READ:1,
SQLITE_TXN_WRITE:2,SQLITE_UPDATE:23,SQLITE_UTF16:4,SQLITE_UTF16BE:3,SQLITE_UTF16LE:2,SQLITE_UTF16_ALIGNED:8,SQLITE_UTF8:1,SQLITE_UTF8_ZT:16,SQLITE_VERSION_NUMBER:3054001,SQLITE_VTAB_CONSTRAINT_SUPPORT:1,SQLITE_VTAB_DIRECTONLY:3,SQLITE_VTAB_INNOCUOUS:2,SQLITE_VTAB_USES_ALL_SCHEMAS:4,SQLITE_WARNING:28,SQLITE_WARNING_AUTOINDEX:284,SQLITE_WIN32_DATA_DIRECTORY_TYPE:1,SQLITE_WIN32_TEMP_DIRECTORY_TYPE:2,SQLITE_XFER:1},fa="SQLITE_ABORT SQLITE_ABORT_ROLLBACK SQLITE_AUTH SQLITE_AUTH_USER SQLITE_BUSY SQLITE_BUSY_RECOVERY SQLITE_BUSY_SNAPSHOT SQLITE_BUSY_TIMEOUT SQLITE_CANTOPEN SQLITE_CANTOPEN_CONVPATH SQLITE_CANTOPEN_DIRTYWAL SQLITE_CANTOPEN_FULLPATH SQLITE_CANTOPEN_ISDIR SQLITE_CANTOPEN_NOTEMPDIR SQLITE_CANTOPEN_SYMLINK SQLITE_CONSTRAINT SQLITE_CONSTRAINT_CHECK SQLITE_CONSTRAINT_COMMITHOOK SQLITE_CONSTRAINT_DATATYPE SQLITE_CONSTRAINT_FOREIGNKEY SQLITE_CONSTRAINT_FUNCTION SQLITE_CONSTRAINT_NOTNULL SQLITE_CONSTRAINT_PINNED SQLITE_CONSTRAINT_PRIMARYKEY SQLITE_CONSTRAINT_ROWID SQLITE_CONSTRAINT_TRIGGER SQLITE_CONSTRAINT_UNIQUE SQLITE_CONSTRAINT_VTAB SQLITE_CORRUPT SQLITE_CORRUPT_INDEX SQLITE_CORRUPT_SEQUENCE SQLITE_CORRUPT_VTAB SQLITE_DONE SQLITE_EMPTY SQLITE_ERROR SQLITE_ERROR_KEY SQLITE_ERROR_MISSING_COLLSEQ SQLITE_ERROR_RESERVESIZE SQLITE_ERROR_RETRY SQLITE_ERROR_SNAPSHOT SQLITE_ERROR_UNABLE SQLITE_FORMAT SQLITE_FULL SQLITE_INTERNAL SQLITE_INTERRUPT SQLITE_IOERR SQLITE_IOERR_ACCESS SQLITE_IOERR_AUTH SQLITE_IOERR_BADKEY SQLITE_IOERR_BEGIN_ATOMIC SQLITE_IOERR_BLOCKED SQLITE_IOERR_CHECKRESERVEDLOCK SQLITE_IOERR_CLOSE SQLITE_IOERR_CODEC SQLITE_IOERR_COMMIT_ATOMIC SQLITE_IOERR_CONVPATH SQLITE_IOERR_CORRUPTFS SQLITE_IOERR_DATA SQLITE_IOERR_DELETE SQLITE_IOERR_DELETE_NOENT SQLITE_IOERR_DIR_CLOSE SQLITE_IOERR_DIR_FSYNC SQLITE_IOERR_FSTAT SQLITE_IOERR_FSYNC SQLITE_IOERR_GETTEMPPATH SQLITE_IOERR_IN_PAGE SQLITE_IOERR_LOCK SQLITE_IOERR_MMAP SQLITE_IOERR_NOMEM SQLITE_IOERR_RDLOCK SQLITE_IOERR_READ SQLITE_IOERR_ROLLBACK_ATOMIC SQLITE_IOERR_SEEK SQLITE_IOERR_SHMLOCK SQLITE_IOERR_SHMMAP SQLITE_IOERR_SHMOPEN SQLITE_IOERR_SHMSIZE SQLITE_IOERR_SHORT_READ SQLITE_IOERR_TRUNCATE SQLITE_IOERR_UNLOCK SQLITE_IOERR_VNODE SQLITE_IOERR_WRITE SQLITE_LOCKED SQLITE_LOCKED_SHAREDCACHE SQLITE_LOCKED_VTAB SQLITE_MISMATCH SQLITE_MISUSE SQLITE_NOLFS SQLITE_NOMEM SQLITE_NOTADB SQLITE_NOTFOUND SQLITE_NOTICE SQLITE_NOTICE_RBU SQLITE_NOTICE_RECOVER_ROLLBACK SQLITE_NOTICE_RECOVER_WAL SQLITE_PERM SQLITE_PROTOCOL SQLITE_RANGE SQLITE_READONLY SQLITE_READONLY_CANTINIT SQLITE_READONLY_CANTLOCK SQLITE_READONLY_DBMOVED SQLITE_READONLY_DIRECTORY SQLITE_READONLY_RECOVERY SQLITE_READONLY_ROLLBACK SQLITE_ROW SQLITE_SCHEMA SQLITE_TOOBIG SQLITE_WARNING SQLITE_WARNING_AUTOINDEX".split(" ");
k.onRuntimeInitialized=function(){function a(f,h){ub(f,h instanceof Error?h.message:String(h),-1)}function b(f,h){switch(typeof h){case "boolean":nc(f,h?1:0);break;case "number":oc(f,h);break;case "string":pc(f,h,l(h),-1);break;case "object":if(h===null)vb(f);else if(h.length!=null){var p=ha(h.length);v.set(h,p);qc(f,p,h.length,-1);ja(p)}else ub(f,"Wrong API use : tried to return a value of an unknown type ("+h+").",-1);break;default:vb(f)}}function d(f,h){for(var p=[],r=0;r<f;r+=1){var u=y(h+4*r,
"i32"),w=rc(u);if(w===1||w===2)u=sc(u);else if(w===3)w=wb(u),u=tc(u),u=A(u,w,!0);else if(w===4){w=u;u=wb(w);w=uc(w);for(var x=new Uint8Array(u),G=0;G<u;G+=1)x[G]=v[w+G];u=x}else u=null;p.push(u)}return p}function c(f,h){this.Xa=f;this.db=h;this.Va=1;this.ub=[]}function e(f,h){this.db=h;this.nb=ka(f);if(this.nb===null)throw Error("Unable to allocate memory for the SQL string");this.sb=this.nb;this.fb=this.Ab=null}function g(f){this.filename="dbfile_"+(4294967295*Math.random()>>>0);f!=null&&la(this.filename,
f);this.handleError(U(this.filename,q));this.db=y(q,"i32");z&&vc(this.db);this.tb={};this.ab=new Map}function m(f,h){return f.replace(/[A-Z]/g,function(p){return p.toLowerCase()})+":"+h}function t(f){f.forEach(oa)}var z=k.useOldExtensionFunctions!==!1,q=pa(4),n=k.cwrap,F={};fa.forEach(function(f){F[ea[f]]=f});var U=n("sqlite3_open","number",["string","number"]),ma=n("sqlite3_close_v2","number",["number"]),Aa=n("sqlite3_backup_init","number",["number","string","number","string"]),na=n("sqlite3_backup_step",
"number",["number","number"]),ca=n("sqlite3_backup_finish","number",["number"]),Ba=n("sqlite3_exec","number",["number","number","number","number","number"]),N=n("sqlite3_changes","number",["number"]),wc=n("sqlite3_sql","string",["number"]),xc=n("sqlite3_normalized_sql","string",["number"]),Ua=n("sqlite3_prepare_v2","number",["number","number","number","number","number"]),yc=n("sqlite3_bind_text","number",["number","number","number","number","number"]),yb=n("sqlite3_bind_blob","number",["number","number",
"number","number","number"]),zc=n("sqlite3_bind_double","number",["number","number","number"]),Ac=n("sqlite3_bind_int","number",["number","number","number"]),zb=n("sqlite3_bind_int64","number",["number","number","number"]),Bc=typeof n("sqlite3_memory_used","number",[])()==="bigint",Cc=n("sqlite3_bind_parameter_index","number",["number","string"]),Dc=n("sqlite3_step","number",["number"]),ia=n("sqlite3_errmsg","string",["number"]),Ec=n("sqlite3_extended_errcode","number",["number"]),Fc=n("sqlite3_column_count",
"number",["number"]),Gc=n("sqlite3_data_count","number",["number"]),Hc=n("sqlite3_column_double","number",["number","number"]),Ic=n("sqlite3_column_text","number",["number","number"]),Jc=n("sqlite3_column_blob","number",["number","number"]),Ab=n("sqlite3_column_bytes","number",["number","number"]),Kc=n("sqlite3_column_type","number",["number","number"]),Lc=n("sqlite3_column_name","string",["number","number"]),Mc=n("sqlite3_reset","number",["number"]),Nc=n("sqlite3_clear_bindings","number",["number"]),
Oc=n("sqlite3_finalize","number",["number"]),Bb=n("sqlite3_create_function_v2","number","number string number number number number number number number".split(" ")),rc=n("sqlite3_value_type","number",["number"]),wb=n("sqlite3_value_bytes","number",["number"]),tc=n("sqlite3_value_text","number",["number"]),uc=n("sqlite3_value_blob","number",["number"]),sc=n("sqlite3_value_double","number",["number"]),oc=n("sqlite3_result_double","",["number","number"]),vb=n("sqlite3_result_null","",["number"]),pc=
n("sqlite3_result_text","",["number","string","number","number"]),qc=n("sqlite3_result_blob","",["number","number","number","number"]),nc=n("sqlite3_result_int","",["number","number"]),ub=n("sqlite3_result_error","",["number","string","number"]),Cb=n("sqlite3_aggregate_context","number",["number","number"]),vc=n("RegisterExtensionFunctions","number",["number"]),Db=n("sqlite3_update_hook","number",["number","number","number"]);c.prototype.bind=function(f){if(!this.Xa)throw"Statement closed";this.reset();
return Array.isArray(f)?this.Rb(f):f!=null&&typeof f==="object"?this.Sb(f):!0};c.prototype.step=function(){if(!this.Xa)throw"Statement closed";this.Va=1;var f=Dc(this.Xa);switch(f){case 100:return!0;case 101:return!1;default:throw this.db.handleError(f);}};c.prototype.Jb=function(f){f==null&&(f=this.Va,this.Va+=1);return Hc(this.Xa,f)};c.prototype.ac=function(f){f==null&&(f=this.Va,this.Va+=1);if(typeof BigInt!=="function")throw Error("BigInt is not supported");return BigInt(this.Kb(f))};c.prototype.Kb=
function(f){f==null&&(f=this.Va,this.Va+=1);var h=Ic(this.Xa,f);f=Ab(this.Xa,f);return A(h,f,!0)};c.prototype.getBlob=function(f){f==null&&(f=this.Va,this.Va+=1);var h=Ab(this.Xa,f);f=Jc(this.Xa,f);for(var p=new Uint8Array(h),r=0;r<h;r+=1)p[r]=v[f+r];return p};c.prototype.get=function(f,h){h=h||{};f!=null&&this.bind(f)&&this.step();f=[];for(var p=Gc(this.Xa),r=0;r<p;r+=1)switch(Kc(this.Xa,r)){case 1:var u=h.useBigInt?this.ac(r):this.Jb(r);f.push(u);break;case 2:f.push(this.Jb(r));break;case 3:f.push(this.Kb(r));
break;case 4:f.push(this.getBlob(r));break;default:f.push(null)}return f};c.prototype.yb=function(){for(var f=[],h=Fc(this.Xa),p=0;p<h;p+=1)f.push(Lc(this.Xa,p));return f};c.prototype.Ib=function(f,h){var p=this.get(f,h);f=this.yb();return Object.fromEntries(f.map(function(r,u){return[r,p[u]]}))};c.prototype.ec=function(){return wc(this.Xa)};c.prototype.bc=function(){return xc(this.Xa)};c.prototype.run=function(f){f!=null&&this.bind(f);this.step();return this.reset()};c.prototype.Ub=function(f,h){h==
null&&(h=this.Va,this.Va+=1);var p=ka(f);this.ub.push(p);this.db.handleError(yc(this.Xa,h,p,l(f),0))};c.prototype.Qb=function(f,h){h==null&&(h=this.Va,this.Va+=1);var p=ha(f.length);v.set(f,p);this.ub.push(p);this.db.handleError(yb(this.Xa,h,p,f.length,0))};c.prototype.Eb=function(f,h){h==null&&(h=this.Va,this.Va+=1);this.db.handleError((f===(f|0)?Ac:zc)(this.Xa,h,f))};c.prototype.Pb=function(f,h){h==null&&(h=this.Va,this.Va+=1);if(BigInt.asIntN(64,f)!==f)throw new RangeError("BigInt value is out of range for a 64-bit integer: "+
f);f=Bc?zb(this.Xa,h,f):zb(this.Xa,h,Number(BigInt.asIntN(32,f)),Number(f>>BigInt(32)));this.db.handleError(f)};c.prototype.Tb=function(f){f==null&&(f=this.Va,this.Va+=1);yb(this.Xa,f,0,0,0)};c.prototype.Fb=function(f,h){h==null&&(h=this.Va,this.Va+=1);switch(typeof f){case "string":this.Ub(f,h);return;case "number":this.Eb(f,h);return;case "bigint":this.Pb(f,h);return;case "boolean":this.Eb(f+0,h);return;case "object":if(f===null){this.Tb(h);return}if(f.length!=null){this.Qb(f,h);return}}throw"Wrong API use : tried to bind a value of an unknown type ("+
f+").";};c.prototype.Sb=function(f){var h=this;Object.keys(f).forEach(function(p){var r=Cc(h.Xa,p);r!==0&&h.Fb(f[p],r)});return!0};c.prototype.Rb=function(f){for(var h=0;h<f.length;h+=1)this.Fb(f[h],h+1);return!0};c.prototype.reset=function(){this.freemem();return Nc(this.Xa)===0&&Mc(this.Xa)===0};c.prototype.freemem=function(){for(var f;(f=this.ub.pop())!==void 0;)ja(f)};c.prototype.hb=function(){this.freemem();var f=Oc(this.Xa)===0;delete this.db.tb[this.Xa];this.Xa=0;return f};e.prototype.next=
function(){if(this.nb===null)return{done:!0};this.fb!==null&&(this.fb.hb(),this.fb=null);if(!this.db.db)throw this.ob(),Error("Database closed");var f=qa(),h=pa(4);ra(q);ra(h);try{this.db.handleError(Ua(this.db.db,this.sb,-1,q,h));this.sb=y(h,"i32");var p=y(q,"i32");if(p===0)return this.ob(),{done:!0};this.fb=new c(p,this.db);this.db.tb[p]=this.fb;return{value:this.fb,done:!1}}catch(r){throw this.Ab=A(this.sb),this.ob(),r;}finally{sa(f)}};e.prototype.ob=function(){ja(this.nb);this.nb=null};e.prototype["return"]=
function(){this.fb!==null&&(this.fb.hb(),this.fb=null);this.ob();return{done:!0}};e.prototype.cc=function(){return this.Ab!==null?this.Ab:A(this.sb)};typeof Symbol==="function"&&typeof Symbol.iterator==="symbol"&&(e.prototype[Symbol.iterator]=function(){return this});g.prototype.run=function(f,h){if(!this.db)throw"Database closed";if(h){f=this.Bb(f,h);try{f.step()}finally{f.hb()}}else{f=ka(f);try{this.handleError(Ba(this.db,f,0,0,q))}finally{ja(f)}}return this};g.prototype.exec=function(f,h,p){if(!this.db)throw"Database closed";
var r=qa(),u=null,w=null,x=null;try{x=w=ka(f);var G=pa(4);for(f=[];y(x,"i8")!==0;){ra(q);ra(G);this.handleError(Ua(this.db,x,-1,q,G));var S=y(q,"i32");x=y(G,"i32");if(S!==0){var D=null;u=new c(S,this);for(h!=null&&u.bind(h);u.step();)D===null&&(D={columns:u.yb(),values:[]},f.push(D)),D.values.push(u.get(null,p));u.hb()}}return f}catch(K){throw u&&u.hb(),K;}finally{w&&ja(w),sa(r)}};g.prototype.Yb=function(f,h,p,r,u){typeof h==="function"&&(r=p,p=h,h=void 0);f=this.Bb(f,h);try{for(;f.step();)p(f.Ib(null,
u))}finally{f.hb()}if(typeof r==="function")return r()};g.prototype.Bb=function(f,h){f=ka(f);try{ra(q),this.handleError(Ua(this.db,f,-1,q,0))}finally{ja(f)}f=y(q,"i32");if(f===0)throw"Nothing to prepare";var p=new c(f,this);h!=null&&p.bind(h);return this.tb[f]=p};g.prototype.fc=function(f){return new e(f,this)};g.prototype.$b=function(){if(!this.db)throw Error("Database closed");var f=this.filename+"_export";la(f,[]);var h=0,p=0;try{var r=B(f).node,u=null,w=r.Ta.write;r.Ta=Object.create(r.Ta);r.Ta.write=
function(S,D,K,V,T){if(u===null)return w(S,D,K,V,T);r.Ya.set(D.subarray(K,K+V),T);r.Za=Math.max(r.Za,T+V);return V};var x=U(f,q);h=y(q,"i32");if(x!==0)throw Error(ia(h));p=Aa(h,"main",this.db,"main");if(p===0)throw Error(ia(h));x=na(p,0);if(x===0){var G=this.exec("PRAGMA main.page_count; PRAGMA main.page_size");u=new Uint8Array(G[0].values[0][0]*G[1].values[0][0]);r.Ya=u;x=na(p,-1)}if(x===5||x===6)throw Error("Unable to export: SQLite is busy or locked. Finish active write transactions before exporting.");
if(x!==101)throw Error(ia(h));x=ca(p);p=0;if(x!==0)throw Error(ia(h));x=ma(h);if(x!==0)throw Error(ia(h));h=0;u=new Uint8Array(r.Ya.buffer,r.Ya.byteOffset,r.Za);u.length>0&&(u[18]=1,u[19]=1);return u}finally{p!==0&&ca(p),h!==0&&ma(h),ta("/"+f)}};g.prototype.close=function(){this.db!==null&&(Object.values(this.tb).forEach(function(f){f.hb()}),this.ab.forEach(t),this.ab.clear(),this.ib&&(oa(this.ib),this.ib=void 0),this.handleError(ma(this.db)),ta("/"+this.filename),this.db=null)};g.prototype.handleError=
function(f){if(f===0)return null;var h=ia(this.db);var p=Ec(this.db);(p&255)!==(f&255)&&(p=f);f=Error(h);f.code=F[p];f.errcode=p;throw f;};g.prototype.dc=function(){return N(this.db)};g.prototype.Xb=function(f,h){var p=m(f,h.length);this.ab.has(p)&&(t(this.ab.get(p)),this.ab.delete(p));var r=ua(function(u,w,x){w=d(w,x);try{var G=h.apply(null,w)}catch(S){a(u,S);return}b(u,G)},"viii");this.ab.set(p,[r]);this.handleError(Bb(this.db,f,h.length,1,0,r,0,0,0));return this};g.prototype.Wb=function(f,h){function p(D){x.has(D)||
x.set(D,r());return x.get(D)}var r=h.init||function(){return null},u=h.finalize||function(D){return D},w=h.step;if(!w)throw"An aggregate function must have a step function in "+f;var x=new Map;h=m(f,w.length-1);this.ab.has(h)&&(t(this.ab.get(h)),this.ab.delete(h));var G=ua(function(D,K,V){var T=Cb(D,1),Wa=p(T);K=d(K,V);Wa=[Wa].concat(K);try{x.set(T,w.apply(null,Wa))}catch(Pc){x.delete(T),a(D,Pc)}},"viii"),S=ua(function(D){var K=Cb(D,1);try{var V=u(p(K))}catch(T){x.delete(K);a(D,T);return}b(D,V);x.delete(K)},
"vi");this.ab.set(h,[G,S]);this.handleError(Bb(this.db,f,w.length-1,1,0,0,G,S,0));return this};g.prototype.nc=function(f){this.ib&&(Db(this.db,0,0),oa(this.ib),this.ib=void 0);if(!f)return this;this.ib=ua(function(h,p,r,u,w){switch(p){case 18:h="insert";break;case 23:h="update";break;case 9:h="delete";break;default:throw"unknown operationCode in updateHook callback: "+p;}r=A(r);u=A(u);if(w>Number.MAX_SAFE_INTEGER)throw"rowId too big to fit inside a Number";f(h,r,u,Number(w))},"viiiij");Db(this.db,
this.ib,0);return this};c.prototype.bind=c.prototype.bind;c.prototype.step=c.prototype.step;c.prototype.get=c.prototype.get;c.prototype.getColumnNames=c.prototype.yb;c.prototype.getAsObject=c.prototype.Ib;c.prototype.getSQL=c.prototype.ec;c.prototype.getNormalizedSQL=c.prototype.bc;c.prototype.run=c.prototype.run;c.prototype.reset=c.prototype.reset;c.prototype.freemem=c.prototype.freemem;c.prototype.free=c.prototype.hb;e.prototype.next=e.prototype.next;e.prototype.getRemainingSQL=e.prototype.cc;g.prototype.run=
g.prototype.run;g.prototype.exec=g.prototype.exec;g.prototype.each=g.prototype.Yb;g.prototype.prepare=g.prototype.Bb;g.prototype.iterateStatements=g.prototype.fc;g.prototype["export"]=g.prototype.$b;g.prototype.close=g.prototype.close;g.prototype.handleError=g.prototype.handleError;g.prototype.getRowsModified=g.prototype.dc;g.prototype.create_function=g.prototype.Xb;g.prototype.create_aggregate=g.prototype.Wb;g.prototype.updateHook=g.prototype.nc;k.Database=g;k.constants=Object.freeze(ea)};
var va="./this.program",wa=(a,b)=>{throw b;},xa=globalThis.document?.currentScript?.src;typeof __filename!=="undefined"?xa=__filename:ba&&(xa=self.location.href);var ya="",za,Ca;
if(da){var fs=require("node:fs");ya=__dirname+"/";Ca=a=>{a=Da(a)?new URL(a):a;return fs.readFileSync(a)};za=async a=>{a=Da(a)?new URL(a):a;return fs.readFileSync(a,void 0)};process.argv.length>1&&(va=process.argv[1].replace(/\\/g,"/"));process.argv.slice(2);typeof module!=="undefined"&&(module.exports=k);wa=(a,b)=>{process.exitCode=a;throw b;}}else if(aa||ba){try{ya=(new URL(".",xa)).href}catch{}ba&&(Ca=a=>{var b=new XMLHttpRequest;b.open("GET",a,!1);b.responseType="arraybuffer";b.send(null);return new Uint8Array(b.response)});
za=async a=>{if(Da(a))return new Promise((d,c)=>{var e=new XMLHttpRequest;e.open("GET",a,!0);e.responseType="arraybuffer";e.onload=()=>{e.status==200||e.status==0&&e.response?d(e.response):c(e.status)};e.onerror=c;e.send(null)});var b=await fetch(a,{credentials:"same-origin"});if(b.ok)return b.arrayBuffer();throw Error(b.status+" : "+b.url);}}var Ea=console.log.bind(console),C=console.error.bind(console),Fa,Ga=!1,Ha,Da=a=>a.startsWith("file://");
function Ia(){if(!v?.buffer?.resizable){var a=Ja.buffer;v=new Int8Array(a);Ka=new Int16Array(a);E=new Uint8Array(a);H=new Int32Array(a);I=new Uint32Array(a);La=new Float32Array(a);Ma=new Float64Array(a);J=new BigInt64Array(a)}}function Na(){var a=k.preRun;a&&(typeof a==="function"&&(a=[a]),Oa.push(...a));for(a=Oa;a.length>0;)a.shift()(k)}function Pa(){var a=k.postRun;a&&(typeof a==="function"&&(a=[a]),Qa.push(...a));for(a=Qa;a.length>0;)a.shift()(k)}
function Ra(a){k.onAbort?.(a);a=`Aborted(${a})`;C(a);Ga=!0;throw new WebAssembly.RuntimeError(a+". Build with -sASSERTIONS for more info.");}var Sa;async function Ta(a){if(!Fa)try{return await za(a)}catch{}if(a==Sa&&Fa)a=new Uint8Array(Fa);else if(Ca)a=Ca(a);else throw"both async and sync fetching of the wasm failed";return a}async function Va(a,b){try{var d=await Ta(a);return await WebAssembly.instantiate(d,b)}catch(c){C(`failed to asynchronously prepare wasm: ${c}`),Ra(c)}}
async function Xa(a){var b=Sa;if(!Fa&&!Da(b)&&!da)try{var d=fetch(b,{credentials:"same-origin"});return await WebAssembly.instantiateStreaming(d,a)}catch(c){C(`wasm streaming compile failed: ${c}`),C("falling back to ArrayBuffer instantiation")}return Va(b,a)}class Ya{name="ExitStatus";constructor(a){this.message=`Program terminated with exit(${a})`;this.status=a}}
var v,Qa=[],Oa=[],Za=!0,E,$a=new TextDecoder,ab=(a,b,d,c)=>{d=b+d;if(c)return d;for(;a[b]&&!(b>=d);)++b;return b},A=(a,b,d)=>a?$a.decode(E.subarray(a,ab(E,a,b,d))):"",bb=(a,b)=>{for(var d=0,c=a.length-1;c>=0;c--){var e=a[c];e==="."?a.splice(c,1):e===".."?(a.splice(c,1),d++):d&&(a.splice(c,1),d--)}if(b)for(;d;d--)a.unshift("..");return a},cb=a=>{var b=a.charAt(0)==="/",d=a.slice(-1)==="/";(a=bb(a.split("/").filter(c=>!!c),!b).join("/"))||b||(a=".");a&&d&&(a+="/");return(b?"/":"")+a},db=a=>{var b=/^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/.exec(a).slice(1);
a=b[0];b=b[1];if(!a&&!b)return".";b&&=b.slice(0,-1);return a+b},eb=a=>a&&a.match(/([^\/]+|\/)\/*$/)[1],fb=(...a)=>{for(var b="",d=!1,c=a.length-1;c>=-1&&!d;c--){d=c>=0?a[c]:"/";if(typeof d!=="string")throw new TypeError("Arguments to path.resolve must be strings");if(!d)return"";b=d+"/"+b;d=d.charAt(0)==="/"}b=bb(b.split("/").filter(e=>!!e),!d).join("/");return(d?"/":"")+b||"."},l=a=>{for(var b=0,d=0;d<a.length;++d){var c=a.codePointAt(d);c<=127?b++:c<=2047?b+=2:c<=65535?b+=3:(b+=4,d++)}return b},
L=(a,b,d,c)=>{if(!(c>0))return 0;var e=d;c=d+c-1;for(var g=0;g<a.length;++g){var m=a.codePointAt(g);if(m<=127){if(d>=c)break;b[d++]=m}else if(m<=2047){if(d+1>=c)break;b[d++]=192|m>>6;b[d++]=128|m&63}else if(m<=65535){if(d+2>=c)break;b[d++]=224|m>>12;b[d++]=128|m>>6&63;b[d++]=128|m&63}else{if(d+3>=c)break;b[d++]=240|m>>18;b[d++]=128|m>>12&63;b[d++]=128|m>>6&63;b[d++]=128|m&63;g++}}b[d]=0;return d-e},gb=a=>{var b=Array(l(a)+1);a=L(a,b,0,b.length);b.length=a;return b},hb=(a,b)=>{var d=0;a&&(d|=365);
b&&(d|=146);return d},M={cb:null,gb(){return M.createNode(null,"/",16895,0)},createNode(a,b,d,c){if((d&61440)===24576||(d&61440)===4096)throw new O(63);M.cb||(M.cb={dir:{node:{$a:M.Ua.$a,eb:M.Ua.eb,lookup:M.Ua.lookup,pb:M.Ua.pb,rename:M.Ua.rename,unlink:M.Ua.unlink,rmdir:M.Ua.rmdir,readdir:M.Ua.readdir,symlink:M.Ua.symlink},stream:{bb:M.Ta.bb}},file:{node:{$a:M.Ua.$a,eb:M.Ua.eb},stream:{bb:M.Ta.bb,read:M.Ta.read,write:M.Ta.write,qb:M.Ta.qb,rb:M.Ta.rb}},link:{node:{$a:M.Ua.$a,eb:M.Ua.eb,readlink:M.Ua.readlink},
stream:{}},Gb:{node:{$a:M.Ua.$a,eb:M.Ua.eb},stream:ib}});d=jb(a,b,d,c);P(d.mode)?(d.Ua=M.cb.dir.node,d.Ta=M.cb.dir.stream,d.Ya={}):(d.mode&61440)===32768?(d.Ua=M.cb.file.node,d.Ta=M.cb.file.stream,d.Za=0,d.Ya=M.Zb??(M.Zb=new Uint8Array(0))):(d.mode&61440)===40960?(d.Ua=M.cb.link.node,d.Ta=M.cb.link.stream):(d.mode&61440)===8192&&(d.Ua=M.cb.Gb.node,d.Ta=M.cb.Gb.stream);d.atime=d.mtime=d.ctime=Date.now();a&&(a.Ya[b]=d,a.atime=a.mtime=a.ctime=d.atime);return d},Ua:{$a(a){var b={};b.dev=(a.mode&61440)===
8192?a.id:1;b.ino=a.id;b.mode=a.mode;b.nlink=1;b.uid=0;b.gid=0;b.rdev=a.rdev;P(a.mode)?b.size=4096:(a.mode&61440)===32768?b.size=a.Za:(a.mode&61440)===40960?b.size=a.link.length:b.size=0;b.atime=new Date(a.atime);b.mtime=new Date(a.mtime);b.ctime=new Date(a.ctime);b.blksize=4096;b.blocks=Math.ceil(b.size/b.blksize);return b},eb(a,b){for(var d of["mode","atime","mtime","ctime"])b[d]!=null&&(a[d]=b[d]);b.size!==void 0&&(b=b.size,a.Za!=b&&(d=a.Ya,a.Ya=new Uint8Array(b),a.Ya.set(d.subarray(0,Math.min(b,
a.Za))),a.Za=b))},lookup(){M.wb||(M.wb=new O(44),M.wb.stack="<generic error, no stack>");throw M.wb;},pb(a,b,d,c){return M.createNode(a,b,d,c)},rename(a,b,d){try{var c=kb(b,d)}catch(g){}if(c&&P(a.mode))for(var e in c.Ya)throw new O(55);delete a.parent.Ya[a.name];b.Ya[d]=a;a.name=d;b.ctime=b.mtime=a.parent.ctime=a.parent.mtime=Date.now()},unlink(a,b){delete a.Ya[b];a.ctime=a.mtime=Date.now()},rmdir(a,b){var d=kb(a,b),c;for(c in d.Ya)throw new O(55);delete a.Ya[b];a.ctime=a.mtime=Date.now()},readdir(a){return[".",
"..",...Object.keys(a.Ya)]},symlink(a,b,d){a=M.createNode(a,b,41471,0);a.link=d;return a},readlink(a){if((a.mode&61440)!==40960)throw new O(28);return a.link}},Ta:{read(a,b,d,c,e){if(e>=a.node.Za)return 0;c=Math.min(a.node.Za-e,c);b.set(a.node.Ya.subarray(e,e+c),d);return c},write(a,b,d,c,e,g){b.buffer===v.buffer&&(g=!1);if(!c)return 0;a=a.node;a.mtime=a.ctime=Date.now();if(g)a.Ya=b.subarray(d,d+c),a.Za=c;else if(a.Za||e){g=e+c;var m=a.Ya.length;m>=g||(g=Math.max(g,m*(m<1048576?2:1.125)>>>0),m&&(g=
Math.max(g,256)),m=a.Ya.subarray(0,a.Za),a.Ya=new Uint8Array(g),a.Ya.set(m));a.Ya.set(b.subarray(d,d+c),e);a.Za=Math.max(a.Za,e+c)}else a.Ya=b.slice(d,d+c),a.Za=c;return c},bb(a,b,d){d===1?b+=a.position:d===2&&(a.node.mode&61440)===32768&&(b+=a.node.Za);if(b<0)throw new O(28);return b},qb(a,b,d,c,e){if((a.node.mode&61440)!==32768)throw new O(43);a=a.node.Ya;if(e&2||a.buffer!==v.buffer){e=!0;c=Math.ceil(b/65536)*65536;var g=lb(65536,c);g&&E.fill(0,g,g+c);c=g;if(!c)throw new O(48);if(a){if(d>0||d+b<
a.length)a=a.subarray?a.subarray(d,d+b):a.slice(d,d+b);v.set(a,c)}}else e=!1,c=a.byteOffset;return{lc:c,Ob:e}},rb(a,b,d,c){M.Ta.write(a,b,0,c,d,!1);return 0}}},mb=[],nb=a=>{var b=ab(a,0);return $a.decode(a.buffer?a.subarray(0,b):new Uint8Array(a.slice(0,b)))},ob=[];function pb(a,b){ob[a]={input:[],output:[],mb:b};qb(a,rb)}
var rb={open(a){var b=ob[a.node.rdev];if(!b)throw new O(43);a.tty=b;a.seekable=!1},close(a){a.tty.mb.fsync(a.tty)},fsync(a){a.tty.mb.fsync(a.tty)},read(a,b,d,c){if(!a.tty||!a.tty.mb.Lb)throw new O(60);for(var e=0,g=0;g<c;g++){try{var m=a.tty.mb.Lb(a.tty)}catch(t){throw new O(29);}if(m===void 0&&!e)throw new O(6);if(m===null||m===void 0)break;e++;b[d+g]=m;if(m===10)break}e&&(a.node.atime=Date.now());return e},write(a,b,d,c){if(!a.tty||!a.tty.mb.Cb)throw new O(60);try{for(var e=0;e<c;e++)a.tty.mb.Cb(a.tty,
b[d+e])}catch(g){throw new O(29);}c&&(a.node.mtime=a.node.ctime=Date.now());return e}},sb={Lb(){a:{if(!mb.length){var a=null;if(da){var b=Buffer.alloc(256),d=0;try{d=fs.readSync(process.stdin.fd,b,0,256)}catch(c){if(c.toString().includes("EOF"))d=0;else throw c;}d>0&&(a=b.toString("utf-8",0,d))}else globalThis.window?.prompt&&(a=window.prompt("Input: "),a!==null&&(a+="\n"));if(!a){a=null;break a}mb=gb(a)}a=mb.shift()}return a},Cb(a,b){b===null||b===10?(Ea(nb(a.output)),a.output=[]):b!=0&&a.output.push(b)},
fsync(a){a.output?.length>0&&(Ea(nb(a.output)),a.output=[])},vc(){return{rc:25856,tc:5,qc:191,sc:35387,oc:[3,28,127,21,4,0,1,0,17,19,26,0,18,15,23,22,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]}},wc(){return 0},xc(){return[24,80]}},tb={Cb(a,b){b===null||b===10?(C(nb(a.output)),a.output=[]):b!=0&&a.output.push(b)},fsync(a){a.output?.length>0&&(C(nb(a.output)),a.output=[])}},xb=()=>{if(da){var a=require("node:crypto");return b=>(a.randomFillSync(b),0)}return b=>(crypto.getRandomValues(b),0)},Eb=a=>(Eb=xb())(a),
Fb=null,Gb={},Hb=[],Ib=1,Q=[],Jb=!1,Kb=!0,Lb={},O=class{name="ErrnoError";constructor(a){this.Wa=a}},Mb=class{shared={};node=null;get flags(){return this.shared.flags}set flags(a){this.shared.flags=a}get position(){return this.shared.position}set position(a){this.shared.position=a}},Nb=class{Ua={};Ta={};kb=null;listeners=null;Db=0;constructor(a,b,d,c){a||=this;this.parent=a;this.gb=a.gb;this.id=Ib++;this.name=b;this.mode=d;this.rdev=c;this.atime=this.mtime=this.ctime=Date.now()}get read(){return(this.mode&
365)===365}set read(a){a?this.mode|=365:this.mode&=-366}get write(){return(this.mode&146)===146}set write(a){a?this.mode|=146:this.mode&=-147}kc(){if(this.listeners){var a;for(b of this.listeners)b.exclusive?(a||=[]).push(b):b.Vb(32);if(a){var b=(this.Db||0)%a.length;this.Db=b+1;a[b].Vb(32)}}}};
function B(a,b={}){if(!a)throw new O(44);b.xb??(b.xb=!0);a.charAt(0)==="/"||(a="//"+a);var d=0;a:for(;d<40;d++){a=a.split("/").filter(t=>!!t);for(var c=Fb,e="/",g=0;g<a.length;g++){var m=g===a.length-1;if(m&&b.parent)break;if(a[g]!==".")if(a[g]==="..")if(e=db(e),c===c.parent){a=e+"/"+a.slice(g+1).join("/");d--;continue a}else c=c.parent;else{e=cb(e+"/"+a[g]);try{c=kb(c,a[g])}catch(t){if(t?.Wa===44&&m&&b.jc)return{path:e};throw t;}!c.kb||m&&!b.xb||(c=c.kb.root);if((c.mode&61440)===40960&&(!m||b.jb)){if(!c.Ua.readlink)throw new O(52);
c=c.Ua.readlink(c);c.charAt(0)==="/"||(c=db(e)+"/"+c);a=c+"/"+a.slice(g+1).join("/");continue a}}}return{path:e,node:c}}throw new O(32);}function Ob(a){for(var b;;){if(a===a.parent)return a=a.gb.Nb,b?a[a.length-1]!=="/"?`${a}/${b}`:a+b:a;b=b?`${a.name}/${b}`:a.name;a=a.parent}}function Pb(a,b){for(var d=0,c=0;c<b.length;c++)d=(d<<5)-d+b.charCodeAt(c)|0;return(a+d>>>0)%Q.length}
function Qb(a){var b=Pb(a.parent.id,a.name);if(Q[b]===a)Q[b]=a.lb;else for(b=Q[b];b;){if(b.lb===a){b.lb=a.lb;break}b=b.lb}}function kb(a,b){var d=P(a.mode)?(d=Rb(a,"x"))?d:a.Ua.lookup?0:2:54;if(d)throw new O(d);for(d=Q[Pb(a.id,b)];d;d=d.lb){var c=d.name;if(d.parent.id===a.id&&c===b)return d}return a.Ua.lookup(a,b)}function jb(a,b,d,c){a=new Nb(a,b,d,c);b=Pb(a.parent.id,a.name);a.lb=Q[b];return Q[b]=a}function P(a){return(a&61440)===16384}
function Rb(a,b){return Kb?0:b.includes("r")&&!(a.mode&292)||b.includes("w")&&!(a.mode&146)||b.includes("x")&&!(a.mode&73)?2:0}function Sb(a,b){if(!P(a.mode))return 54;try{return kb(a,b),20}catch(d){}return Rb(a,"wx")}function Tb(a,b,d){try{var c=kb(a,b)}catch(e){return e.Wa}if(a=Rb(a,"wx"))return a;if(d){if(!P(c.mode))return 54;if(c===c.parent||Ob(c)==="/")return 10}else if(P(c.mode))return 31;return 0}function Ub(a){if(!a)throw new O(63);return a}
function R(a){a=Hb[a];if(!a)throw new O(8);return a}function Vb(a,b=-1){a=Object.assign(new Mb,a);if(b==-1)a:{for(b=0;b<=4096;b++)if(!Hb[b])break a;throw new O(33);}a.fd=b;return Hb[b]=a}function Wb(a,b=-1){a=Vb(a,b);a.Ta?.uc?.(a);return a}function Xb(a,b,d){var c=a?.Ta.eb;a=c?a:b;c??=b.Ua.eb;Ub(c);try{c(a,d)}catch(e){if(e instanceof RangeError)throw new O(22);throw e;}}var ib={open(a){a.Ta=Gb[a.node.rdev].Ta;a.Ta.open?.(a)},bb(){throw new O(70);}};function qb(a,b){Gb[a]={Ta:b}}
function Yb(a,b){var d=b==="/";if(d&&Fb)throw new O(10);if(!d&&b){var c=B(b,{xb:!1});b=c.path;c=c.node;if(c.kb)throw new O(10);if(!P(c.mode))throw new O(54);}b={type:a,yc:{},Nb:b,hc:[]};a=a.gb(b);a.gb=b;b.root=a;d?Fb=a:c&&(c.kb=b,c.gb&&c.gb.hc.push(b))}function Zb(a,b,d){var c=B(a,{parent:!0}).node;a=eb(a);if(!a)throw new O(28);if(a==="."||a==="..")throw new O(20);var e=Sb(c,a);if(e)throw new O(e);if(!c.Ua.pb)throw new O(63);return c.Ua.pb(c,a,b,d)}
function $b(a,b=438){return Zb(a,b&4095|32768,0)}function W(a,b=511){return Zb(a,b&1023|16384,0)}function ac(a,b,d){typeof d==="undefined"&&(d=b,b=438);Zb(a,b|8192,d)}function bc(a,b){if(!fb(a))throw new O(44);var d=B(b,{parent:!0}).node;if(!d)throw new O(44);b=eb(b);var c=Sb(d,b);if(c)throw new O(c);if(!d.Ua.symlink)throw new O(63);d.Ua.symlink(d,b,a)}
function cc(a){var b=B(a,{parent:!0}).node;a=eb(a);var d=kb(b,a),c=Tb(b,a,!0);if(c)throw new O(c);if(!b.Ua.rmdir)throw new O(63);if(d.kb)throw new O(10);b.Ua.rmdir(b,a);Qb(d)}function ta(a){var b=B(a,{parent:!0}).node;if(!b)throw new O(44);a=eb(a);var d=kb(b,a),c=Tb(b,a,!1);if(c)throw new O(c);if(!b.Ua.unlink)throw new O(63);if(d.kb)throw new O(10);b.Ua.unlink(b,a);Qb(d)}function dc(a,b=!1){a=B(a,{jb:!b}).node;return Ub(a.Ua.$a)(a)}
function ec(a,b,d){Xb(a,b,{mode:d&4095|b.mode&-4096,ctime:Date.now(),Hb:!1})}function fc(a,b){a=typeof a==="string"?B(a,{jb:!0}).node:a;ec(null,a,b)}function hc(a,b,d){if(P(b.mode))throw new O(31);if((b.mode&61440)!==32768)throw new O(28);var c=Rb(b,"w");if(c)throw new O(c);Xb(a,b,{size:d,timestamp:Date.now()})}function ic(a,b,d,c=!1){a=B(a,{jb:!c});Xb(null,a.node,{atime:b,mtime:d,Hb:c})}
function jc(a,b,d=438){if(a==="")throw new O(44);if(typeof b==="string"){var c={r:0,"r+":2,w:577,"w+":578,a:1089,"a+":1090}[b];if(typeof c==="undefined")throw Error(`Unknown file open mode: ${b}`);b=c}d=b&64?d&4095|32768:0;if(typeof a==="object")c=a;else{var e=a.endsWith("/");a=B(a,{jb:!(b&131072),jc:!0});c=a.node;a=a.path}var g=!1;if(b&64)if(c){if(b&128)throw new O(20);}else{if(e)throw new O(31);c=Zb(a,d|511,0);g=!0}if(!c)throw new O(44);(c.mode&61440)===8192&&(b&=-513);if(b&65536&&!P(c.mode))throw new O(54);
if(!g&&(c?(c.mode&61440)===40960?e=32:(e=["r","w","rw"][b&3],b&512&&(e+="w"),e=P(c.mode)&&(e!=="r"||b&576)?31:Rb(c,e)):e=44,e))throw new O(e);b&512&&!g&&(e=c,e=typeof e==="string"?B(e,{jb:!0}).node:e,hc(null,e,0));b&=-131713;e=Vb({node:c,path:Ob(c),flags:b,seekable:!0,position:0,Ta:c.Ta,mc:[],error:!1});e.Ta.open&&e.Ta.open(e);g&&fc(c,d&511);!k.logReadFiles||b&1||a in Lb||(Lb[a]=1,C(`read file: ${a}`));return e}
function kc(a){if(a.fd===null)throw new O(8);a.zb&&(a.zb=null);a.node?.kc();try{a.Ta.close&&a.Ta.close(a)}catch(b){throw b;}finally{Hb[a.fd]=null}a.fd=null}function lc(a,b,d){if(a.fd===null)throw new O(8);if(!a.seekable||!a.Ta.bb)throw new O(70);if(d!=0&&d!=1&&d!=2)throw new O(28);a.position=a.Ta.bb(a,b,d);a.mc=[]}
function mc(a,b,d,c,e){if(c<0||e<0)throw new O(28);if(a.fd===null)throw new O(8);if((a.flags&2097155)===0)throw new O(8);if(P(a.node.mode))throw new O(31);if(!a.Ta.write)throw new O(28);a.seekable&&a.flags&1024&&lc(a,0,2);var g=typeof e!=="undefined";if(!g)e=a.position;else if(!a.seekable)throw new O(70);b=a.Ta.write(a,b,d,c,e,void 0);g||(a.position+=b);return b}
function Qc(){var a,b,d;Jb=!0;a??=k.stdin;b??=k.stdout;d??=k.stderr;a?X("stdin",a):bc("/dev/tty","/dev/stdin");b?X("stdout",null,b):bc("/dev/tty","/dev/stdout");d?X("stderr",null,d):bc("/dev/tty1","/dev/stderr");jc("/dev/stdin",0);jc("/dev/stdout",1);jc("/dev/stderr",1)}
function la(a,b){var d="/",c=a;d&&(d=typeof d==="string"?d:Ob(d),c=a?cb(d+"/"+a):d);a=hb(!0,!0);c=$b(c,a);b&&(typeof b==="string"&&(b=gb(b)),b.subarray||(b=new Uint8Array(b)),fc(c,a|146),d=jc(c,577),mc(d,b,0,b.length,0),kc(d),fc(c,a))}
function X(a,b,d){a=cb("/dev/"+a);var c=hb(!!b,!!d);X.Mb??(X.Mb=64);var e=X.Mb++<<8|0;qb(e,{open(g){g.seekable=!1},close(){d?.buffer?.length&&d(10)},read(g,m,t,z){for(var q=0,n=0;n<z;n++){try{var F=b()}catch(U){throw new O(29);}if(F===void 0&&!q)throw new O(6);if(F===null||F===void 0)break;q++;m[t+n]=F}q&&(g.node.atime=Date.now());return q},write(g,m,t,z){for(var q=0;q<z;q++)try{d(m[t+q])}catch(n){throw new O(29);}z&&(g.node.mtime=g.node.ctime=Date.now());return q}});ac(a,c,e)}var Y={},H,J,I;
function Rc(a,b,d=!1){if(b.charAt(0)==="/")return b;a=a===-100?"/":R(a).path;if(b.length==0){if(!d)throw new O(44);return a}return a+"/"+b}
function Sc(a,b){I[a>>2]=b.dev;I[a+4>>2]=b.mode;I[a+8>>2]=b.nlink;I[a+12>>2]=b.uid;I[a+16>>2]=b.gid;I[a+20>>2]=b.rdev;J[a+24>>3]=BigInt(b.size);H[a+32>>2]=4096;H[a+36>>2]=b.blocks;var d=b.atime.getTime(),c=b.mtime.getTime(),e=b.ctime.getTime();J[a+40>>3]=BigInt(Math.floor(d/1E3));I[a+48>>2]=d%1E3*1E3*1E3;J[a+56>>3]=BigInt(Math.floor(c/1E3));I[a+64>>2]=c%1E3*1E3*1E3;J[a+72>>3]=BigInt(Math.floor(e/1E3));I[a+80>>2]=e%1E3*1E3*1E3;J[a+88>>3]=BigInt(b.ino);return 0}
var Tc=void 0,Ka,Uc=()=>{var a=H[+Tc>>2];Tc+=4;return a},Vc=0,Wc=[0,31,60,91,121,152,182,213,244,274,305,335],Xc=[0,31,59,90,120,151,181,212,243,273,304,334],Yc=a=>{Ha=a;Za||Vc>0||(k.onExit?.(a),Ga=!0);wa(a,new Ya(a))},Zc={},$c={},bd=()=>{if(!ad){var a={USER:"web_user",LOGNAME:"web_user",PATH:"/",PWD:"/",HOME:"/home/web_user",LANG:(globalThis.navigator?.language??"C").replace("-","_")+".UTF-8",_:va},b;for(b in $c)$c[b]===void 0?delete a[b]:a[b]=$c[b];var d=[];for(b in a)d.push(`${b}=${a[b]}`);ad=
d}return ad},ad,La,Ma;function ra(a){var b="i32";b.endsWith("*")&&(b="*");switch(b){case "i1":v[a]=0;break;case "i8":v[a]=0;break;case "i16":Ka[a>>1]=0;break;case "i32":H[a>>2]=0;break;case "i64":J[a>>3]=BigInt(0);break;case "float":La[a>>2]=0;break;case "double":Ma[a>>3]=0;break;case "*":I[a>>2]=0;break;default:Ra(`invalid type for setValue: ${b}`)}}
function y(a,b="i8"){b.endsWith("*")&&(b="*");switch(b){case "i1":return v[a];case "i8":return v[a];case "i16":return Ka[a>>1];case "i32":return H[a>>2];case "i64":return J[a>>3];case "float":return La[a>>2];case "double":return Ma[a>>3];case "*":return I[a>>2];default:Ra(`invalid type for getValue: ${b}`)}}
var cd=(a,b,d,c)=>{var e={string:q=>{var n=0;if(q!==null&&q!==void 0&&q!==0){n=l(q)+1;var F=pa(n);L(q,E,F,n);n=F}return n},array:q=>{var n=pa(q.length);v.set(q,n);return n}};a=k["_"+a];var g=[],m=0;if(c)for(var t=0;t<c.length;t++){var z=e[d[t]];z?(m||=qa(),g[t]=z(c[t])):g[t]=c[t]}d=a(...g);return d=function(q){m&&sa(m);return b==="string"?A(q):b==="boolean"?!!q:q}(d)},ka=a=>{var b=l(a)+1,d=ha(b);d&&L(a,E,d,b);return d},dd=[],ed,oa=a=>{ed.delete(Z.get(a));Z.set(a,null);dd.push(a)},fd=a=>{var b=a.length;
return[b%128|128,b>>7,...a]},gd={i:127,p:127,j:126,f:125,d:124,e:111},hd=a=>fd(Array.from(a,b=>gd[b])),ua=(a,b)=>{if(!ed){ed=new WeakMap;var d=Z.length;if(ed)for(var c=0;c<0+d;c++){var e=Z.get(c);e&&ed.set(e,c)}}if(d=ed.get(a)||0)return d;d=dd.length?dd.pop():Z.grow(1);try{Z.set(d,a)}catch(g){if(!(g instanceof TypeError))throw g;b=Uint8Array.of(0,97,115,109,1,0,0,0,1,...fd([1,96,...hd(b.slice(1)),...hd(b[0]==="v"?"":b[0])]),2,7,1,1,101,1,102,0,0,7,5,1,1,102,0,0);b=new WebAssembly.Module(b);b=(new WebAssembly.Instance(b,
{e:{f:a}})).exports.f;Z.set(d,b)}ed.set(a,d);return d};Q.length=4096;Yb(M,"/");W("/tmp");W("/home");W("/home/web_user");(function(){W("/dev");qb(259,{read:()=>0,write:(c,e,g,m)=>m,bb:()=>0});ac("/dev/null",259);pb(1280,sb);pb(1536,tb);ac("/dev/tty",1280);ac("/dev/tty1",1536);var a=new Uint8Array(1024),b=0,d=()=>{b||(Eb(a),b=a.byteLength);return a[--b]};X("random",d);X("urandom",d);W("/dev/shm");W("/dev/shm/tmp")})();
(function(){W("/proc");var a=W("/proc/self");W("/proc/self/fd");Yb({gb(){var b=jb(a,"fd",16895,73);b.Ta={bb:M.Ta.bb};b.Ua={lookup(d,c){d=+c;var e=R(d);d={parent:null,gb:{Nb:"fake"},Ua:{readlink:()=>e.path},id:d+1};return d.parent=d},readdir(){return Array.from(Hb.entries()).filter(([,d])=>d).map(([d])=>d.toString())}};return b}},"/proc/self/fd")})();k.noExitRuntime&&(Za=k.noExitRuntime);k.print&&(Ea=k.print);k.printErr&&(C=k.printErr);k.wasmBinary&&(Fa=k.wasmBinary);k.thisProgram&&(va=k.thisProgram);
var jd=k.preInit;if(jd)for(typeof jd==="function"&&(k.preInit=jd=[jd]);jd.length>0;)jd.shift()();k.stackSave=()=>qa();k.stackRestore=a=>sa(a);k.stackAlloc=a=>pa(a);k.cwrap=(a,b,d,c)=>{var e=!d||d.every(g=>g==="number"||g==="boolean");return b!=="string"&&e&&!c?k["_"+a]:(...g)=>cd(a,b,d,g)};k.addFunction=ua;k.removeFunction=oa;k.UTF8ToString=A;k.lengthBytesUTF8=l;k.stringToNewUTF8=ka;k.writeArrayToMemory=(a,b)=>{v.set(a,b)};
var ha,ja,lb,kd,sa,pa,qa,Ja,Z,ld={a:(a,b,d,c)=>Ra(`Assertion failed: ${A(a)}, at: `+[b?A(b):"unknown filename",d,c?A(c):"unknown function"]),i:function(a,b){try{return a=A(a),fc(a,b),0}catch(d){if(typeof Y==="undefined"||d.name!=="ErrnoError")throw d;return-d.Wa}},D:function(a,b,d){try{b=A(b);b=Rc(a,b);if(d&-8)return-28;var c=B(b,{jb:!0}).node;if(!c)return-44;a="";d&4&&(a+="r");d&2&&(a+="w");d&1&&(a+="x");return a&&Rb(c,a)?-2:0}catch(e){if(typeof Y==="undefined"||e.name!=="ErrnoError")throw e;return-e.Wa}},
j:function(a,b){try{var d=R(a);ec(d,d.node,b);return 0}catch(c){if(typeof Y==="undefined"||c.name!=="ErrnoError")throw c;return-c.Wa}},h:function(a){try{var b=R(a);Xb(b,b.node,{timestamp:Date.now(),Hb:!1});return 0}catch(d){if(typeof Y==="undefined"||d.name!=="ErrnoError")throw d;return-d.Wa}},b:function(a,b,d){Tc=d;try{var c=R(a);switch(b){case 0:var e=Uc();if(e<0)break;for(;Hb[e];)e++;return Wb(c,e).fd;case 1:case 2:return 0;case 3:return c.flags;case 4:return e=Uc(),c.flags=c.flags&-289793|e&289792,
0;case 12:return e=Uc(),Ka[e+0>>1]=2,0;case 13:case 14:return 0}return-28}catch(g){if(typeof Y==="undefined"||g.name!=="ErrnoError")throw g;return-g.Wa}},g:function(a,b){try{var d=R(a),c=d.node,e=d.Ta.$a;a=e?d:c;e??=c.Ua.$a;Ub(e);var g=e(a);return Sc(b,g)}catch(m){if(typeof Y==="undefined"||m.name!=="ErrnoError")throw m;return-m.Wa}},J:function(a,b){b=b<-9007199254740992||b>9007199254740992?NaN:Number(b);try{if(isNaN(b))return-22;var d=R(a);if(b<0||(d.flags&2097155)===0)throw new O(28);hc(d,d.node,
b);return 0}catch(c){if(typeof Y==="undefined"||c.name!=="ErrnoError")throw c;return-c.Wa}},I:function(a,b){try{if(!b)return-28;var d=l("/")+1;if(b<d)return-68;L("/",E,a,b);return d}catch(c){if(typeof Y==="undefined"||c.name!=="ErrnoError")throw c;return-c.Wa}},F:()=>0,M:function(a,b){try{return a=A(a),Sc(b,dc(a,!0))}catch(d){if(typeof Y==="undefined"||d.name!=="ErrnoError")throw d;return-d.Wa}},C:function(a,b,d){try{return b=A(b),b=Rc(a,b),W(b,d&-19),0}catch(c){if(typeof Y==="undefined"||c.name!==
"ErrnoError")throw c;return-c.Wa}},L:function(a,b,d,c){try{b=A(b);var e=c&256;b=Rc(a,b,c&4096);return Sc(d,e?dc(b,!0):dc(b))}catch(g){if(typeof Y==="undefined"||g.name!=="ErrnoError")throw g;return-g.Wa}},x:function(a,b,d,c){Tc=c;try{b=A(b);b=Rc(a,b);var e=c?Uc():0;d&64&&(e&=-19);return jc(b,d,e).fd}catch(g){if(typeof Y==="undefined"||g.name!=="ErrnoError")throw g;return-g.Wa}},s:function(a,b,d,c){try{b=A(b);b=Rc(a,b);if(c<=0)return-28;var e=B(b).node;if(!e)throw new O(44);if(!e.Ua.readlink)throw new O(28);
var g=e.Ua.readlink(e);var m=Math.min(c,l(g)),t=v[d+m];L(g,E,d,c+1);v[d+m]=t;return m}catch(z){if(typeof Y==="undefined"||z.name!=="ErrnoError")throw z;return-z.Wa}},r:function(a){try{return a=A(a),cc(a),0}catch(b){if(typeof Y==="undefined"||b.name!=="ErrnoError")throw b;return-b.Wa}},N:function(a,b){try{return a=A(a),Sc(b,dc(a))}catch(d){if(typeof Y==="undefined"||d.name!=="ErrnoError")throw d;return-d.Wa}},o:function(a,b,d){try{b=A(b);b=Rc(a,b);if(d)if(d===512)cc(b);else return-28;else ta(b);return 0}catch(c){if(typeof Y===
"undefined"||c.name!=="ErrnoError")throw c;return-c.Wa}},n:function(a,b,d,c){try{c&=256;b=A(b);b=Rc(a,b,!0);var e=Date.now();if(d){function t(z){var q=H[z+8>>2];return q==1073741823?e:q==1073741822?null:(I[z>>2]+H[z+4>>2]*4294967296)*1E3+Math.floor(q/1E6)}var g=t(d);var m=t(d+16)}else m=g=e;(m??g)!==null&&ic(b,g,m,c);return 0}catch(t){if(typeof Y==="undefined"||t.name!=="ErrnoError")throw t;return-t.Wa}},w:()=>Ra(""),v:()=>{Za=!1;Vc=0},A:function(a,b){a=a<-9007199254740992||a>9007199254740992?NaN:
Number(a);a=new Date(a*1E3);if(isNaN(a.getTime()))return 1;H[b>>2]=a.getSeconds();H[b+4>>2]=a.getMinutes();H[b+8>>2]=a.getHours();H[b+12>>2]=a.getDate();H[b+16>>2]=a.getMonth();H[b+20>>2]=a.getFullYear()-1900;H[b+24>>2]=a.getDay();var d=a.getFullYear();H[b+28>>2]=(d%4!==0||d%100===0&&d%400!==0?Xc:Wc)[a.getMonth()]+a.getDate()-1|0;H[b+36>>2]=-(a.getTimezoneOffset()*60);d=(new Date(a.getFullYear(),6,1)).getTimezoneOffset();var c=(new Date(a.getFullYear(),0,1)).getTimezoneOffset();H[b+32>>2]=(d!=c&&
a.getTimezoneOffset()==Math.min(c,d))|0;return 0},y:function(a,b,d,c,e,g,m){e=e<-9007199254740992||e>9007199254740992?NaN:Number(e);try{var t=R(c);if(b&2&&!(d&2)&&(t.flags&2097155)!==2)throw new O(2);if((t.flags&2097155)===1)throw new O(2);if(!t.Ta.qb)throw new O(43);if(!a)throw new O(28);var z=t.Ta.qb(t,a,e,b,d);var q=z.lc;H[g>>2]=z.Ob;I[m>>2]=q;return 0}catch(n){if(typeof Y==="undefined"||n.name!=="ErrnoError")throw n;return-n.Wa}},z:function(a,b,d,c,e,g){g=g<-9007199254740992||g>9007199254740992?
NaN:Number(g);try{var m=R(e);if(d&2){if((m.node.mode&61440)!==32768)throw new O(43);c&2||m.Ta.rb&&m.Ta.rb(m,E.subarray(a,a+b),g,b,c)}}catch(t){if(typeof Y==="undefined"||t.name!=="ErrnoError")throw t;return-t.Wa}},k:(a,b)=>{Zc[a]&&(clearTimeout(Zc[a].id),delete Zc[a]);if(!b)return 0;var d=setTimeout(()=>{delete Zc[a];var c=[a,performance.now()],e=kd;if(!Ga)try{e(...c)}catch(g){g instanceof Ya||g=="unwind"||wa(1,g)}finally{if(!(Za||Vc>0))try{Ha=c=Ha,Yc(c)}catch(g){g instanceof Ya||g=="unwind"||wa(1,
g)}}},b);Zc[a]={id:d,zc:b};return 0},B:(a,b,d,c)=>{var e=(new Date).getFullYear(),g=(new Date(e,0,1)).getTimezoneOffset();e=(new Date(e,6,1)).getTimezoneOffset();I[a>>2]=Math.max(g,e)*60;H[b>>2]=Number(g!=e);b=m=>{var t=Math.abs(m);return`UTC${m>=0?"-":"+"}${String(Math.floor(t/60)).padStart(2,"0")}${String(t%60).padStart(2,"0")}`};a=b(g);b=b(e);e<g?(L(a,E,d,17),L(b,E,c,17)):(L(a,E,c,17),L(b,E,d,17))},d:()=>Date.now(),p:()=>2147483648,c:()=>performance.now(),l:a=>{var b=E.length;a>>>=0;if(a>2147483648)return!1;
for(var d=1;d<=4;d*=2){var c=b*(1+.2/d);c=Math.min(c,a+100663296);a:{c=(Math.min(2147483648,Math.ceil(Math.max(a,c)/65536)*65536)-Ja.buffer.byteLength+65535)/65536|0;try{Ja.grow(c);Ia();var e=1;break a}catch(g){}e=void 0}if(e)return!0}return!1},G:(a,b)=>{var d=0,c=0,e;for(e of bd()){var g=b+d;I[a+c>>2]=g;d+=L(e,E,g,Infinity)+1;c+=4}return 0},H:(a,b)=>{var d=bd();I[a>>2]=d.length;a=0;for(var c of d)a+=l(c)+1;I[b>>2]=a;return 0},e:function(a){try{var b=R(a);kc(b);return 0}catch(d){if(typeof Y==="undefined"||
d.name!=="ErrnoError")throw d;return d.Wa}},m:function(a,b){try{var d=R(a);v[b]=d.tty?2:P(d.mode)?3:(d.mode&61440)===40960?7:4;Ka[b+2>>1]=0;J[b+8>>3]=BigInt(0);J[b+16>>3]=BigInt(0);return 0}catch(c){if(typeof Y==="undefined"||c.name!=="ErrnoError")throw c;return c.Wa}},t:function(a,b,d,c){try{a:{var e=R(a);a=b;for(var g,m=b=0;m<d;m++){var t=I[a>>2],z=I[a+4>>2];a+=8;try{var q=e,n=t,F=z,U=g,ma=v;if(F<0||U<0)throw new O(28);if(q.fd===null)throw new O(8);if((q.flags&2097155)===1)throw new O(8);if(P(q.node.mode))throw new O(31);
if(!q.Ta.read)throw new O(28);var Aa=typeof U!=="undefined";if(!Aa)U=q.position;else if(!q.seekable)throw new O(70);var na=q.Ta.read(q,ma,n,F,U);Aa||(q.position+=na);var ca=na}catch(N){if(b>0&&N instanceof O&&(N.Wa==6||N.Wa==6))break;throw N;}if(ca<0){var Ba=-1;break a}b+=ca;if(ca<z)break;typeof g!=="undefined"&&(g+=ca)}Ba=b}I[c>>2]=Ba;return 0}catch(N){if(typeof Y==="undefined"||N.name!=="ErrnoError")throw N;return N.Wa}},E:function(a,b,d,c){b=b<-9007199254740992||b>9007199254740992?NaN:Number(b);
try{if(isNaN(b))return 22;var e=R(a);lc(e,b,d);J[c>>3]=BigInt(e.position);e.zb&&!b&&d===0&&(e.zb=null);return 0}catch(g){if(typeof Y==="undefined"||g.name!=="ErrnoError")throw g;return g.Wa}},K:function(a){try{var b=R(a);return b.Ta?.fsync?.(b)}catch(d){if(typeof Y==="undefined"||d.name!=="ErrnoError")throw d;return d.Wa}},q:function(a,b,d,c){try{var e=R(a);a=b;if(d==1)var g=mc(e,v,I[a>>2],I[a+4>>2]);else{for(var m=b=0,t=a;m<d;m++,t+=8)b+=I[t+4>>2];var z=new Uint8Array(b);for(m=t=0;m<d;m++,a+=8){var q=
I[a>>2],n=I[a+4>>2];z.set(E.subarray(q,q+n),t);t+=n}g=mc(e,z,0,b)}I[c>>2]=g;return 0}catch(F){if(typeof Y==="undefined"||F.name!=="ErrnoError")throw F;return F.Wa}},u:Yc,f:function(a){console.warn("sql.js: legacy function "+A(a)+"() is deprecated and will be disabled by default in the next major version. Initialize with useOldExtensionFunctions: false to use native SQLite functions. See https://github.com/sql-js/sql.js/pull/647")}};
async function md(){Na();var a=k.setStatus;a&&(a("Running..."),await new Promise(b=>setTimeout(b,1)),setTimeout(a,1,""));Ga||(k.noFSInit||Jb||Qc(),nd.P(),Kb=!1,k.onRuntimeInitialized?.(),Pa())}var nd;
(async function(){function a(c){c=nd=c.exports;k._sqlite3_memory_used=c.R;k._sqlite3_free=c.S;k._sqlite3_value_text=c.T;k._sqlite3_prepare_v2=c.U;k._sqlite3_step=c.V;k._sqlite3_reset=c.W;k._sqlite3_exec=c.X;k._sqlite3_finalize=c.Y;k._sqlite3_column_name=c.Z;k._sqlite3_column_text=c._;k._sqlite3_column_type=c.$;k._sqlite3_errmsg=c.aa;k._sqlite3_backup_init=c.ba;k._sqlite3_backup_step=c.ca;k._sqlite3_backup_finish=c.da;k._sqlite3_clear_bindings=c.ea;k._sqlite3_value_blob=c.fa;k._sqlite3_value_bytes=
c.ga;k._sqlite3_value_double=c.ha;k._sqlite3_value_int=c.ia;k._sqlite3_value_type=c.ja;k._sqlite3_result_blob=c.ka;k._sqlite3_result_double=c.la;k._sqlite3_result_error=c.ma;k._sqlite3_result_int=c.na;k._sqlite3_result_int64=c.oa;k._sqlite3_result_null=c.pa;k._sqlite3_result_text=c.qa;k._sqlite3_aggregate_context=c.ra;k._sqlite3_column_count=c.sa;k._sqlite3_data_count=c.ta;k._sqlite3_column_blob=c.ua;k._sqlite3_column_bytes=c.va;k._sqlite3_column_double=c.wa;k._sqlite3_bind_blob=c.xa;k._sqlite3_bind_double=
c.ya;k._sqlite3_bind_int=c.za;k._sqlite3_bind_int64=c.Aa;k._sqlite3_bind_text=c.Ba;k._sqlite3_bind_parameter_index=c.Ca;k._sqlite3_sql=c.Da;k._sqlite3_normalized_sql=c.Ea;k._sqlite3_changes=c.Fa;k._sqlite3_close_v2=c.Ga;k._sqlite3_create_function_v2=c.Ha;k._sqlite3_update_hook=c.Ia;k._sqlite3_extended_errcode=c.Ja;k._sqlite3_open=c.Ka;ha=k._malloc=c.La;ja=k._free=c.Ma;k._RegisterExtensionFunctions=c.Na;lb=c.Oa;kd=c.Pa;sa=c.Qa;pa=c.Ra;qa=c.Sa;Ja=c.O;Z=c.Q;Ia();return nd}var b={a:ld},d=k.instantiateWasm;
if(d)return new Promise(c=>{d(b,e=>c(a(e)))});Sa??=k.locateFile?k.locateFile("sql-wasm.wasm",ya):ya+"sql-wasm.wasm";return function(c){return a(c.instance)}(await Xa(b))})().then(()=>md());


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
var sqlModuleReady;

function global_sqljs_message_handler(event) {
    if (!sqlModuleReady) {
        var config = event["data"]["config"] || {};
        sqlModuleReady = initSqlJs({
            useOldExtensionFunctions: config["useOldExtensionFunctions"]
        });
    }
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
