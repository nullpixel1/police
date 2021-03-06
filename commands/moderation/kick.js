const Discord = require("discord.js");
const common = require("../../common.js");

module.exports = {
    name: "kick",
    description: "Kick a user",
    permissions: ["KICK_MEMBERS"],
    args: [
        {
            name: "user",
            optional: false
        },
        {
            name: "reason",
            optional: true,
            default: "Read #rules."
        }
    ],

    subexec_permissions: ["KICK_MEMBERS"],

    pendingKicks: {},

    exec(args, mentions, sender, channel, raw, policeChannels) {
        // TODO: redo sending the embed, sending at the end does not work, because promises

        let embed = new Discord.RichEmbed();

            if(mentions.users.first()) {
                if(!args[1]) args[1] = "Read #rules.";

                channel.guild.fetchMember(mentions.users.first()).then(member => {
                    let roleArray = [];

                    Array.from(channel.guild.roles).forEach(role => {
                        roleArray.push(role[1]);
                    });

                    let senderHighRankPos = roleArray.indexOf(channel.guild.roles.filter(role => role.id === sender.highestRole.id).first());
                    let kickableHighRankPos = roleArray.indexOf(channel.guild.roles.filter(role => role.id === member.highestRole.id).first());

                    if(senderHighRankPos < kickableHighRankPos || roleArray[kickableHighRankPos].name === "@everyone") {
                        channel.guild.fetchMembers().then(refreshedGuild => {
                            let hasNamesakes = false;

                            refreshedGuild.members.every(checkableMember => {
                                if((member.nickname || member.user.username) == (checkableMember.nickname || checkableMember.user.username) && checkableMember.user.id !== member.user.id) {
                                    hasNamesakes = true;
                                    return false;
                                } else {
                                    return true;
                                }
                            });

                            if(!hasNamesakes) {
                                module.exports.kick(mentions, member, sender, args, policeChannels, channel);
                            } else {
                                const identifier = Math.random().toString(36).substr(2, 4);
                                module.exports.pendingKicks[identifier] = setTimeout(module.exports.kick, 8 * 1000, mentions, member, sender, args, policeChannels, channel);

                                common.sendWarningEmbed(channel, "There is another user with similar username or nickname " + (member.nickname || member.username) + " has. If you want to cancel, run command `$kick-" + identifier + " cancel` in 8 seconds. After 8 seconds, the user will be kicked normally.");
                            }
                        });
                    } else {
                        common.sendErrorEmbed(channel, "Your highest role is lower or the same as the member you requested to kick.", client);
                    }
                }).catch(() => {
                    common.sendErrorEmbed(channel, "Could not find the mentioned user.", client);
                });
            } else {
                common.sendErrorEmbed(channel, "You didn\'t mention anyone.", client);
            }
    },

    kick: (mentions, member, sender, args, policeChannels, channel) => {
        member.user.sendMessage("You have been kicked from the server `" + channel.guild.name + " Reason: `" + args.slice(1).join(" ") + "`").then(() => {
            member.kick();

            if(policeChannels.modLog) {
                policeChannels.modLog.sendEmbed(
                    new Discord.RichEmbed()
                        .setTitle("New kick")
                        .setDescription("A user was kicked.")
                        .setColor("#3498db")
                        .addField("Kicked", mentions.users.first().username + "#" + mentions.users.first().discriminator + " " + (member.nickname ? "(" + member.nickname + ")" : "(no nickname)") + " (" + mentions.users.first().id + ")")
                        .addField("Kicker", sender.user.username + "#" + sender.user.discriminator + " (" + (sender.nickname ? sender.nickname : "no nickname") + ") (" + sender.user.id +")")
                        .addField("Reason", args.slice(1).join(" "))
                        .addField("Time", new Date().toString()),
                    "",
                    { disableEveryone: true }
                );
            }
            common.sendSuccessEmbed("You have kicked " + mentions.users.first().username + " (" + mentions.users.first().id + ")");
        });
    },

    subexec: (args, mentions, sender, channel, sub) => {
        if(args[0] == "cancel" && sub) {
            if(Object.keys(module.exports.pendingBans).indexOf(sub[0]) > -1) {
                clearTimeout(module.exports.pendingBans[sub[0]]);
                common.sendSuccessEmbed(channel, "Kick `" + sub + "` has been cancelled.", sender);
            } else {
                common.sendErrorEmbed(channel, sub + " is not a valid pending kick.", client);
            }
        }
    }
};
