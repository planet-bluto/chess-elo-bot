module.exports = (lowdb, db_managers) => {
	var main_manager = db_managers[0]

	async function ditto(methodName, ...args) {
		var reses = await db_managers.awaitForEach(async db_manager => {
			var res = await db_manager[methodName](...args)
			return res
		})
		return reses[0]
	}

	return {
		initDB: async (...args) => {
			var res = await ditto("initDB", ...args)
			return res
		},
		createDB: async (...args) => {
			var res = await ditto("createDB", ...args)
			return res
		},
		ensureDB: async (...args) => {
			var res = await ditto("ensureDB", ...args)
			return res
		},
	}
}