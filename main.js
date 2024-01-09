global.print = console.log
global.print_dev = (...args) => { if (process.env["DEV_MODE"] == "true") {print(...args)} }
require('dotenv').config()
require("./arrayLib.js")

var fs = require("fs")

//// QUEUES ////
const TaskManager = require("task-manager")
var TaskManagers = {
	add: (key, task) => {
		if (TaskManagers[key] == null) {
			TaskManagers[key] = new TaskManager()
		}

		return TaskManagers[key].add(task)
	},
}

// Queues.add("test", async () => {
// 	print("hello")
// })
// Queues.add("test", async () => {
// 	print("hello")
// })
// Queues.add("test", async () => {
// 	print("hello")
// })

//// DISCORD INIT ////
const { REST } = require('@discordjs/rest')
const { Routes } = require('discord-api-types/v9')
const { Client, IntentsBitField, Partials, Collection, Events } = require('discord.js')
const client = new Client({ intents: Object.values(IntentsBitField.Flags), partials: Object.values(Partials) })

// move diss shit to the fuckin' database with live updating capabilities
var BLACKLIST = process.env["BLACKLIST"].split(",")

///// DATABASE SETUP ////
const {BluDB, REPLBuilder, JSONBuilder} = require("bludb")
const DB = new BluDB(
	JSONBuilder(),
	// REPLBuilder(process.env["REPLIT_DB_URL"]),
)
// DB.default({}, "GLOBAL")
DB.fetch("GLOBAL").then(GlobalDB => {
	print("- Global init'd")
})

global.DB = DB
// global.GlobalDB
start()
// import("lowdb").then(async (lowdb) => {	
// 	const RAID_DB = require("./database/raid_db.js")

// 	const ALL_DBS = ["repl"]

// 	var active_dbs = []

// 	ALL_DBS.forEach(this_db => {
// 		const THIS_DB = require(`./database/${this_db}_db.js`)

// 		var env = process.env[`${this_db.toUpperCase()}_DB`]
// 		if (env && JSON.parse(env)) {
// 			active_dbs.push(THIS_DB(lowdb))
// 		}
// 	})

// 	var raid_db = RAID_DB(lowdb, active_dbs)

// 	global.createDB = raid_db.createDB
// 	global.initDB = raid_db.initDB

// 	global.GlobalDB = await initDB("GLOBAL")
// 	// global.GlobalDB = await initDB("GLOBAL")
// 	if (Array.isArray(GlobalDB.data.users)) {
// 		delete GlobalDB.data.users
// 		await GlobalDB.write()
// 	}

	
// })

//// RANKING SETUP ////
var MAIN_GUILD = process.env["GUILD"]
var MOVE_VALUES = {}
var MOVE_ALIASES = {}

const EMOTES = {
	"Blunders": "<:blunder:1193038725190533171>",
	"Misses": "<:miss:1193038718668390503>",
	"Innacuracies": "<:inaccuracy:1193038722699104256>",
	"Mistakes": "<:mistake:1193038723777052752>",
	"Book Moves": "<:book_move:1193038728013295696>",
	"Good Moves": "<:good_move:1193038726532706404>",
	"Great Moves": "<:great_move:1193038720610336808>",
	"Brilliant Moves": "<:brilliant_move:1193038721675702342>",
	"Best Moves": "<:best_move:1193038729162530896>",
}

global.val_to_emote = (val) => { return Object.values(EMOTES)[val+4] }
global.val_to_name = (val) => { return Object.keys(EMOTES)[val+4] }

MOVE_VALUES[process.env["EMOTE_BLUNDER_ID"]] = -4
MOVE_VALUES[process.env["EMOTE_MISS_ID"]] = -3
MOVE_VALUES[process.env["EMOTE_INACCURACY_ID"]] = -2
MOVE_VALUES[process.env["EMOTE_MISTAKE_ID"]] = -1
MOVE_VALUES[process.env["EMOTE_BOOK_ID"]] = 0
MOVE_VALUES[process.env["EMOTE_GOOD_ID"]] = 1
MOVE_VALUES[process.env["EMOTE_GREAT_ID"]] = 2
MOVE_VALUES[process.env["EMOTE_BRILLIANT_ID"]] = 3
MOVE_VALUES[process.env["EMOTE_BEST_ID"]] = 4

MOVE_ALIASES["🚮"] = process.env["EMOTE_BLUNDER_ID"] // -4
MOVE_ALIASES["1177121359831253072"] = process.env["EMOTE_MISS_ID"] // -3
MOVE_ALIASES["🧢"] = process.env["EMOTE_INACCURACY_ID"] // -2
MOVE_ALIASES["❌"] = process.env["EMOTE_MISS_ID"] // -3
MOVE_ALIASES["❔"] = process.env["EMOTE_MISTAKE_ID"] // -1
MOVE_ALIASES["⬆️"] = process.env["EMOTE_GOOD_ID"] // 1
MOVE_ALIASES["💖"] = process.env["EMOTE_GREAT_ID"] // 2
MOVE_ALIASES["🔥"] = process.env["EMOTE_BRILLIANT_ID"] // 3
MOVE_ALIASES["📠"] = process.env["EMOTE_BEST_ID"] // 4

function calc_update(reaction) {
	var input = (reaction.emoji.id || MOVE_ALIASES[reaction.emoji.name])
	return MOVE_VALUES[input]
}

var UPDATE_FLAVOR_TEXT = {}
UPDATE_FLAVOR_TEXT[process.env["EMOTE_BLUNDER_ID"]] = ["WHAT A FUCKING BLUNDER BY <user>", "<user> blunder...", "<user> you gotta kys after this blunder..."]
UPDATE_FLAVOR_TEXT[process.env["EMOTE_MISS_ID"]] = ["Miss by <user>", "<user> missed...", "<user> yeah- no.. MISS"]
UPDATE_FLAVOR_TEXT[process.env["EMOTE_INACCURACY_ID"]] = ["<user>: Innacuracy.", "What an inaccuracy, <user>", "Super inaccuracy, <user>"]
UPDATE_FLAVOR_TEXT[process.env["EMOTE_MISTAKE_ID"]] = ["<user> is mistaken", "What a mistake, <user>", "<user>: Mistake."]
UPDATE_FLAVOR_TEXT[process.env["EMOTE_BOOK_ID"]] = ["What a book move by <user>", "<user>: Book Move.", "Super book move, <user>"]
UPDATE_FLAVOR_TEXT[process.env["EMOTE_GOOD_ID"]] = ["Good move by <user>", "<user>: Good Move.", "What a good move, <user>"]
UPDATE_FLAVOR_TEXT[process.env["EMOTE_GREAT_ID"]] = ["Great move by <user>!", "<user>: Great Move."]
UPDATE_FLAVOR_TEXT[process.env["EMOTE_BRILLIANT_ID"]] = ["BRILLIANT MOVE BY <user>!", "<user>: Brilliant Move."]
UPDATE_FLAVOR_TEXT[process.env["EMOTE_BEST_ID"]] = ["**BEST MOVE BY** <user>!", "BEST MOVE! <user>!", "<user>: Best Move."]

UPDATE_FLAVOR_TEXT["🚮"] = ["<user> needs to put litter in it's place"]
UPDATE_FLAVOR_TEXT["❌"] = ["EXTREMELY LOUD INCORRECT BUZZER, <user>"]
UPDATE_FLAVOR_TEXT["🧢"] = ["That's cap, <user>"]
UPDATE_FLAVOR_TEXT["1177121359831253072"] = ["<user> just said some broken fax..."]
UPDATE_FLAVOR_TEXT["❔"] = ["<user> huh?...", "<user> que?...", "<user> what?..."]
UPDATE_FLAVOR_TEXT["⬆️"] = ["<user>"]
UPDATE_FLAVOR_TEXT["💖"] = ["<user>"]
UPDATE_FLAVOR_TEXT["🔥"] = ["FLAMES <user>!"]
UPDATE_FLAVOR_TEXT["📠"] = ["FAX <user>!"]

//// ACTIVE LOGIC ////
client.on("ready", async () => {
	print(`‼ Logged in as '${client.user.username}', Best Move ‼`)
})

async function elo_update_text(elo_update, mult, guild, channel, message, player, reaction, userDB, undo = false) {
	var to_values = (arr) => {return arr.map(obj => (obj.value * obj.mult))}
	var temp_arr = to_values(Object.values(userDB.data))

	var old_elo = calc_elo(temp_arr)

	if (!undo) {
		temp_arr.push(elo_update * mult)
	} else {
		// print(temp_arr.length)
		// print_dev(temp_arr)
		var temp_mult = mult
		if (mult < 1) { temp_mult = 0 }
		var curr_val = (elo_update * (mult+(1/3)))
		var new_val = (elo_update * temp_mult)

		if (new_val == 0) {
			var index = temp_arr.findIndex(val => (val == curr_val))
			if (Array.isArray(temp_arr)) {
				temp_arr.splice(index, 1)
			}
		} else {
			var index = temp_arr.findIndex(val => (val == curr_val))
			temp_arr[index] = new_val
		}
		// print_dev(temp_arr)
		// print(temp_arr.length)
	}

	var deletings = (mult < 1)

	var true_elo = calc_elo(temp_arr, false)
	var elo = calc_elo(temp_arr)

	var member = await guild.members.fetch(player.id)

	var displayname = (member.nickname || player.displayName || player.username)
	var msg_link = `https://discord.com/channels/${guild.id}/${channel.id}/${message.id}`
	var text_emote = `${(deletings ? `⏪` : "" )}${(reaction.emoji.id ? `<:${reaction.emoji.name}:${reaction.emoji.id}>` : reaction.emoji.name)}`
	var flavor_text = (!deletings ? UPDATE_FLAVOR_TEXT[(reaction.emoji.id || reaction.emoji.name)].random() : `nvm <user>...`).replace("<user>", `**${displayname}**`)
	var diff = (elo - old_elo)
	var sign = ["- ", "• ", "+ "][(Math.sign(diff)+1)]

	var content = `## ${text_emote} ${flavor_text} ${msg_link}\n${old_elo} *\`\`(${sign}${Math.abs(diff)})\`\`* ➡ **${elo}**`

	print(`${sign}${flavor_text} | ${old_elo} (${sign}${Math.abs(diff)}) → ${elo}`)

	return {
		content,
		true_elo,
		elo,
		deletings,
	}
}

async function reactionInfo(reaction) {
	var channel = await client.channels.fetch(reaction.message.channel.id)
	var message = await channel.messages.fetch(reaction.message.id)
	var users = await reaction.users.fetch()
	users = (users.map(user => user.id))
	var {guild} = message
	var player = message.author
	var userDB = await DB.fetch(`user/${player.id}`)
	// print(userDB)

	var elo_update = calc_update(reaction)

	var valid_count = users.length
	if (users.includes(player.id) && elo_update > 0) { valid_count -= 1 }
	BLACKLIST.forEach(blacklisted_id => { if (users.includes(blacklisted_id)) { valid_count -= 1 } })
	// print(valid_count)

	var mult = (valid_count / 3)

	return {channel, message, users, guild, player, userDB, valid_count, mult, elo_update}
}

function addReactionEvent(reaction) {
	TaskManagers.add("all", async () => {
		var GlobalDB = await DB.fetch("GLOBAL")
		var {channel, message, users, guild, player, userDB, valid_count, mult, elo_update} = await reactionInfo(reaction)

		if (guild.id == MAIN_GUILD && elo_update != null && (mult >= 1) && (!player.bot || process.env["DEV_MODE"])) {

			var log_channel = await client.channels.fetch(process.env["LOG_CHANNEL"])

			// if (userDB.data == null) { userDB.data = {} }

			var {content, true_elo} = await elo_update_text(elo_update, mult, guild, channel, message, player, reaction, userDB)

			var db_id = `${message.id}:${(reaction.emoji.id || reaction.emoji.name)}`
			var update_entry = userDB?.data[db_id]

			var log_message;
			if (update_entry != null) {
				try {
					log_message = await log_channel.messages.fetch(update_entry.log)
					await log_message.edit(content)
				} catch (err) {
					print("? Message is gone?")
					log_message = await log_channel.send(content)
				}
			} else {
				log_message = await log_channel.send(content)
			}

			var read_1 = GlobalDB.read()
			var read_2 = userDB.read()
			await Promise.all([read_1, read_2])

			userDB.data[db_id] = {mult, value: elo_update, log: log_message.id, msg: message.id, time: Date.now()}
			GlobalDB.data[player.id] = true_elo

			var write_1 = GlobalDB.write()
			var write_2 = userDB.write()
			await Promise.all([write_1, write_2])
		}
	})
}

function removeReactionEvent(reaction, override = null) {
	TaskManagers.add("all", async () => {
		var GlobalDB = await DB.fetch("GLOBAL")
		var {channel, message, users, guild, player, userDB, valid_count, mult, elo_update} = await reactionInfo(reaction)
		if (override != null) { mult = override }

		if (guild.id == MAIN_GUILD && elo_update != null && (!player.bot || process.env["DEV_MODE"])) {
			var db_id = `${message.id}:${(reaction.emoji.id || reaction.emoji.name)}`
			var update_entry = userDB?.data[db_id]

			if (update_entry) {
				var log_channel = await client.channels.fetch(process.env["LOG_CHANNEL"])
				var {content, true_elo, deletings} = await elo_update_text(elo_update, mult, guild, channel, message, player, reaction, userDB, true)

				try {
					var log_message = await log_channel.messages.fetch(update_entry.log)

					if (deletings) {
						log_message.delete()
						log_channel.send(content)
					} else {
						log_message.edit(content)
					}

					// await Promise.all([prom_1, prom_2])
				} catch (err) {
					print(`? Message '${update_entry.log}' Gone?`)
				}

				var read_1 = GlobalDB.read()
				var read_2 = userDB.read()
				var reads = [read_1]
				if (deletings) {reads.push(read_2)}
				await Promise.all(reads)

				if (deletings) {
					delete userDB.data[db_id]
				}

				GlobalDB.data[player.id] = true_elo

				var write_1 = GlobalDB.write()
				var write_2 = userDB.write()
				var writes = [write_1]
				if (deletings) {reads.push(write_2)}
				await Promise.all(writes)
			}
		}
	})
}

client.on("messageReactionAdd", (reaction, user) => { addReactionEvent(reaction) })
client.on("messageReactionRemove", (reaction, user) => { removeReactionEvent(reaction) })
client.on("messageReactionRemoveAll", (msg, reactions) => {
	reactions.toJSON().forEach(reaction => {
		removeReactionEvent(reaction, 0)
	})
})
client.on("messageReactionRemoveEmoji", (reaction) => { removeReactionEvent(reaction, 0) })

//// SLASH COMMANDS ////
client.commands = new Collection()
const commands = []
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'))

for (const file of commandFiles) {
    if (!file.startsWith("!")) {
        const command = require(`./commands/${file}`)
        var commandJSON = JSON.stringify(command.data)
        commands.push(command.data)

        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command)
        }
    }
}

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
})

const rest = new REST({ version: '10' }).setToken(process.env["TOKEN"])

async function registerSlashCommands() {
    try {
        print(`Started refreshing ${commands.length} application (/) commands.`);

        // The put method is used to fully refresh all commands in the guild with the current set
        const data = await rest.put(
            Routes.applicationGuildCommands(process.env["CLIENT_ID"], process.env["GUILD"]),
            { body: commands },
        );

        print(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
}

registerSlashCommands()

//// CHAT COMMANDS ////
// var CHAT_COMMANDS = {}

// function chat_command(name, desc, func) {
// 	CHAT_COMMANDS[name] = {name, desc, func}
// }

// client.on("messageCreate", msg => {
// 	if (msg.guild.id == process.env["GUILD"]) {
// 		var args = msg.content.split(" ")
// 		var prefix = args.shift()
// 		var cmd = args.shift()

// 		if (prefix == process.env["PREFIX"] && (CHAT_COMMANDS[cmd] != null)) {
// 			CHAT_COMMANDS[cmd].func(msg, ...args)
// 		}
// 	}
// })

// chat_command("ping", "Returns pong!", async (msg) => {
// 	await msg.reply("Pong!")
// })

// chat_command("help", "Returns information about commands", async (msg, input_cmd) => {
// 	if (input_cmd == null) {
// 		var lines = []
// 		Object.keys(CHAT_COMMANDS).forEach(cmd => {
// 			var meta = CHAT_COMMANDS[cmd]
// 			lines.push(`**${cmd}**: ${meta.desc}`)
// 		})

// 		await msg.reply(`## Blunder Help:\n${lines.join("\n")}`)
// 	} else {
// 		var meta = CHAT_COMMANDS[input_cmd]
// 		if (meta != null) {
// 			await msg.reply(`## ${meta.name} Help\n${meta.desc}`)
// 		} else {
// 			await msg.reply(`What a blunder...`)
// 		}
// 	}
// })

// chat_command("rank", "Returns your current ranking information", async (msg) => {
// 	var player = msg.author
// 	var userDB = await initDB(`user/${player.id}`, {})

// 	var to_values = (arr) => {return arr.map(obj => obj.value)}
// 	var values = to_values(Object.values(userDB.data))
// 	var elo = calc_elo(values)

// 	var counts = {}
// 	values.forEach(val => {
// 		if (counts[String(val)] == null) { counts[String(val)] = 0 }
// 		counts[String(val)] += 1
// 	})

// 	var val_lines = []
// 	Object.keys(counts).forEach(val => {
// 		var count = counts[val]
// 		var emote = val_to_emote(Number(val))
// 		val_lines.push(`${emote}: ${count}`)
// 	})

// 	var global_standings = calc_standings()
// 	var global_standing = (global_standings.findIndex(obj => obj.player == player.id) + 1)

// 	await msg.reply(`# ELO: ${elo} *(#${global_standing})*\n${val_lines.join("\n")}`)
// })

// chat_command("ranks", "Returns the entire server's current ranking information", async (msg) => {
// 	var global_standings = calc_standings()
// 	var guild = await client.guilds.fetch(process.env["GUILD"])

// 	const MEDALS = {
// 		"1": "🥇",
// 		"2": "🥈",
// 		"3": "🥉",
// 	}

// 	var lines = []
// 	global_standings.slice(0, 10)
// 	await global_standings.asyncForEach(async (standing, ind) => {
// 		var prom_1 = client.users.fetch(standing.player)
// 		var prom_2 = guild.members.fetch(standing.player)

// 		var reses = await Promise.all([prom_1, prom_2])

// 		var player = reses[0]
// 		var member = reses[1]

// 		var displayname = (member.nickname || player.displayName || player.username)
// 		var medal = (MEDALS[String(ind+1)] || `${ind+1}`)

// 		lines.push(`[ ${medal} ] **${displayname}**: ${Math.round(standing.elo)}`)
// 	})

// 	await msg.reply(`# Top Ranks\n${lines.join("\n")}`)
// })

//// START UP ////
function start() {
	client.login(process.env["TOKEN"])
}


//// UTILS ////
global.calc_elo = (arr, rounded = true) => {
	const BASE_ELO = 1000
	const MULTIPLIER = 25

	var sum = BASE_ELO
	arr.forEach(val => {
		sum += (val*MULTIPLIER)
	})

	if (rounded) { sum = Math.round(sum) }

	return sum
}

global.calc_tier = (elo) => {
	const RANKS = ["BLUNDER", "SHIT", "MID", "GOLD", "DIAMOND", "RADIANT"]

	// var elo = 9000

	const clamp = (num, min, max) => Math.min(Math.max(num, min), max)

	var RANK_IND = clamp((Math.floor(elo / (3000/4))+1), 0, 5)
	var RANK = RANKS[RANK_IND]
	var SUB_RANK = ((RANK_IND > 0 && RANK_IND < 5) ? ((Math.floor(elo / (3000/12)) % 3) + 1) : "")
	var RANK_STRING = `${RANK} ${SUB_RANK}`.trim()

	return { RANK, RANK_STRING, RANK_IND, SUB_RANK }
}

// function calc_elo(arr, rounded = true) {
// 	var sum = 0
// 	arr.forEach(val => {
// 		sum += val
// 	})

// 	var val = (sum / arr.length)

// 	if (isNaN(val)) { val = 0 }

// 	if (rounded) {
// 		return Math.round((val + 4) * MULTIPLIER)
// 	} else {
// 		return ((val + 4) * MULTIPLIER)
// 	}
// }

global.calc_standings = async () => {
	var GlobalDB = await DB.fetch("GLOBAL")
	var standings = []

	await Object.keys(GlobalDB.data).awaitForEach(async player_id => {
		// var elo = GlobalDB.data[player_id]

		var userDB = await DB.fetch(`user/${player_id}`)
		var to_values = (arr) => {return arr.map(obj => (obj.value * obj.mult))}
		var temp_arr = to_values(Object.values(userDB.data))
		var elo = calc_elo(temp_arr)

		standings.push({player_id, elo})
	})

	standings.sort((a, b) => {
		return (b.elo - a.elo)
	})

	return standings
}