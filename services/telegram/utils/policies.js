const checkAdminPolicy = async (ctx, next) => {

    const user_id = ctx.from.id

    if ( [6668735648, 179640788, 5750997565].includes(user_id)) {
        return next();
    }
    else {
        ctx.reply('Funcionalitat només per admins. Si creus que hauries de ser admin contacta amb el superadmin')
    }
    
};

module.exports = { 
    checkAdminPolicy 
};