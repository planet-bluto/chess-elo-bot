const fsExtra = require('fs-extra')
var fs = require("node:fs/promises")
var path = require("path")

module.exports = (lowdb) => {
	const Low = lowdb.Low
	const JSONFile = lowdb.JSONFile

	const getPath = (DBpath) => {return path.join(__dirname, `/db/${DBpath}.json`)}

	async function initDB(DBpath, def = {}) {
		await ensureDB(DBpath, def)

		var adapter = new JSONFile(getPath(DBpath))
		var db = new Low(adapter)
		await db.read()
		return db
	}

	async function createDB(DBpath, def = {}) {
		await ensureDB(DBpath, def)
		return initDB(DBpath, def)
	}

	async function ensureDB(DBpath, def = {}) {
		DBpath = getPath(DBpath)
		
		var exists = await fsExtra.pathExists(DBpath)
		if (!exists) {
			await fsExtra.ensureFile(DBpath)
			await fs.writeFile(DBpath, JSON.stringify(def))
		}
	}

	return { initDB, createDB, ensureDB }
}