/**
 * @externs
 */

Module.FS = class {
  constructor() {
    this.ErrnoError = class {};
  }
  mount() {}
  isRoot() {}
  isFile() {}
  isDir() {}
  stat() {}
  /** @return {FSNode} */
  lookupPath() {}
  /** @return {FSNode} */
  lookupNode() {}
  /** @return {FSNode} */
  createNode() {}
  /** @return {FSNode} */
  mknod() {}
};

Module.FS.FSNode = class {
  constructor() {
    this.node_ops = {
      getattr: () => {},
      setattr: () => {},
      lookup: () => {},
      mknod: () => {},
      rename: () => {},
      unlink: () => {},
      rmdir: () => {},
      reaaddir: () => {},
      symlink: () => {},
      readlink: () => {}
    };

    this.stream_ops = {
      llseek: () => {},
      read: () => {},
      write: () => {},
      allocate: () => {},
      mmap: () => {},
      msync: () => {}
    };
  }
};
