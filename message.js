const xmtp = require('@xmtp/xmtp-js');
require('dotenv').config();
const {Wallet} = require('ethers');
const wallet = new Wallet(process.env.PRIVATE_KEY);
console.log(wallet.privateKey);
const Client = xmtp.Client;
const upToFirstSpace = /([^\s]+)/;

class Message{

    async initializeClient(){
        this.client=await Client.create(wallet);
        return this.client;
    }

    async send(message,walletHash){
        const conv = await client.conversations.newConversation(walletHash);
        let result = await conv.send(message);
        console.log({result});
        console.log(result.senderAddress);
    }
    async listen(){
        console.log(process.env.TEST_WALLET);
        const stream = await this.client.conversations.stream();
        for await (const conversation of stream){
            console.log({conversation});
            /*
            if(message.senderAddress === this.client.address){
                console.log('i sent myself a message');
                continue;
            }
            */
            console.log(`new message from ${message.senderAddress}: ${message.content}`);
            let parseResult = await this.parse(message.content);
            if (parseResult.error){
                let errorConversation=await this.client.conversations.newConversation(message.senderAddress);
                let result = await errorConversation.send(parseResult.errorMessage);
            }
            else{
                console.log(`sending message to ${parseResult.walletHash}: ${parseResult.figureName}`)
                let relayConversation=await this.client.conversations.newConversation(parseResult.walletHash);
                let result = await relayConversation.send(parseResult.figureName);
            }
        }
    }

    async parse(content){
        let contentTrim = content.trim();
        if (contentTrim.length === 0){
            return {
                error:true,
                errorMessage:'no wallet hash found'
            }
        }
        let result = upToFirstSpace.exec(contentTrim);
        if (!result || result.length === 0){
            return {
                error:true,
                errorMessage:'no message found after wallet hash'
            }
        }
        else{
            let walletHash = result[0];
            let figureName = contentTrim.slice(walletHash.length).trim();
            let onDevNetwork = await this.isOnDevNetwork(walletHash);
            if(!onDevNetwork){
                return {
                    error:true,
                    errorMessage:`${walletHash} not found on XMTP dev network`
                }
            }
            if (figureName.length===0){
                return {
                    error:true,
                    errorMessage:'no spaces in message, cannot identify wallet hash'
                }
            }
            return {
                error:false,
                walletHash:walletHash,
                figureName:figureName
            }
        }

        
    }
    async isOnDevNetwork(walletHash){
            let canMessage = await Client.canMessage(walletHash);
            return canMessage;
    }
}

module.exports = Message;