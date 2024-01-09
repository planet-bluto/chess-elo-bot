const { SlashCommandBuilder } = require('discord.js')

const COMMAND_INFO = {
	name: "elo_check",
	description: "Proxy reactions to a specified user!"
}

const command = new SlashCommandBuilder()
command.setName(COMMAND_INFO.name)
command.setDescription(COMMAND_INFO.description)

//// Additional SlashCommand Arguments ////

const choice = (val) => {return {name: val, value: val}}

command.addUserOption(option => option.setName("member")
	.setDescription("Member to check")
	.setRequired(true))

command.addStringOption(option => option.setName("context")
	.setDescription("Provide some additional context to this check"))

///////////////////////////////////////////

async function execute(interaction) {
	TaskManagers.add("all", async () => {
		let opt_member = interaction.options.get("member")
		let opt_context = interaction.options.get("context")

		var player = opt_member.user
		var member = opt_member.member
		let displayName = ( member.nickname || player.displayName || player.username )

		var CheckDB = await DB.fetch("CHECK")

		await interaction.reply(`## :chess_pawn: Check: __\`\`${displayName}\`\`__ :chess_pawn:` + (opt_context ? `\n📝 **Context:**\n${opt_context.value}` : ""))
		var message = await interaction.fetchReply()
		// print(message.id)
		CheckDB.data[message.id] = player.id

		await CheckDB.write()
	})
}

module.exports = {
	data: command.toJSON(),
	execute: execute
}