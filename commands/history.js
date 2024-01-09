const { SlashCommandBuilder } = require('discord.js')

const COMMAND_INFO = {
	name: "elo_history",
	description: "Shows messages that apply to a member!"
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

async function execute(interaction) {
	let {client, channel} = interaction

	let opt_member = interaction.options.get("member")

	let player = (opt_member ? opt_member.user : interaction.user )
	let member = (opt_member ? opt_member.member : interaction.member)
	let displayName = ( member.nickname || player.displayName || player.username )

	var userDB = await DB.fetch(`user/${player.id}`)
	var to_msgs = async (arr) => {
		var msgs = await arr.awaitForEach(async obj => {
			var channel = await client.channels.fetch(obj.channel)
			var message = await channel.messages.fetch(obj.msg)

			var emote = val_to_emote(obj.value)

			return `- ${emote} ${message.url}`
		})

		return msgs.slice(0, 15)
	}

	var msgs = await to_msgs(Object.values(userDB.data))
	var content = `# ${displayName}'s History\n${msgs.join("\n")}`

	await interaction.reply(content)
}

module.exports = {
	data: command.toJSON(),
	execute: execute
}