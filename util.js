
/* Find a member's preferred pronouns
 * Relies on server having pronoun roles
 * Defaults to "they/them"
 * so if the server doesn't have pronoun roles or the user doesn't have one, it will return "they/them"
*/
function findPronouns(guildMember) {
    let they = guildMember.roles.cache.find(role => role.name.toLowerCase() === "they/them");
    if(they) return "they";

    let he = guildMember.roles.cache.find(role => role.name.toLowerCase() === "he/him");
    let she = guildMember.roles.cache.find(role => role.name.toLowerCase() === "she/her");
    
    if(he) return "he";
    else if(she) return "she";
    else return "they";
}
