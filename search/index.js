const https = require('https');

module.exports = async function (context, req) {

    context.log('Search HTTP trigger received a request');

    let apiKey = process.env.APIKEY
    
    if(apiKey === undefined || apiKey === null || apiKey === "") { 
        context.log("APIKEY is missing");
        context.res = {
            status: 500,
            body: {error: "APIKEY is missing"}
        }
        return context.resp;
    }

    let cxKey = process.env.CXKEY;
    if(cxKey === undefined || cxKey === null || cxKey === "") {
        context.log("CXKEY is missing");
        context.res = {
            status: 500,
            body: {error: "CXKEY is missing"}
        }
        return context.resp;
    }
    
    let searchStr = (req.query.q || '*') + " site:support.office.com";
    let limit = req.query.limit || 4;
    
    var json = await new Promise((resolve, reject) => {
        https.get(`https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cxKey}&q=${searchStr}`, (resp) => {
            let data = '';

            resp.on('data', (chunk) => {
                data += chunk;
            });

            resp.on('end', () => {
                resolve(JSON.parse(data));
            });

        }).on("error", (err) => {
            context.log("Error: " + err.message);
            reject(err.message);
        })
    });

    if(json.items === undefined || json.items === null || json.items.length == 0)
    {
        context.res = {
            status: 200,
            headers: {
                "Content-Type": "application/json"
            },
            body: []
        }
        return context.resp;
    }

    context.res = {
        status: 200,
        headers: {
            "Content-Type": "application/json"
        },
        body: json.items
            .filter((v, i) => { return v.pagemap.metatags[0]['ms.audience']!=='Admin' })
            .slice(0, limit)
            .map((v,i) => {
                return {
                    title: v.pagemap.metatags[0]['og:title'] || v.title,
                    link: v.link,
                    description: v.pagemap.metatags[0]['og:description'] || v.snippet,
                    thumbnail: fixUrl(v.pagemap.metatags[0]['og:image'] || ''),
                    video: v.pagemap.videoobject ? v.pagemap.videoobject[0].contenturl : undefined
                }
            })
    };
};

const fixUrl = (url) => {
    return url.startsWith('//') ? 'https:' + url : url;
};