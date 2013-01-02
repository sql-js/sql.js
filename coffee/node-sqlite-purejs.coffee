vm = require 'vm'
fs = require 'fs'
code = ''

module.exports = class Sql
  # create new instance
  # optionally read database from disk
  @open: (file, options, cb) ->
    s = new Sql()
    s.file = file
    s.options = options or {}
    js_file = __dirname+'/sql.js'
    data = `undefined`
    serial = []
    serial[0] = ->
      next = serial[1]
      return next() if code
      fs.readFile js_file, 'utf8', (err, _code) ->
        return cb err if err
        code = _code
        return next()
      return
    serial[1] = ->
      next = serial[2]
      sandbox = vm.createContext
        ArrayBuffer: ArrayBuffer
        Float32Array: Float32Array
        Float64Array: Float64Array
        Int16Array: Int16Array
        Int32Array: Int32Array
        Int8Array: Int8Array
        Uint16Array: Uint16Array
        Uint32Array: Uint32Array
        Uint8Array: Uint8Array
        process: process
        require: require
        console: log: console.log
      vm.runInContext code, sandbox, js_file
      s.instance = sandbox.SQL
      return next() if s.options.manual_load is true
      fs.exists s.file, (exists) ->
        return next() if not exists
        s.load (err, _data) ->
          return cb err if err
          data = _data
          next()
    serial[2] = ->
      s.db = s.instance.open data
      cb null, s
      return
    serial[0]()
    return

  # query the in-memory database
  exec: (sql, cb) ->
    try
      if @options.parse_multiple
        sql = sql.split ';'
      else
        sql = [sql]
      for k of sql when sql[k]
        last_result = @db.exec sql[k]

      serial = []
      serial[0] = =>
        next = serial[1]
        # optionally save current database state to disk
        return next() if @options.manual_save is true
        @save (err) ->
          return cb err if err
          return next()
      serial[1] = ->
        # convert result to object
        recordset = []
        for i, row of last_result
          record = {}
          for ii, col of row
            if typeof col.value is 'string' and col.value is '(null)'
              col.value = null # TODO: gotta be a better way to do this
            record[col.column] = col.value
          recordset.push record

        # return result
        cb and cb null, recordset
      serial[0]()

    catch err # err occurred
      cb and cb err # return err

    return
  execute_sql: Sql::exec # alias

  # read database from disk
  load: (cb) ->
    fs.readFile @file, (err, buffer) ->
      return cb err if err
      return cb null, new Uint8Array buffer
    return

  # write database to disk
  save: (cb) ->
    view = @db.exportData()
    buffer = new Buffer view.byteLength
    i = 0
    while i < buffer.length
      buffer[i] = view[i++]
    fs.writeFile @file, buffer, (err) ->
      setTimeout (-> cb err), 0
      return # important that this returns immediately
    return
