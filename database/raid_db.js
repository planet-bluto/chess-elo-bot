module.exports = (lowdb, db_managers) => {
	var main_manager = db_managers[0]
	var Queues = {}
	var QueueListeners = {}
	var global_qid = 0

	async function advanceQueue(queueKey) {
		print(Queues)
		var {func, qid} = Queues[queueKey].shift()
		var result = await func()
		QueueListeners[qid](result)
		delete QueueListeners[qid]
		// if (Queues[queueKey].length > 0) { advanceQueue(queueKey) }
	}

	function addToQueue(queueKey, func) {
		var isArray = (Array.isArray(Queues[queueKey]))
		print(isArray)
		if (!isArray) { Queues[queueKey] = [] }

		var qid = global_qid
		global_qid += 1

		Queues[queueKey].push({func, qid})
		if (Queues[queueKey].length == 1) { advanceQueue(queueKey) }

		var promise = new Promise((resolve, rej) => {
			QueueListeners[qid] = (...args) => {
				// print("wow: ", ...args)
				resolve(...args)
			}
		})

		return promise
	}

	function queueDB(thisDBs) {
		const methods = ["read", "write"]
		var newDB = {}
		methods.forEach(queueify)

		function queueify(methodName) {
			newDB[methodName] = async (...args) => {
				var reses = await thisDBs.awaitForEach(async (thisDB, ind) => {
					var res = await thisDB[methodName](...args)
					return res
				})

				newDB.data = thisDBs[0].data

				return reses[0]
			}
		}

		newDB.data = thisDBs[0].data

		return newDB
	}

	async function ditto(methodName, ...args) {
		var reses = await db_managers.awaitForEach(async (db_manager, ind) => {
			var res = await db_manager[methodName](...args)
			return res
		})
		return reses
	}

	return {
		initDB: async (...args) => {
			var res = await ditto("initDB", ...args)
			return queueDB(res)
		},
		createDB: async (...args) => {
			var res = await ditto("createDB", ...args)
			return queueDB(res)
		},
		ensureDB: async (...args) => {
			var res = await ditto("ensureDB", ...args)
			return queueDB(res)
		},
	}
}