
//Aquest arxiu aplica els bonus/malus dels totems
//Està tot hardcoded

const totem_handler = async (totem_id) => {
    console.log("TOTEM! " + totem_id);


    switch (totem_id) {
        case 3001: // guanyes 5 punts
            
            break;
        case 3002: // perds 5 punts
            
            break;
        case 3003: // pots afegir 5 punts a un altre equip
            
            break;
        case 3004: // pots restar 5 punts a l’equip que vulguis
            
            break;
        case 3005: // pots restar (10) punts a l’equip que vulguis però a tu se te’n resten (5)
            
            break;
        case 3006: // has de repartir 8 punts per el teu equip i el d’algú altre
            
            break;
        case 3007: // pots donar fins a 10 punts teus a un altre equip
            
            break;
        case 3008: // birra gratis
            
            break;
        case 3009: // birra gratis
            
            break;
        case 3010: // birra gratis
            
            break;
        case 3011: // birra gratis
            
            break;
        case 3012: // acabes de guanyar un regal: cinta exprés
            
            break;
        case 3013: // acabes de guanyar un regal: mosquetó
            
            break;
        case 3014: // acabes de guanyar un regal: magnesera
            
            break;
        case 3015: // tu tries: 10 punts o regal sorpresa
            
            break;
        case 3016: // un glop de ratafia
            
            break;
        case 3017: // bossa de patates
            
            break;
        case 3018: // Samarreta de les 24hores
            
            break;
        case 3019: // Samarreta del raid
            
            break;
        case 3020: // totem inútil
            
            break;
        default:
            console.log("Tòtem desconegut: " + totem_id);
            break;
    }

}

module.exports = { 
    totem_handler
};