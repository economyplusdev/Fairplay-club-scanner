const editJsonFile = require("edit-json-file");
const uuid = require('uuid');
const { Authflow, Titles } = require('prismarine-auth')
const axios = require('axios');
const { Webhook, MessageBuilder } = require('discord-webhook-node');

module.exports = {
    clubscan: function (realmcode, key, webhook) {
        const hook = new Webhook(webhook);
        new Authflow('', `./bot/auth`, { relyingParty: 'http://xboxlive.com' }).getXboxToken().then(async (t) => {
            const auth = JSON.parse(JSON.stringify({
                'x-xbl-contract-version': '2',
                'Authorization': `XBL3.0 x=${t.userHash};${t.XSTSToken}`,
                'Accept-Language': "en-US",
                maxRedirects: 1,
            }))

            let check = editJsonFile(`./config.json`);
            const realmid = check.get(`realmid`)
            const clubid = check.get(`clubid`)
            if (realmid == undefined || clubid == undefined) {
                new Authflow('', `./bot/auth`, { relyingParty: 'https://pocket.realms.minecraft.net/' }).getXboxToken().then(async (t) => {
                    const authflow = JSON.parse(JSON.stringify({
                        'Client-Version': '0.0.0',
                        'User-Agent': 'MCPE/UWP',
                        Authorization: `XBL3.0 x=${t.userHash};${t.XSTSToken}`
                    }))

                    if (realmcode == undefined) {
                        console.log("A valid realmcode is needed, if you have not filled out your realmid/club id!")
                        return process.exit(0)
                    }

                    var joinrequest = {
                        method: 'post',
                        url: `https://pocket.realms.minecraft.net/invites/v1/link/accept/${realmcode}`,
                        headers: {
                            'Cache-Control': 'no-cache',
                            'Charset': 'utf-8',
                            'Client-Version': '1.17.41',
                            'User-Agent': 'MCPE/UWP',
                            'Accept-Language': 'en-US',
                            'Accept-Encoding': 'gzip, deflate, br',
                            'Host': 'pocket.realms.minecraft.net',
                            'Authorization': `XBL3.0 x=${t.userHash};${t.XSTSToken}`
                        }
                    };
                    axios(joinrequest)
                        .then(function (response) {
                            const realmid = response.data.id
                            const clubid = response.data.clubId
                            const realmname = response.data.name
                            check.set(`realmid`, realmid)
                            check.set(`clubid`, clubid)
                            check.set(`realmname`, realmname)
                            check.save()
                            console.log("Joined Realm!\nRealm Name: ", realmname, "\nRealm ID: ", realmid, "\nClub ID: ", clubid)
                        }).catch((error) => {
                            console.log("This realmcode is invalid!")
                            console.log("Error code: ", error?.response?.status, "\nError data: ", error?.response?.statusText)
                            return process.exit(1)
                        })
                })
            }



            axios.get(`https://clubhub.xboxlive.com/clubs/Ids(${clubid})/decoration/clubpresence`, {
                headers: auth
            }).then((club) => {
                const img = club.data.clubs[0].displayImageUrl

                for (let i = 0; i < 3; i++) {
                    const xuid = club?.data?.clubs[0]?.clubPresence[i]?.xuid
                    const lastseen = club?.data?.clubs[0]?.clubPresence[i]?.lastSeenTimestamp
                    var newdate = new Date(`${lastseen}`)
                    var snowflake = Math.round(newdate.getTime() / 1000);


                    const since = Math.round((new Date().getTime() / 1000)) - snowflake
                    const mins = since / 60
                    const hoursinsce = mins / 60
                    const minssince = hoursinsce / 60

                    if (xuid == undefined) {
                        console.log("You need to have atleast 10 players that have recently played your realm!")
                        return process.exit()
                    }
                    axios.get(`https://apiv2.economyplus.solutions/api/flag/${xuid}`, {
                        headers: {
                            'Cache-Control': 'no-cache',
                            'fairplay': key,
                            'User-Agent': 'Axios/0.21.1',
                            'maxRedirects': 5,
                        }
                    }).then((res) => {

                        // console.log(res?.data)

                        if (res?.data?.flagged == false) {
                            return
                        }


                        const reason = res?.data?.data
                        if (res.data.flagged == true) {
                            axios.get(`https://profile.xboxlive.com/users/xuid(${(xuid)})/profile/settings?settings=Gamertag`, {
                                headers: auth
                            }).then((user) => {
                                const username = user?.data?.profileUsers[0]?.settings[0]?.value
                                console.log("User: ", username, "\nXUID: ", xuid, "\nLast seen: ", Math.round(hoursinsce), "Hours ago\nreason:", reason)
                                const embed = new MessageBuilder()
                .setDescription(`
User Flagged!
Username: **${username}**
XUID: **${xuid}**
Last seen: **${Math.round(hoursinsce)} Hours**
Reason: **${reason}**
 `)
                .setTimestamp();

              return hook.send(embed);


                            }).catch((error) => {
                                console.log("Error sending request to club api...")
                                console.log("Error code: ", error?.response?.status, "\nError data: ", error?.response?.statusText)
                            })
                        }

                    }).catch((error) => {
                        console.log("Error sending request to Fairplay api...")
                    })

                }

            }).catch((error) => {
                console.log("Error sending request to club api...")
                console.log("Error code: ", error?.data?.response?.status, "\nError data: ", error?.data?.response?.statusText)
            })




        })
    },

};

//   var zemba = function () {
//   }