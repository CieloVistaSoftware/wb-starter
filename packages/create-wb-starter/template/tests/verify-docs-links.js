const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

function fetch(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data }));
        }).on('error', reject);
    });
}

function checkHead(url) {
    return new Promise((resolve, reject) => {
        const req = http.request(url, { method: 'HEAD' }, (res) => {
            resolve(res.statusCode);
        });
        req.on('error', reject);
        req.end();
    });
}

async function run() {
    console.log(`Checking docs links on ${BASE_URL}...`);

    // 1. Check manifest
    try {
        const manifestRes = await fetch(`${BASE_URL}/docs/manifest.json`);
        if (manifestRes.status !== 200) {
            console.error(`❌ Failed to fetch manifest.json: ${manifestRes.status}`);
            process.exit(1);
        }
        console.log(`✅ manifest.json is accessible`);

        const manifest = JSON.parse(manifestRes.data);
        let total = 0;
        let failed = 0;

        for (const category of manifest.categories) {
            const items = [...(category.docs || []), ...(category.pages || [])];
            for (const item of items) {
                total++;
                let fileUrl;
                let displayPath;

                if (item.file) {
                    // Doc file
                    if (item.file.startsWith('http') || item.file.startsWith('/')) {
                        fileUrl = item.file;
                    } else {
                        fileUrl = `${BASE_URL}/docs/${item.file}`;
                    }
                    displayPath = item.file;
                } else if (item.page) {
                    // Page
                    fileUrl = `${BASE_URL}/pages/${item.page}.html`;
                    displayPath = `pages/${item.page}.html`;
                }

                try {
                    const status = await checkHead(fileUrl);
                    if (status === 200) {
                        console.log(`✅ [${status}] ${displayPath}`);
                    } else {
                        console.error(`❌ [${status}] ${displayPath} -> ${fileUrl}`);
                        failed++;
                    }
                } catch (err) {
                    console.error(`❌ [ERR] ${displayPath}: ${err.message}`);
                    failed++;
                }
            }
        }

        console.log(`\nSummary: ${total - failed}/${total} links valid.`);
        if (failed > 0) process.exit(1);

    } catch (err) {
        console.error(`❌ Error running test: ${err.message}`);
        process.exit(1);
    }
}

run();
