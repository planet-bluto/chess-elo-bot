global.print = console.log
require('dotenv').config()
require("./arrayLib.js")

//// DISCORD INIT ////
const { Client, IntentsBitField, Partials } = require('discord.js')
const client = new Client({ intents: Object.values(IntentsBitField.Flags), partials: Object.values(Partials) })

///// DATABASE SETUP ////
import("lowdb").then(async (lowdb) => {	
	const RAID_DB = require("./database/raid_db.js")

	const ALL_DBS = ["repl"]

	var active_dbs = []

	ALL_DBS.forEach(this_db => {
		const THIS_DB = require(`./database/${this_db}_db.js`)

		var env = process.env[`${this_db.toUpperCase()}_DB`]
		if (env && JSON.parse(env)) {
			active_dbs.push(THIS_DB(lowdb))
		}
	})

	var raid_db = RAID_DB(lowdb, active_dbs)

	global.createDB = raid_db.createDB
	global.initDB = raid_db.initDB

	global.GLOBAL_DB = await initDB("GLOBAL")
	if (Array.isArray(GLOBAL_DB.data.users)) {
		delete GLOBAL_DB.data.users
		await GLOBAL_DB.write()
	}

	start()
})

//// RANKING SETUP ////
var MAIN_GUILD = process.env["GUILD"]
var MOVE_RANKINGS = {}

const EMOTES = {
	BLUNDER: "<:blunder:1193038725190533171>",
	MISS: "<:miss:1193038718668390503>",
	INACCURACY: "<:inaccuracy:1193038722699104256>",
	MISTAKE: "<:mistake:1193038723777052752>",
	BOOK: "<:book_move:1193038728013295696>",
	GOOD: "<:good_move:1193038726532706404>",
	GREAT: "<:great_move:1193038720610336808>",
	BRILLIANT: "<:brilliant_move:1193038721675702342>",
	BEST: "<:best_move:1193038729162530896>",
}

var val_to_emote = (val) => { return Object.values(EMOTES)[val+4] }

const MULTIPLIER = 1000

MOVE_RANKINGS[process.env["EMOTE_BLUNDER_ID"]] = -4
MOVE_RANKINGS[process.env["EMOTE_MISS_ID"]] = -3
MOVE_RANKINGS[process.env["EMOTE_INACCURACY_ID"]] = -2
MOVE_RANKINGS[process.env["EMOTE_MISTAKE_ID"]] = -1
MOVE_RANKINGS[process.env["EMOTE_BOOK_ID"]] = 0
MOVE_RANKINGS[process.env["EMOTE_GOOD_ID"]] = 1
MOVE_RANKINGS[process.env["EMOTE_GREAT_ID"]] = 2
MOVE_RANKINGS[process.env["EMOTE_BRILLIANT_ID"]] = 3
MOVE_RANKINGS[process.env["EMOTE_BEST_ID"]] = 4

const RANK_FLAVOR_TEXT = {
	"-4": ["WHAT A FUCKING BLUNDER BY <user>", "<user> blunder...", "<user> you gotta kys after this blunder..."],
	"-3": ["Miss by <user>", "<user> missed...", "<user> yeah- no.. MISS"],
	"-2": ["<user>: Innacuracy.", "What an inaccuracy, <user>", "Super inaccuracy, <user>"],
	"-1": ["<user> is mistaken", "What a mistake, <user>", "<user>: Mistake."],
	"0": ["What a book move by <user>", "<user>: Book Move.", "Super book move, <user>"],
	"1": ["Good move by <user>", "<user>: Good Move.", "What a good move, <user>"],
	"2": ["Great move by <user>!", "<user>: Great Move."],
	"3": ["BRILLIANT MOVE BY <user>!", "<user>: Brilliant Move."],
	"4": ["**BEST MOVE BY** <user>!", "BEST MOVE! <user>!", "<user>: Best Move."],
}

//// ACTIVE LOGIC ////
client.on("ready", async () => {
	print("+ Best Move!")
})

async function rank_update_text(rank_update, guild, channel, message, player, reaction, userDB, undo = false) {
	var to_values = (arr) => {return arr.map(obj => obj.value)}
	var temp_arr = to_values(Object.values(userDB.data))

	var old_rank = Math.round(average(temp_arr) * MULTIPLIER + MULTIPLIER)

	if (!undo) {
		temp_arr.push(rank_update)
	} else {
		print(temp_arr.length)
		var index = temp_arr.findIndex(val => (val == rank_update))
		temp_arr = temp_arr.toSpliced(index, 1)
		print(temp_arr.length)
	}

	var true_rank = (average(temp_arr) * MULTIPLIER + MULTIPLIER)
	var rank = Math.round(true_rank)

	var member = await guild.members.fetch(player.id)

	var displayname = (member.nickname || player.displayName || player.username)
	var msg_link = `https://discord.com/channels/${guild.id}/${channel.id}/${message.id}`
	var text_emote = `${(undo ? `⏪` : "" )}<:${reaction.emoji.name}:${reaction.emoji.id}>`
	var flavor_text = (!undo ? RANK_FLAVOR_TEXT[String(rank_update)].random() : `nvm <user>...`).replace("<user>", `**${displayname}**`)
	var diff = (rank - old_rank)
	var sign = ["- ", "", "+ "][(Math.sign(diff)+1)]

	return {
		content: `${text_emote} ${flavor_text} ${msg_link}\n## ${old_rank} *\`\`(${sign}${Math.abs(diff)})\`\`* ➡ [${rank}]`,
		true_rank,
		rank,
	}
}

client.on("messageReactionAdd", async (reaction, user) => {
	var channel = await client.channels.fetch(reaction.message.channel.id)
	var message = await channel.messages.fetch(reaction.message.id)
	var {guild} = message
	var player = message.author

	var rank_update = MOVE_RANKINGS[reaction.emoji.id]

	if (guild.id == MAIN_GUILD && rank_update != null && (player.id != user.id || (rank_update < 0) || (user.id == "334039742205132800" && (process.env["DEV_MODE"] == "true")))) {

		var log_channel = await client.channels.fetch(process.env["LOG_CHANNEL"])
		var userDB = await initDB(`user/${player.id}`, {})

		if (typeof userDB.data != "object") { userDB.data = {} }

		var {content, true_rank} = await rank_update_text(rank_update, guild, channel, message, player, reaction, userDB)
		var log_message = await log_channel.send(content)

		var db_id = `${message.id}:${user.id}:${reaction.emoji.id}`
		userDB.data[db_id] = {value: rank_update, log: log_message.id, msg: message.id}
		GLOBAL_DB.data[player.id] = true_rank

		var prom_1 = GLOBAL_DB.write()
		var prom_2 = userDB.write()

		await Promise.all([prom_1, prom_2])
		print(userDB.data)
	}
})

client.on("messageReactionRemove", async (reaction, user) => {
	var channel = await client.channels.fetch(reaction.message.channel.id)
	var message = await channel.messages.fetch(reaction.message.id)
	var {guild} = message
	var player = message.author

	var rank_update = MOVE_RANKINGS[reaction.emoji.id]

	if (guild.id == MAIN_GUILD && rank_update != null) {
		var db_id = `${message.id}:${user.id}:${reaction.emoji.id}`
		var userDB = await initDB(`user/${player.id}`, {})
		var rank_entry = userDB?.data[db_id]

		if (rank_entry) {
			print(rank_entry)
			var log_channel = await client.channels.fetch(process.env["LOG_CHANNEL"])

			try {
				var log_message = await log_channel.messages.fetch(rank_entry.log)
				var {content} = await rank_update_text(rank_update, guild, channel, message, player, reaction, userDB, true)

				var prom_1 = log_message.delete()
				var prom_2 = log_channel.send(content)

				await Promise.all([prom_1, prom_2])
			} catch (err) {
				print(`- Message '${rank_entry.log}' Gone?`)
			}

			delete userDB.data[db_id]
			await userDB.write()
		}
	}
})

//// CHAT COMMANDS ////
var CHAT_COMMANDS = {}

function chat_command(name, desc, func) {
	CHAT_COMMANDS[name] = {name, desc, func}
}

client.on("messageCreate", msg => {
	if (msg.guild.id == process.env["GUILD"]) {
		var args = msg.content.split(" ")
		var prefix = args.shift()
		var cmd = args.shift()

		if (prefix == process.env["PREFIX"] && (CHAT_COMMANDS[cmd] != null)) {
			CHAT_COMMANDS[cmd].func(msg, ...args)
		}
	}
})

chat_command("ping", "Returns pong!", async (msg) => {
	await msg.reply("Pong!")
})

chat_command("help", "Returns information about commands", async (msg, input_cmd) => {
	if (input_cmd == null) {
		var lines = []
		Object.keys(CHAT_COMMANDS).forEach(cmd => {
			var meta = CHAT_COMMANDS[cmd]
			lines.push(`**${cmd}**: ${meta.desc}`)
		})

		await msg.reply(`## Blunder Help:\n${lines.join("\n")}`)
	} else {
		var meta = CHAT_COMMANDS[input_cmd]
		if (meta != null) {
			await msg.reply(`## ${meta.name} Help\n${meta.desc}`)
		} else {
			await msg.reply(`What a blunder...`)
		}
	}
})

chat_command("rank", "Returns your current ranking information", async (msg) => {
	var player = msg.author
	var userDB = await initDB(`user/${player.id}`, {})

	var to_values = (arr) => {return arr.map(obj => obj.value)}
	var values = to_values(Object.values(userDB.data))
	var rank = Math.round(average(values) * MULTIPLIER + MULTIPLIER)

	var counts = {}
	values.forEach(val => {
		if (counts[String(val)] == null) { counts[String(val)] = 0 }
		counts[String(val)] += 1
	})

	var val_lines = []
	Object.keys(counts).forEach(val => {
		var count = counts[val]
		var emote = val_to_emote(Number(val))
		val_lines.push(`${emote}: ${count}`)
	})

	var global_standings = calc_standings()
	var global_standing = (global_standings.findIndex(obj => obj.player == player.id) + 1)

	await msg.reply(`# ELO: ${rank} *(#${global_standing})*\n${val_lines.join("\n")}`)
})

chat_command("levels", "Returns the entire server's current ranking information", async (msg) => {
	var global_standings = calc_standings()
	var guild = await client.guilds.fetch(process.env["GUILD"])

	const MEDALS = {
		"1": "🥇",
		"2": "🥈",
		"3": "🥉",
	}

	var lines = []
	global_standings.slice(0, 10)
	await global_standings.asyncForEach(async (standing, ind) => {
		var prom_1 = client.users.fetch(standing.player)
		var prom_2 = guild.members.fetch(standing.player)

		var reses = await Promise.all([prom_1, prom_2])

		var player = reses[0]
		var member = reses[1]

		var displayname = (member.nickname || player.displayName || player.username)
		var medal = (MEDALS[String(ind+1)] || `${ind+1}`)

		lines.push(`[ ${medal} ] **${displayname}**: ${standing.rank}`)
	})

	await msg.reply(lines.join("\n"))
})

//// START UP ////
function start() {
	client.login(process.env["TOKEN"])
}


//// UTILS ////
function average(arr) {
	var sum = 0
	arr.forEach(val => {
		sum += val
	})

	var val = (sum / arr.length)

	if (val == NaN) { val = 0 }

	return val
}

function calc_standings() {
	var standings = []

	Object.keys(GLOBAL_DB.data).forEach(player => {
		var rank = GLOBAL_DB.data[player]
		standings.push({player, rank})
	})

	standings.sort((a, b) => {
		return (b.rank - a.rank)
	})

	return standings
}