import dns from 'dns';
import fs from 'fs';

const resolver = new dns.Resolver();
resolver.setServers(['8.8.8.8']); // Use Google DNS

const srvHostname = '_mongodb._tcp.cluster0.bszs4p1.mongodb.net';
// TXT record is usually on the base cluster hostname
const txtHostname = 'cluster0.bszs4p1.mongodb.net';

console.log(`Resolving SRV for ${srvHostname}...`);

resolver.resolveSrv(srvHostname, (err, addresses) => {
    let output = '';
    if (err) {
        output += `Error resolving SRV: ${err.message}\n`;
        fs.writeFileSync('resolve_mongo_output.txt', output);
    } else {
        output += `SRV Records: ${JSON.stringify(addresses, null, 2)}\n`;

        resolver.resolveTxt(txtHostname, (err, records) => {
            if (err) {
                output += `Error resolving TXT: ${err.message}\n`;
            } else {
                output += `TXT Records: ${JSON.stringify(records, null, 2)}\n`;
            }
            fs.writeFileSync('resolve_mongo_output.txt', output);
        });
    }
});
