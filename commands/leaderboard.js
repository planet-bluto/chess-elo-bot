const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')

const COMMAND_INFO = {
	name: "elo_leaderboard",
	description: "Return the highest ranked members"
}

const command = new SlashCommandBuilder()
command.setName(COMMAND_INFO.name)
command.setDescription(COMMAND_INFO.description)

//// Additional SlashCommand Arguments ////

const choice = (val) => {return {name: val, value: val}}

// command.addUserOption(option => option.setName("member")
	// .setDescription("Member who's information to display"))
// command.addStringOption(option => option.setName("placeholder")
// 	.setDescription("this is a placeholder option"))

///////////////////////////////////////////

async function execute(interaction) {
	let {client} = interaction
	let opt_member = interaction.options.get("member")

	let player = (opt_member ? opt_member.user : interaction.user )
	let member = (opt_member ? opt_member.member : interaction.member)
	let displayName = ( member.nickname || player.displayName || player.username )

	var userDB = await initDB(`user/${player.id}`, {})

	var global_standings = await calc_standings()
	var guild = await client.guilds.fetch(process.env["GUILD"])

	const MEDALS = {
		"1": ["🥇", "1ST"],
		"2": ["🥈", "2ND"],
		"3": ["🥉", "3RD"],
		"4": ["4️⃣", "4TH"],
		"5": ["5️⃣", "5TH"],
		"6": ["6️⃣", "6TH"],
		"7": ["7️⃣", "7TH"],
		"8": ["8️⃣", "8TH"],
		"9": ["9️⃣", "9TH"],
		"10": ["🔟", "10TH"],
	}

	var fields = []
	global_standings = global_standings.slice(0, 10)
	var thumbnail = "https://i.imgur.com/UGdS7rA.png"
	await global_standings.awaitForEach(async (standing, ind) => {
		var prom_1 = client.users.fetch(standing.player)
		var prom_2 = guild.members.fetch(standing.player)

		var reses = await Promise.all([prom_1, prom_2])

		var player = reses[0]
		var member = reses[1]

		var displayname = (member.nickname || player.displayName || player.username)
		var medal = MEDALS[String(ind+1)]

		fields.push({
			name: `${medal[0]} ${medal[1]} ${medal[0]}: `,
			value: `**${displayname}** *(${Math.round(standing.elo)})*`,
			inline: true
		})

		if (ind == 0) {
			thumbnail = member.displayAvatarURL()
		}
	})


	const embed = new EmbedBuilder()
	  .setTitle(`<:best_move:1193038729162530896> TOP 10 ELO LEADERBOARD <:best_move:1193038729162530896>`)
	  .addFields(...fields)
	  .setThumbnail(thumbnail)
	  .setColor("#9ab357");

	await interaction.reply({embeds: [embed]})
}

module.exports = {
	data: command.toJSON(),
	execute: execute
}