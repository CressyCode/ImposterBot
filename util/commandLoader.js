module.exports = (client) => {
    const requireAll = require('require-all');
    const path = require('path');

    const files = requireAll({
        dirname: path.join(__dirname, '../commands'),
        filter: /^(?!-).+\.js$/
    });
    const skipped = requireAll({
        dirname: path.join(__dirname, '../commands'),
        filter: /^-.+\.js$/
    });

    client.commands = new Map();
    client.aliases = new Map();

    var skippednames = [];
    for (const name in skipped) {
        cmd = skipped[name];
        skippednames.push(cmd.config.name)
    }
    console.log(`Commands skipped: ${(skippednames === []) ? 'None' : skippednames.join(', ')}`);

    var names = [];
    for (const name in files) {
        const cmd = files[name];
        names.push(cmd.config.name)
        client.commands.set(cmd.config.name, cmd); 
        for (const a of cmd.config.aliases) client.aliases.set(a, cmd.config.name);
    } 
    console.log(`Commands loaded: ${names.join(', ')}`);
};