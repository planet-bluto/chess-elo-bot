var ReplDBAdapter = require("./repldbadapter.js")

module.exports = (lowdb) => {
	const Low = lowdb.Low

	async function initDB(DBpath, def = {}) {
		await ensureDB(DBpath, def)

		var adapter = new ReplDBAdapter(DBpath)
		var db = new Low(adapter)
		await db.read()
		return db
	}

	async function createDB(DBpath, def = {}) {
		var thisDB = await initDB(DBpath, def)
		thisDB.data = def
		await thisDB.write()
		return thisDB
	}

	async function ensureDB(DBpath, def = {}) {
		const Database = require("@replit/database")
		var db = new Database()

		var dbValue = await db.get(DBpath)
		if (dbValue == null) {
			await db.set(DBpath, def)
		}
	}

	return { initDB, createDB, ensureDB }
}