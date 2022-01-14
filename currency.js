const fs = require("fs");
const data = require("./data.json");

function getCurrencyPath(userID) {
    return "./currency/"+userID+".dat";
}

function getCurrency(userID) {
    if(!fs.existsSync(getCurrencyPath(userID))) {
		fs.writeFileSync(getCurrencyPath(userID), '0', (err) => {});
		return 0;
	}else return parseInt(fs.readFileSync(getCurrencyPath(userID), 'UTF-8').split(/\r?\n/)[0]);
}

async function setCurrency(userID, num) {
    if(!fs.existsSync(getCurrencyPath(userID))) {
		fs.writeFileSync(getCurrencyPath(userID), num, (err) => {});
	}else {
		var newCurrency = ""+num;
		// fs.unlink(getCurrencyPath(userID), (err) => {});
		fs.writeFileSync(getCurrencyPath(userID), newCurrency, (err) => {});
	}
}

async function addCurrency(userID, num) {
    var currentCurrency = getCurrency(userID);
	var newCurrency = currentCurrency+num;
	await setCurrency(userID, newCurrency);
}

function cname() {
	const names = data.currencyNames;
    const name = names[Math.floor(Math.random() * names.length)];
	return name;
}

module.exports = { getCurrency, setCurrency, addCurrency, cname };