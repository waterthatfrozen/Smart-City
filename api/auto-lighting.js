const axios = require('axios').default;
const dotenv = require('dotenv');
dotenv.config();

const serverStartTime = Math.floor(new Date().getTime() / 1000);
let currentTime = serverStartTime;
let intervalAmount = 10 * 60 * 1000; // 20 minutes 
let enableMode = false;

function getAutoLightingStatus(req, res){
    // Send the status of the auto lighting system
    res.status(200).send({
        enable: enableMode,
        currentTime: currentTime,
        serverStartTime: serverStartTime,
        intervalAmount: intervalAmount
    });
}

function setEnableAutoLighting(req, res) {
    // Enable or disable the auto lighting system
    if (req.session.token) {
        let now = new Date().getTime();
        let tokenExpiry = new Date(req.session.cookie._expires).getTime();
        if (now > tokenExpiry) { 
            req.session = null; 
            res.status(401).send({ message: "Session Expired" }); 
            return;
        }
    }else{ 
        res.status(401).send({ message: "No session found" });
        return;
    }
    if (req.body.enable) {
        enableMode = req.body.enable;
        res.status(200).send({ enable: enableMode, message: `Auto Lighting Mode ${enableMode ? "Enabled" : "Disabled"}` });
    }else{
        res.status(400).send({ message: "No enable value provided" });
    }
}

module.exports = {
    getAutoLightingStatus,
    setEnableAutoLighting
};