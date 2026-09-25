const grau_punts = {
    "3" : 0,
    "3+" : 0.5,
    "4" : 1,
    "4+" : 1.5,
    "5" : 2,
    "5+" : 2.5,
    "6a" : 3,
    "6a+" : 3.5,
    "6b" : 4,
    "6b+" : 4.5,
    "6c" : 5,
    "6c+" : 5.5,
    "7a" : 6,
    "7a+" : 6.5,
    "7b" : 7,
    "7b+" : 7.5,
    "7c" : 8,
    "7c+" : 8.5
}

const calcula_punts = (grau) => {
    let mult = 1
    if (grau[grau.length - 1] === "*"){
        mult = 2
        grau = grau.slice(0, -1)
    }
    return grau_punts[grau] * mult;
};

// Exporta només les funcions públiques
module.exports = {
    calcula_punts,
};