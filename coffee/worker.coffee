if typeof importScripts is 'function' # Detect webworker context
    db = null

    createDb = (data) ->
        if db? then db.close()
        db = new SQL.Database data

    self.onmessage = (event) ->
        data  = event['data']
        switch data?['action']
            when 'open'
                buff = data['buffer']
                createDb (if buff then new Uint8Array(buff) else undefined)
                postMessage
                    'id': data['id']
                    'ready': true
            when 'exec'
                if db is null then createDb()
                if not data['sql'] then throw 'exec: Missing query string'
                postMessage
                    'id' : data['id']
                    'results': db.exec data['sql']
            when 'each'
                if db is null then createDb()
                callback = (row) -> postMessage
                                            'id': data['id']
                                            'row': row
                                            'finished': false
                done = -> postMessage
                                            'id' : data['id']
                                            'finished': true
                db.each data['sql'], data['params'], callback, done

            when 'export'
                buff = db.export()
                result = {
                    'id' : data['id']
                    'buffer' : buff
                }
                try
                    postMessage result, [result]
                catch err # Some browsers fail when trying to use transferable objects
                    postMessage result
            when 'close'
                db?.close()
            else
                throw new 'Invalid action : ' + data?['action']
