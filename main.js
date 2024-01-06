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
	if (!Array.isArray(GLOBAL_DB.data.users)) {
		GLOBAL_DB.data.users = []
		await GLOBAL_DB.write()
	}

	start()
})

//// RANKING SETUP ////
var MAIN_GUILD = process.env["GUILD"]
var MOVE_RANKINGS = {}

const MULTIPLIER = 1000

MOVE_RANKINGS[process.env["EMOTE_BLUNDER"]] = -4
MOVE_RANKINGS[process.env["EMOTE_MISS"]] = -3
MOVE_RANKINGS[process.env["EMOTE_INACCURACY"]] = -2
MOVE_RANKINGS[process.env["EMOTE_MISTAKE"]] = -1
MOVE_RANKINGS[process.env["EMOTE_BOOK"]] = 0
MOVE_RANKINGS[process.env["EMOTE_GOOD"]] = 1
MOVE_RANKINGS[process.env["EMOTE_GREAT"]] = 2
MOVE_RANKINGS[process.env["EMOTE_BRILLIANT"]] = 3
MOVE_RANKINGS[process.env["EMOTE_BEST"]] = 4

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

client.on("messageReactionAdd", async (reaction, user) => {
	var channel = await client.channels.fetch(reaction.message.channel.id)
	var message = await channel.messages.fetch(reaction.message.id)
	var {guild} = message
	var player = message.author

	var rank_update = MOVE_RANKINGS[reaction.emoji.id]

	if (guild.id == MAIN_GUILD && rank_update != null) {
		var log_channel = await client.channels.fetch(process.env["LOG_CHANNEL"])

		var userDB = await initDB(`user/${player.id}`, [])

		if (!Array.isArray(userDB.data)) { userDB.data = [] }

		var old_rank = Math.round(average(userDB.data) * MULTIPLIER)
		userDB.data.push(rank_update)
		var rank = Math.round(average(userDB.data) * MULTIPLIER)

		var member = await guild.members.fetch(player.id)

		var displayname = (member.nickname || player.displayName || player.username)
		var msg_link = `https://discord.com/channels/${guild.id}/${channel.id}/${message.id}`
		var text_emote = `<:${reaction.emoji.name}:${reaction.emoji.id}>`
		var flavor_text = RANK_FLAVOR_TEXT[String(rank_update)].random().replace("<user>", `**${displayname}**`)

		await log_channel.send(`${text_emote} ${flavor_text} ${msg_link}\n## *(${old_rank} -> **__${rank}__**)*`)
		await userDB.write()
	}
})

function start() {
	client.login(process.env["TOKEN"])
}

function average(arr) {
	var sum = 0
	arr.forEach(val => {
		sum += val
	})

	return (sum / arr.length)
}