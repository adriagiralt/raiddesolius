const handleCancelAction = () => async (ctx) => {
    ctx.editMessageText(`<i>Acció cancel·lada</i>`, {
        reply_markup: { inline_keyboard: [] },
        parse_mode: 'html'
      }).catch(error => console.error('Error edit cancel:', error));;
}

module.exports = { 
    handleCancelAction  
};