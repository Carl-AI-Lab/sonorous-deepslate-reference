import { createDemoServer } from './server.mjs';

const argumentsList = process.argv.slice(2);
if (argumentsList.length && (argumentsList.length !== 2 || argumentsList[0] !== '--port')) throw new Error('Usage: npm run demo -- --port 5174');
const port = argumentsList.length ? Number(argumentsList[1]) : 5174;
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Choose a port from 1024 to 65535.');
const server = createDemoServer();
server.on('error', (error) => {
  console.error(error.code === 'EADDRINUSE' ? `Port ${port} is occupied. Use npm run demo -- --port <available-port>.` : error.message);
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => console.log(`Sonorous Deepslate reference: http://127.0.0.1:${port}`));
