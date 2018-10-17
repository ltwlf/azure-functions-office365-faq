const https = require('https');

module.exports = async function (context, req) {

    context.log('Search HTTP trigger received a request');

    let apiKey = process.env.APIKEY;
    let cxKey = process.env.CXKEY;
    
    let searchStr = (req.query.q || '*') + " site:support.office.com";
    
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

    context.res = {
        status: 200,
        body: json.items
            .filter((v, i) => { return v.pagemap.metatags[0]['ms.audience']!=='Admin' })
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