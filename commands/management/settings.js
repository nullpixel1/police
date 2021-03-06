const Discord = require("discord.js");
const common = require("../../common.js");

module.exports = {
    name: "settings",
    description: "Change or check bot's settings",
    permissions: ["ADMINISTRATOR"],
    args: [
        {
            name: "set|list",
            optional: false
        },
        {
            name: "setting",
            description: "optional, if first argument is list",
            optional: false
        },
        {
            name: "value",
            description: "required, if first argument is set",
            optional: true
        }
    ],

    exec(args, mentions, sender, channel, settingActs) {
        if(args[0] === "list") {
            let settingsComposed = "";

            Object.keys(settingActs[0]).forEach(category => {
                settingsComposed += "● " + category + "\n";

                Object.keys(settingActs[0][category]).forEach(settingName => {
                    settingsComposed += "\t○ " + settingName + " = `" + settingActs[0][category][settingName].toString() + "` (" + (settingActs[0][category][settingName].constructor.name ? settingActs[0][category][settingName].constructor.name : typeof settingActs[0][category][settingName]) + ")\n";
                });
            });

            common.sendNeutralEmbed(channel, "Settings", settingsComposed, sender);
        } else if(args[0] === "set") {
            if(args[1] && args[2]) {
                let settingType = null;
                let settingCategory = null;
                let setting = null;

                Object.keys(settingActs[0]).forEach(category => {
                    Object.keys(settingActs[0][category]).forEach(settingName => {
                        if(category.toLowerCase() + "." + settingName.toLowerCase() === args[1].toLowerCase()) {
                            settingType = settingActs[0][category][settingName].constructor.name ? settingActs[0][category][settingName].constructor.name : typeof settingActs[0][category][settingName];
                            setting = settingName;
                            settingCategory = category;
                        }
                    });
                });

                if(settingType && setting) {
                    settingActs[1](settingCategory, setting, (settingType === "Boolean" ? args[2] === "true" : args[2]));
                    common.sendSuccessEmbed(channel, "Setting `" + setting + "` has been changed to value `" + args[2] + "`.", sender);
                }
            }
        }
    }
};
