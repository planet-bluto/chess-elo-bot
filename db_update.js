module.exports = async (client) => {
	TaskManagers.add("all", async () => {
		Array.prototype.asyncForEach = async function(func) {
			var i = 0
			var length = this.length
			var funcs = []
			var reses = []
			return new Promise(async (res, rej) => {
				if (this.length > 0) {
					this.forEach((...args) => {
						funcs.push(func.bind(this, ...args))
					})

					async function loop() {
						// console.log(funcs)
						var this_res = null
						if (typeof funcs[i] == "function") {
							this_res = await funcs[i]()
						}
						reses.push(this_res)
						i++
						if (i == length) {
							res(reses)
						} else {
							loop()
						}
					}

					loop()
				} else {
					res([])
				}
			})
		}

		print("+ STARTING DATABASE UPDATE!")

		var main_guild = await client.guilds.fetch(process.env["GUILD"])
		var channels = await main_guild.channels.fetch()

		channels = channels.filter(channel => ([0, 2, 11, 12].includes(channel.type)))
		channels = await Array.from(channels)

		var keys = await DB.keys()
		keys = keys.filter(key => key.startsWith("user/"))

		await keys.awaitForEach(async (key, k_ind, k_arr) => {
			await TaskManagers.add("fetchings", async () => {
				print(`+ Starting ${key}`)
				var userDB = await DB.fetch(key)

				var user_keys = Object.keys(userDB.data)

				
				var load_amount = (user_keys.length * channels.length)
				var loads = 0

				var prom_resolve;
				var prom = new Promise((res, rej) => { prom_resolve = res })

				if (load_amount > 0) {
					user_keys.forEach((user_key) => {
						var obj = userDB.data[user_key]
						channels.forEach(async (channel) => {
							if (Array.isArray(channel)) {
								channel = channel[1]
							}

							if (channel != null) {
								try {
									var message = await channel.messages.fetch(obj.msg)
									// additional = `${channel.name}: ${message.content}`
									obj.channel = channel.id

									userDB.data[user_key] = obj
									await userDB.write()
								} catch (err) {
									additional = err.code
								}
							} else {
								additional = "Channel isn't real."
							}
							// print(additional)

							loads += 1
							// print(`+ [${loads} / ${load_amount}]`)
							if (loads >= load_amount) {
								print("- User Done: ", userDB.data)
								prom_resolve()
							}
						})
					})
				} else {
					print("- user done?")
					prom_resolve()
				}

				return prom
			})
		})

		print("DONE??")

		var GlobalDB = await DB.fetch("GLOBAL")
		GlobalDB.data["db_update"] = 1

		await GlobalDB.write()
	})
}