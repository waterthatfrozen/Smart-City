const axios = require('axios').default;
const CMS_BASE_URL = process.env.CMS_BASE_URL;

const AUTH_BODY = {
    'username': process.env.CMS_UNAME,
    'password': process.env.CMS_PWD,
    'cms_uid': process.env.CMS_UID
};

class cmsToken {

    constructor() {
        this.token = '';
        this.isTokenError = false;
        this.lastRefreshTime = new Date('1970-01-01').getTime();

        // Initialize token
        this.getToken();

        // Setup interval to refresh token
        setInterval(() => { this.getToken() }, 3600 * 1000);
    };

    async getToken() {
        let tryCount = 0;

        let currentTime = this.getCurrentTime();
        let diffFromLastRefresh = currentTime - this.lastRefreshTime;

        if (diffFromLastRefresh <= 3590) {
            console.warn('Token is not expired from last refresh time');
            return;
        }
        console.info('Obtaining new token');

        while (tryCount < process.env.RETRY_COUNT){
            try {
                const response = await axios.post(CMS_BASE_URL + '/token', AUTH_BODY);
                this.setNewToken(response.data.token, false)
                break;
            } catch (error) {
                console.error(error);
                tryCount++;
                if (trycount == process.env.RETRY_COUNT) {
                    this.isTokenError = true;
                }
            }   
        }
    };

    getCurrentTime() {
        return Math.round(new Date().getTime() / 1000);
    }

    setNewToken(token, isTokenError){
        this.token = token;
        this.isTokenError = isTokenError;
        this.lastRefreshTime = this.getCurrentTime();
    }

}

exports.cmsToken = new cmsToken();