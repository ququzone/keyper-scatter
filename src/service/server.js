const http = require('http');
const BN = require('bn.js');

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Request-Method', '*');
	res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST');
	res.setHeader('Access-Control-Allow-Headers', '*');
	if ( req.method === 'OPTIONS' ) {
		res.writeHead(200);
		res.end();
		return;
	}

  let body = [];
  req.on('data', (chunk) => {
    body.push(chunk);
  }).on('end', async () => {
    body = Buffer.concat(body).toString();
    if (!body || body === "") {
      res.end();
      return;
    }
    const cells = await global.cache.findCells(body);
    const result = JSON.stringify(cells);

    res
      .writeHead(200, {
        'Content-Length': Buffer.byteLength(result),
        'Content-Type': 'application/json'
      })
      .end(result);
  });
}); 

server.listen(50002);