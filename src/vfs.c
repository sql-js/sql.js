#include <sqlite3.h>
#include <stdio.h>

static int (*defaultOpen)(sqlite3_vfs *vfs, const char *zName, sqlite3_file *file, int flags, int *pOutFlags);

static void (*fsOpen)(const char *, void*);
static int (*fsLock)(sqlite3_file *file, int);
static int (*fsUnlock)(sqlite3_file *file, int);

static int blockDeviceCharacteristics(sqlite3_file* file) {
    return SQLITE_IOCAP_SAFE_APPEND |
        SQLITE_IOCAP_SEQUENTIAL |
        SQLITE_IOCAP_UNDELETABLE_WHEN_OPEN;
}

static int block_lock(sqlite3_file *file, int lock) {
    return fsLock(file, lock);
}

static int block_unlock(sqlite3_file *file, int lock) {
    return fsUnlock(file, lock);
}

static int block_open(sqlite3_vfs *vfs, const char *zName, sqlite3_file *file, int flags, int *pOutFlags) {
    int res = defaultOpen(vfs, zName, file, flags, pOutFlags);

    sqlite3_io_methods* methods = (sqlite3_io_methods*)file->pMethods;
    methods->xDeviceCharacteristics = blockDeviceCharacteristics;
    methods->xLock = block_lock;
    methods->xUnlock = block_unlock;

    fsOpen(zName, (void*)file);

    return res;
}

void register_for_idb(int(*lockFile)(sqlite3_file*,int), int(*unlockFile)(sqlite3_file*,int), void(*openFile)(const char*, void*)) {
    sqlite3_vfs *vfs = sqlite3_vfs_find("unix");
    defaultOpen = vfs->xOpen;

    vfs->xOpen = block_open;
    sqlite3_vfs_register(vfs, 1);

    fsLock = lockFile;
    fsUnlock = unlockFile;
    fsOpen = openFile;
}
