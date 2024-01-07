const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')

const COMMAND_INFO = {
	name: "elo_rank",
	description: "Returns current ranking information"
}

const command = new SlashCommandBuilder()
command.setName(COMMAND_INFO.name)
command.setDescription(COMMAND_INFO.description)

//// Additional SlashCommand Arguments ////

const choice = (val) => {return {name: val, value: val}}

command.addUserOption(option => option.setName("member")
	.setDescription("Member who's information to display"))
// command.addStringOption(option => option.setName("placeholder")
// 	.setDescription("this is a placeholder option"))

///////////////////////////////////////////

function ordinal_suffix_of(i) {
    let j = i % 10,
        k = i % 100;
    if (j === 1 && k !== 11) {
        return i + "st";
    }
    if (j === 2 && k !== 12) {
        return i + "nd";
    }
    if (j === 3 && k !== 13) {
        return i + "rd";
    }
    return i + "th";
}

async function execute(interaction) {
	let opt_member = interaction.options.get("member")

	let player = (opt_member ? opt_member.user : interaction.user )
	let member = (opt_member ? opt_member.member : interaction.member)
	let displayName = ( member.nickname || player.displayName || player.username )

	var userDB = await initDB(`user/${player.id}`, {})

	var to_values = (arr) => {return arr.map(obj => (obj.value * obj.mult))}
	var values = to_values(Object.values(userDB.data))
	var elo = calc_elo(values)
	var true_elo = calc_elo(values, false)
	var { RANK, RANK_STRING, RANK_IND, SUB_RANK } = calc_tier(true_elo)
	const RANK_EMOTES = {
		"BLUNDER": "<:blunder:1193038725190533171>",
		"SHIT": "💩",
		"MID": "🔰",
		"GOLD": "🔶",
		"DIAMOND": "💎",
		"RADIANT": "<:best_move:1193038729162530896>",
	}

	const RANK_COLORS = {
		"BLUNDER": "#b94236",
		"SHIT": "#bf6952",
		"MID": "#47ded4",
		"GOLD": "#f4900c",
		"DIAMOND": "#bdddf4",
		"RADIANT": "#9ab357",
	}
	var rank_emote = RANK_EMOTES[RANK]
	var rank_color = RANK_COLORS[RANK]

	var fields = []
	if (values.length > 0) {
		var counts = {}
		values.forEach(val => {
			if (counts[String(val)] == null) { counts[String(val)] = 0 }
			counts[String(val)] += 1
		})

		var vals = Object.keys(counts)

		vals.sort((a, b) => {
			return Number(b) - Number(a)
		})

		vals.forEach(val => {
			var count = counts[val]
			var emote = val_to_emote(Number(val))
			var prettyName = val_to_name(Number(val))
			fields.push({
				name: `${emote} **${prettyName}** ${emote}`,
				value: String(count),
				inline: true
			})
		})
	}

	var global_standings = calc_standings()
	var global_standing = (global_standings.findIndex(obj => obj.player == player.id) + 1)


	const embed = new EmbedBuilder()
	  .setAuthor({
	    name: `${displayName}'s Ranking`,
	    iconURL: member.displayAvatarURL(),
	  })
	  .setTitle(`${rank_emote} ELO: ${elo} - ${RANK_STRING} ${rank_emote}`)
	  .addFields(...fields)
	  .setColor(rank_color)
	  .setFooter({
	  	text: ((global_standing > 0) ? `Global Standing: ${ordinal_suffix_of(global_standing)}` : `No Global Standing Available`)
	  })

	await interaction.reply({embeds: [embed]})
}

module.exports = {
	data: command.toJSON(),
	execute: execute
}