/* 
Manages the message discord event. This event is triggered whenever a message is sent on a server that the bot is in.

First, this script manages, records, and punishes spam automatically using discord anti spam.
Next, commands are processed. If the message is a command, this command is executed.
If the message is not a command, it is moderated and appropriately responded to.
*/

const Discord = require('discord.js');
const ids = require('../ids.json');
const lib = require('../util/lib.js');
const ghost = require('../util/ghost.js')()
const AntiSpam = require('discord-anti-spam');

// Moderate Reglist below for moderation action purposes.
// 1: f** abb. slur 2: dy** 3: f***ot slur 4: kys 5: kill yourself 6: re**** 7: re****ed 8: n****r slur 9: n***a abb. slur 10: who** slur

let counter = Math.floor(Math.random() * 10) + 10;
var communicationsState = {"operational": true,"scramble": null}
const antiSpam = new AntiSpam(lib.spamSettings);

module.exports = (client, message) => {
    if (message.author.bot || message.channel.id == ids.announcementChannelID) return;
    antiSpam.message(message).catch(err => console.log(err));

    const isCommand = command_handler(client, message);

    if (!isCommand) {
        lib.moderate(message);
        audit(message);
        event_handler(client, message, counter)
        respond_to_message(message, client);

        // React to @ mentions <-- If this gets more complex, extract to a global function
        if (message.mentions.has(client.user)) {
            let rand = lib.randMessage(["I'm not the imposter.", "...?", "Red sus.", "*ImposterBot was ejected.*", "*ImposterBot has voted. 5 votes remaining.*",
                "I'm just a crewmate, what about you?", "I finished all my tasks.", "Lock the doors.", "*votes you for random accusations*",
                "What?", "If you saw me vent, that's because I am the engineer."]);
            message.channel.send(rand);
        }

        // React to messages <-- If this gets more complex, extract to a global function
        if (message.author.id == ids.cressyID) {
            if (Math.ceil(Math.random() * 30) == 30 || /\bfurry+\b/i.test(message.content)) message.react(client.emojis.cache.get(ids.doggothinkID));
        }
        else if (Math.ceil(Math.random() * 90) == 90) message.react(lib.randMessage(["❤️", client.emojis.cache.get(ids.doggoheartID)]));

        // Ghost <-- If this gets more complex, extract to a global function with appropriate naming
        var word = ghost.process(message);
        if (word != null) {
            communication_event(message, word)
        }
    }
}

function command_handler(client, message) {
    /* 
    Checks if the message is a command. If so, run the command. 
    Returns true if the message was a command, otherwise returns false.
    */
    var [cmd, ...args] = message.content.trim().slice(ids.prefix.length).split(/\s+/g);
    const command = client.commands.get(cmd.toLowerCase()) || client.commands.get(client.aliases.get(cmd.toLowerCase()));
    if (message.guild && message.content.startsWith(ids.prefix) && command && message.guild.id === ids.cozycosmos) {
        if (!communicationsState['operational'] && !command.config.essential) return message.channel.send("Communications are offline!\nUnscramble `" + communicationsState['scramble'] + "` to fix them.")
        else {
            command.run(client, message, args);
            console.log(`Executing ${command.config.name} command for ${message.author.tag}.`);
        }
        return true
    }
    return false
}

function audit(message) {
    /* Sends an embed of messages to the audit log channel for moderation purposes */
    if (![ids.announcementChannelID, ids.managerChannelID, ids.auditLogChannelID, ids.developerChannelID].includes(message.channel.id)) {
        auditEmbed = new Discord.MessageEmbed()
            .setAuthor(message.author.username, message.author.displayAvatarURL())
            .setTitle(message.channel.name)
            .setDescription(message.content)
            .setTimestamp();
        message.guild.channels.cache.get(ids.auditLogChannelID).send(auditEmbed);
    }
}

function event_handler(client, message, counter) {
    /* Processes random events that rely on the message counter. Sends random messages and causes random events. Resets the counter when done. */
    if (--counter == 0) {
        counter = Math.floor(Math.random() * 15) + 60;

        let randAnswer = lib.randMessage(
            ["that's sus", "*Blue has called an emergency meeting.*", "I'm going to do a med bay scan.", "The body was in electrical.", "This is a self-report.", "*Vent Noises*", "--[REACTOR]--", "--[OXYGEN]--", "--[COMMUNICATIONS]--", "Who wants to do tasks in electrical?", "Self-care is important. (And self-reporting.)", "An **ERROR** has occured... jk unless..", "type !d bump if you want to see more people join :)", "Please insert `5` coins.", "I blame J.", "So..how's the weather?"],
            [1, 1, 1, 1, 1, 1, 1.5, 1.5, 3, 1, 1, 0.5, 0.25, 0.5, 1, 1]
        );

        if (randAnswer in ["--[REACTOR]--", "--[OXYGEN]--", "--[COMMUNICATIONS]--"]) {
            switch (randAnswer) {
                case "--[REACTOR]--":
                    reactor_event(client, message);
                    break;
                case "--[OXYGEN]--":
                    oxygen_event(client, message);
                    break;
                case "--[COMMUNICATIONS]--":
                    communication_event(message);
                    break;
            }
        }
        else message.channel.send(randAnswer);
    }
}

function reactor_event(client, message) {
    /* Handles the creation of the reactor event in the ★reactor★ channel. */
    reactor = client.channels.cache.get(ids.reactor)
    reactor.updateOverwrite(message.guild.id, { SEND_MESSAGES: true });
    reactor.send(
        {
            message: 'Reactor repairs needed! There are 2 minutes on the clock. Type `fix` or `repair`',
            files: [{
                attachment: `./assets/reactor.png`,
                name: `reactor.png`
            }]
        })
        .then(async () => {
            await reactor.awaitMessages(m => (["repair", "fix"].includes(m.content.toLowerCase())), { max: 1, time: 120000 })
                .then(async (crew) => {
                    reactor.send("> <@" + crew.first().author.id + "> is fixing the reactor!\n*Awaiting Second User...*")
                    await reactor.awaitMessages(e => (["repair", "fix"].includes(e.content.toLowerCase()) && e.author.id != crew.first().author.id), { max: 1, time: 120000 })
                        .then(mate => {
                            reactor.send("<@" + crew.first().author.id + "> and <@" + mate.first().author.id + "> have repaired the reactor!")
                            reactor.setName("★reactor★")
                        })
                })
                .catch(() => {
                    reactor.send("*The reactor melts down...*\n> `Channel Locked Due to Radioactivity`")
                    reactor.updateOverwrite(message.guild.id, { SEND_MESSAGES: false });
                    reactor.setName("✩reactor✩")
                });
        })
}

function oxygen_event(client, message) {
    /* Handles the creation of the oxygen event in the ★oxygen★ channel. */
    oxygen = client.channels.cache.get(ids.oxygen)
    let code = [];
    for (var i = Math.ceil(Math.random() * 2) + 5; i > 0; i--) {
        code.push(Math.floor(Math.random() * 10));
    }
    oxygen.updateOverwrite(message.guild.id, { SEND_MESSAGES: true });
    oxygen.send("⚠️ **OXYGEN DEPLETION** [40s] ⚠️\nEmergency Code: `" + code.join("") + "`")
        .then(async () => {
            await oxygen.awaitMessages(m => (lettersToNum(m.content.toLowerCase()) == code.join("")), { max: 1, time: 40000 })
                .then(collected => {
                    oxygen.send("<@" + collected.first().author.id + "> has repaired the Oxygen!");
                    oxygen.updateOverwrite(message.guild.id, { SEND_MESSAGES: false });
                }).catch(err => {
                    oxygen.send("> *Your vision goes black...*");
                    oxygen.updateOverwrite(message.guild.id, { SEND_MESSAGES: false });
                });
        });
}

function lettersToNum(phrase) {
    /* Converts string of the form 'one two three' to '123' */
    const lettersDictionary = { 'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9' };
    return phrase.trim().split(' ').map(word => lettersDictionary[word]).reduce((prev, cur) => prev + cur);
}

function communication_event(message, word = null) {
    /*
    Handles the creation of communication events. These happen in all channels, and users must unscramble a word to complete the event.
    Note: Communications event prevents non-essential commands from working. Players are reminded to fix comms to fix the bot.
    */
    if (word == null) {
        word = lib.randMessage(["imposter", "cressy", "inscryption", "minecraft", "amongus", "pokemon", "phasmophobia", "league", "rainbow", "reactor",
            "oxygen", "communications", "lights", "emergency", "watermelon", "mario", "shaykippers", "khazaari", "quack", "chilledoutbanana",
            "bean", "rayrayraisin", "dragon", "valcoria", "rikoniko", "spacey", "astley", "404pagenotfound", "tacocat", "chaos"]);
    }
    const word_scramble = scramble(word);

    communicationsState = {"operational": false,"scramble": word_scramble};

    message.channel.send("Communications have been sabotaged!\nUnscramble `" + word_scramble + "` to fix them.")
        .then(async () => {
            await message.channel.awaitMessages(m => m.content.trim().toLowerCase() == word, { max: 1, time: 240000 })
                .then(collected => {
                    message.channel.send("<@" + collected.first().author.id + "> has repaired communications!");
                    communicationsState = {"operational": true,"scramble": null};
                }).catch(() => {
                    message.channel.send("Nobody repaired communications. We'll pretend that you did >.>");
                    communicationsState = {"operational": true,"scramble": null};
                });
        });
}

function scramble(word) {
    /* Creates a unique scramble for communication events. */
    words = word.split(" ");
    for (var word in words) {
        split = words[word].split("");
        for (var i = 0; i < split.length; i++) {
            let random = Math.floor(Math.random() * split.length)
            let temp = split[i]
            split[i] = split[random]
            split[random] = temp
        }
        words[word] = split.join("")
    }
    return words.join(" ")
}

function respond_to_message(message, client) {
    switch (true) {
        case /\bbody+\b/i.test(message.content):
            message.channel.send("where");
            break;
        case /\bred sus\b/i.test(message.content):
            message.channel.send("I agree, vote red.");
            break;
        case /\bblue sus\b/i.test(message.content):
            message.channel.send("I think blue is safe, I saw them do a med scan.");
            break;
        case /\bnav\b/i.test(message.content):
            message.channel.send("I was just in nav, didn't see anyone.");
            break;
        case /\bblitzcrank\b/i.test(message.content):
            message.react("👍");
            break;
        case /\bmeeting\b/i.test(message.content):
            message.react(ids.reportEmoteID);
            message.channel.send("**Loud meeting button noise**");
            break;
        case /\bimposterbot\b/i.test(message.content):
            message.channel.send(lib.randMessage(["Not me, vote cyan.", "I was in admin.", "Didn't see orange at O2..", "It wasn't me, vote lime."]));
            break;
        case /\bi(('*m)|( am)) sad\b/i.test(message.content):
            message.channel.send(lib.randMessage([`Don't be sad ${client.emojis.cache.get("781282080617267230")}`, "Cheer up!"]));
            break;
        case /\bowo\b/i.test(message.content.toLowerCase()):
            message.channel.send("OwO?");
            break;
        case /\bvented\b/i.test(message.content):
            message.channel.send(lib.randMessage(["Was it green? I thought I saw them vent.", "I was in storage.. no where near any vents."]));
            message.react(ids.reportEmoteID);
            break;
        case /\bsuspicious\b/i.test(message.content):
            message.channel.send("Very sus.");
            message.channel.send(`${client.emojis.cache.get(ids.cyaEmoteID)}`);
            break;
        case /\bwho you gonna call\b/i.test(message.content):
            message.channel.send("ghost busters!");
            ghost = require('../util/ghost.js')();
            break;
        case /\b(sabotage|scramble) (comms|communications)\b/i.test(message.content):
            communication_event(message);
            break;
        case /\bpain\b/i.test(message.content):
            message.react(client.emojis.cache.get(ids.painEmoteID));
            break;
        case (message.content == "<:doggoban:802308677737381948>" && [ids.khazaariID, ids.cressyID].includes(message.author.id)):
            message.channel.send("Banning **MoustachioMario#2067**");
            break;
    }
}