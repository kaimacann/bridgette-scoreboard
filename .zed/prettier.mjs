import prettier from 'prettier';

const filepathIndex = process.argv.indexOf('--stdin-filepath');
const filepath = filepathIndex === -1 ? undefined : process.argv[filepathIndex + 1];

if (!filepath) {
	console.error('Missing --stdin-filepath.');
	process.exit(1);
}

const source = await new Promise((resolve, reject) => {
	let input = '';
	process.stdin.setEncoding('utf8');
	process.stdin.on('data', chunk => (input += chunk));
	process.stdin.on('end', () => resolve(input));
	process.stdin.on('error', reject);
});
const config = (await prettier.resolveConfig(filepath)) ?? {};
const formatted = await prettier.format(source, { ...config, filepath });

await new Promise((resolve, reject) => {
	process.stdout.on('error', reject);
	process.stdout.write(formatted, error => (error ? reject(error) : resolve()));
});
