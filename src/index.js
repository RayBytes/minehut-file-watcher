#!/usr/bin/env node
let Config = require('conf');
let yargsParser = require('yargs-parser');
let colors = require('colors');
let chokidar = require('chokidar');
let fetch = require('node-fetch');
let fs = require('fs');
let path = require('path');
let downloadFolder = require('downloads-folder');

let argv = yargsParser(process.argv.slice(2));
let config = new Config();

let showHelpCommand = true;


const MINEHUT_API_BASE = 'https://api.minehut.com';
if (argv.setsession) {
	if (typeof argv.setsession !== 'string')
		return console.error('Session id must be a string'.bold.red);
	config.set('auth.session_id', argv.setsession);
	console.log(`Set session id to ${argv.setsession}`.green);
	showHelpCommand = false;
}

if (argv.setauth) {
	if (typeof argv.setauth !== 'string')
		return console.error('Auth token must be a string.'.bold.red);
	config.set('auth.token', 'Bearer ' + argv.setauth);
	console.log(`Set token.`.green);
	showHelpCommand = false;
}

if (argv.setprofiletoken) {
	if (typeof argv.setprofiletoken !== 'string')
		return console.error('SLG User Token must be a string.'.bold.red);
	config.set('auth.slg_user_token', argv.setprofiletoken);
	console.log(`Set ID.`.green);
	showHelpCommand = false;
}
/** 

* OLD DUMP CODE. USE NEW DUMP CODE BECAUSE YARGS LIKES TO HAVE BUGS WITH WINDOWS :))))))))) *

if (argv.dump) {
	try {
		const object = JSON.parse(argv.dump);
		config.set('auth.session_id', object.minehutSession)
		config.set('auth.token', 'Bearer ' + object.minehutToken)
		config.set('auth.slg_user_token', object.slgToken)
		console.log('Set session id.'.green)
		console.log('Set token.'.green)
		console.log('Set profile ID.'.green)
		showHelpCommand = false;
	} catch (e) {
		console.error(`Error occured:\n${e}`.red)
	}

}
*/

if (argv.dump) {
	try {
		let localPath = argv.dump;
		var object = JSON.parse(fs.readFileSync(localPath, 'utf8'));
		config.set('auth.session_id', object.minehutSession)
		config.set('auth.token', 'Bearer ' + object.minehutToken)
		config.set('auth.slg_user_token', object.slgToken)
		console.log('All values set!'.green)
		showHelpCommand = false;
	} catch (e) {
		console.error(`Error occured:\n${e}`.red)
	}
}

if (argv.setserver) {
	if (typeof argv.setserver !== 'string')
		return console.error('Server name must be a string'.bold.red);
	(async () => {
		const res = await fetch(
			`${MINEHUT_API_BASE}/server/${argv.setserver}?byName=true`
		);
		if (!res.ok)
			throw new HttpError(
				`Bad response when fetching server ID: ${res.status}`
			);
		const json = await res.json();
		config.set('server_id', json.server._id);
		console.log(
			`Set server ID to ${json.server._id} (${json.server.name})`.green
		);
	})();
	showHelpCommand = false;
}

if (argv.getconfig) {
	console.log(config.store);
	showHelpCommand = false;
}

if (argv.download) {

	showHelpCommand = false;
	const array = argv.download.split("/");
	(async () => {
		let res = await fetch(
			`https://${config.get(
				'server_id'
			)}.manager.minehut.com/file/download?files=["${argv.download}"]`,
			{
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Authorization: config.get('auth.token'),
					'User-Agent':
						'minehut-file-watcher (https://github.com/RayBytes/minehut-file-watcher)',
					'x-session-id': config.get('auth.session_id'), // Minehut Session Id Token
					'x-profile-id': config.get('auth.slg_user_token'), // SLG User Token
				}
		});
        var filename = res.headers.get('content-disposition').split('filename=')[1].split(';')[0]

		if (res.ok != false) {
			fs.mkdir(path.join(`${downloadFolder()}/mh-downloads`),
			{ recursive: true }, (err) => {
			if (err) {
				return console.error(err);
			}
			});

			const fileStream = fs.createWriteStream(path.join(`${downloadFolder()}/mh-downloads/`, filename))
			await new Promise((resolve, reject) => {
				res.body.pipe(fileStream)
				res.body.on('error', reject)
				fileStream.on('finish', resolve)
			})
			

			console.log('Downloaded file. Check the `Downloads/mh-downloads` directory. '.green);
			showHelpCommand = false;
		} else {
			console.log("An error occured. Make sure that your auth details are correct, and that the server id is valid and is online.".red)
		}
	})();
}


if (argv._.length > 0) {
	if (!config.get('server_id'))
		return console.error(
			"You haven't set a server in config. Run `mh-watch` for help.".red
		);
	if (!config.get('auth.session_id') || !config.get('auth.token') || !config.get('auth.slg_user_token'))
		return console.error(
			'Check your token, session and profile id in config. Run `mh-watch` for help.'.red
		);
	if (!argv.minehutpath)
		return console.error(
			'No Minehut path provided, where am I supposed to send the file?\nExample: mh-watch config.yml --minehutpath=plugins/Essentials/config.yml'
				.bold.red
		);
	(async () => {
		let remotePath = argv.minehutpath;
		let localPath = path.join(process.cwd(), argv._[0]);
		fs.readFile(localPath, 'UTF-8', (err, data) => {
			if (err) throw err;
			console.log(
				'Watching for file changes to '.green + argv._[0].red + '...'.green
			);
			let previousData = data;
			let watcher = chokidar.watch(localPath, {
				persistent: true,
			});
			watcher.on('change', path => {
				fs.readFile(localPath, 'UTF-8', async (err, data) => {
					if (err) throw err;
					if (previousData === data) return;
					console.log(
						'File '.green +
							path.red +
							' updated content, sending API request'.green
					);
					previousData = data;
					let res = await fetch(
						`${MINEHUT_API_BASE}/file/${config.get(
							'server_id'
						)}/edit/${remotePath}`,
						{
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
								Authorization: config.get('auth.token'),
								'User-Agent':
									'minehut-file-watcher (https://github.com/RayBytes/minehut-file-watcher)',
								'x-session-id': config.get('auth.session_id'), // Minehut Session Id Token
								'x-profile-id': config.get('auth.slg_user_token'), // SLG User Token
							},
							body: JSON.stringify({
								content: previousData,
							}),
						}
					);
					if (!(await res.ok))
						throw new HttpError(
							`Bad response: ${JSON.stringify(await res.json())}`
						);
					console.log('Updated file '.green + remotePath.red);
				});
			});
		});
	})();
	showHelpCommand = false;
}

if (showHelpCommand) {
	console.log(
		[
			'minehut-file-watcher'.green.underline,
			'',
			'Like the project? Star the repo!'.bold.red,
			'https://github.com/RayBytes/minehut-file-watcher/stargazers'.white,
			'',
			'--setserver=<server name>'.bold.white,
			'Set the server to push files to (persistent)'.yellow,
			'',
			'--setsession=<session id>'.bold.white,
			'Set the session id to use to authenticate with Minehut'.yellow,
			'',
			'--setauth=<token>'.bold.white,
			'Set the auth token to use to authenticate with Minehut'
				.yellow,
			'',
			'--setprofiletoken=<id>'.bold.white,
			'Set the SLG profile token to authenticate with Minehut'.yellow,
			'',
			'--dump=<auth>'.bold.white,
			'If you use the code in the read me, you can just dump the file/directory of the file recieved here and everything will be set for you.'.yellow,
			'',
			'--getconfig'.bold.white,
			'Get your current config. Useful for debugging.'.yellow,
			'',
			'--minehutpath=<remote path>'.bold.white,
			'Set the path of the file you want to update remotely'.yellow,
			'',
			'--download=<remote path>'.bold.white,
			'Download a file from the minehut server'.yellow,
			'',
			'After setting the above config values, use '.bold.white +
				'mh-watch <file> (--minehutpath=<remote path>)'.bold.red +
				'.'.bold.white,
			'',
			'For more information check out the GitHub repo!'.bold.green,
			'https://github.com/RayBytes/minehut-file-watcher'.white,
			'This is a fork of Jellz minehut-file-watcher which had stopped working.'.bold.white,
			'',
		].join('\n')
	);
}

class HttpError extends Error {
	constructor(message) {
		super(message);
		this.name = 'HttpError';
	}
}
