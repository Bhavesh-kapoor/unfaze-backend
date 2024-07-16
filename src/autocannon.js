import autocannon from 'autocannon';
import { PassThrough } from 'stream';

function run(url) {
  const buf = [];
  const outputStream = new PassThrough();

  const instance = autocannon({
    url,
    connections: 100, //default
    pipelining: 1, // default
    duration: 10 // default
  });

  autocannon.track(instance, { outputStream });

  outputStream.on('data', data => buf.push(data));
  instance.on('done', () => {
    process.stdout.write(Buffer.concat(buf));
  });
}

console.log('Running all benchmarks in parallel ...');

run('http://localhost:8080/api/v1/admin/therepist/all'); // Adjust the URL to your endpoint
