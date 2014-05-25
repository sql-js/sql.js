if typeof importScripts is 'function' # Detect webworker context
	db = null

	createDb = (data) ->
		if db? then db.close()
		db = new SQL.Database data

	self.onmessage = (event) ->
		data  = event['data']
		switch data?['action']
			when 'open'
				createDb new Uint8Array(data?['buffer'])
				postMessage
					'id': data['id']
					'ready': true
			when 'exec'
				if db is null then createDb()
				if not data['id'] then throw 'exec: Missing query id'
				if not data['sql'] then throw 'exec: Missing query string'
				postMessage
					'id' : data['id']
					'results': db.exec data['sql']
			when 'export'
				buff = db.export().buffer
				postMessage
						'id' : data['id']
						'buffer' : buff
					, [buff]
			when 'close'
				db?.close()
			else
				throw 'Invalid action : ' + data?['action']
