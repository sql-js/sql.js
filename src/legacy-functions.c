#include <assert.h>
#include <emscripten.h>
#include "sqlite3.h"

typedef void (*ScalarFunction)(sqlite3_context *, int, sqlite3_value **);
typedef void (*FinalFunction)(sqlite3_context *);

typedef struct {
  const char *name;
  ScalarFunction scalar;
  FinalFunction final;
} LegacyFunction;

EM_JS(void, warnLegacyFunction, (const char *name), {
  console.warn("sql.js: legacy function " + UTF8ToString(name) +
    "() is deprecated and will be disabled by default in the next major " +
    "version. Initialize with useOldExtensionFunctions: false to use " +
    "native SQLite functions. See https://github.com/sql-js/sql.js/pull/619");
});

static void legacyScalar(sqlite3_context *context, int argc,
                         sqlite3_value **argv) {
  LegacyFunction *function = sqlite3_user_data(context);
  warnLegacyFunction(function->name);
  function->scalar(context, argc, argv);
}

static void legacyFinal(sqlite3_context *context) {
  LegacyFunction *function = sqlite3_user_data(context);
  warnLegacyFunction(function->name);
  function->final(context);
}

static int registerLegacyFunction(sqlite3 *db, const char *name, int argc,
                                  int encoding, void *userData,
                                  ScalarFunction scalar, ScalarFunction step,
                                  FinalFunction final) {
  /* The pinned legacy extension never uses sqlite3_user_data(). */
  assert(userData == 0);
  LegacyFunction *function = sqlite3_malloc(sizeof(*function));
  if (!function) return SQLITE_NOMEM;
  function->name = name;
  function->scalar = scalar;
  function->final = final;
  return sqlite3_create_function_v2(db, name, argc, encoding, function,
    scalar ? legacyScalar : 0, step, final ? legacyFinal : 0, sqlite3_free);
}

/* Wrap registrations without modifying or duplicating the upstream source. */
#define sqlite3_create_function registerLegacyFunction
#include "extension-functions.c"
#undef sqlite3_create_function
