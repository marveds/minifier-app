const { app, BrowserWindow, Menu, Tray, ipcMain, dialog } = require('electron');
const path = require('path');
const chokidar = require('chokidar');
const webpack = require('webpack');
const webpackConfig = require('./webpack.config.js');
const fs = require('fs');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const RemoveEmptyScriptsPlugin = require('webpack-remove-empty-scripts');
const TerserPlugin = require('terser-webpack-plugin');
const { start } = require('repl');
const minifierDataPath = path.join(app.getPath('userData'), 'minifierData.json');

let mainWindow;
let watchers = [];
let tray = null;


app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('no-sandbox');

const gotTheLock = app.requestSingleInstanceLock();

if (!app.isPackaged) {
	require('electron-reload')(__dirname, {
		electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
		files: [
			path.join(__dirname, 'index.html'),
			path.join(__dirname, 'dist/styles.css'),
			path.join(__dirname, 'renderer.js'),
		]
	});
}

if (!gotTheLock) {
	app.quit();
} else {
	try {
		app.on('second-instance', (event, commandLine, workingDirectory) => {
			if (mainWindow) {
				if (mainWindow.isMinimized()) {
					mainWindow.restore();
				}
				mainWindow.show();
				mainWindow.focus();
			}
		});

		app.on('ready', () => {
			createWindow();
			createTray();

			mainWindow.webContents.once('did-finish-load', () => {
				if (!app.isPackaged) {
					mainWindow.webContents.openDevTools();
				}
				
				loadMinifierData((savedData) => {
					const { paths, isWatching, notifictionState } = savedData;
					
					if (paths && paths.length > 0) {
						mainWindow.webContents.send('selected-folders', paths);
						if (isWatching) {
							startWatchingFolders(paths);
						}
					}
					mainWindow.webContents.send('restore-saved-config', savedData);
					mainWindow.webContents.send('notification-toggle', notifictionState);
				});
			});
		});

		app.on('window-all-closed', (event) => {
			event.preventDefault(); // Prevent the app from quitting completely
		});

		app.on('activate', () => {
			if (mainWindow) {
				mainWindow.show();
			}
		});
	} catch (error) { }
}

function createWindow() {
	try {
		mainWindow = new BrowserWindow({
			width: 1200,
			height: 600,
			webPreferences: {
				preload: path.join(__dirname, 'preload.js'),
				contextIsolation: true,
			},
		});

		mainWindow.loadFile('index.html');
		
		mainWindow.on('close', (event) => {
			if (!app.isQuiting) {
				event.preventDefault();
				mainWindow.hide();
			}
		});
	} catch (error) {
		console.error('Error creating the window:', error);
	}
}

let trayMenuTemplate = [];
function createTray() {
	try {
		loadMinifierData((savedData) => {
			const { paths, isWatching, notifictionState } = savedData;
			console.log("Saved Data: ", savedData);
			const iconPath = path.join(__dirname, 'app_icon.png');
			if (fs.existsSync(iconPath)) {
				tray = new Tray(iconPath);
	
				tray.setToolTip('My App');
	
				trayMenuTemplate = [
					{
						label: 'Show Dashboard',
						click: () => {
							mainWindow.show();
						},
					},
					{
						label: 'Watch',
						submenu: [
							{
								label: 'Start',
								type: 'radio',
								checked: isWatching === true ? true : false,
								click: () => {
									mainWindow.webContents.send('check-folder-list');
								},
							},
							{
								label: 'Stop',
								type: 'radio',
								checked: (isWatching === false || (paths && paths.length === 0)) ? true : false,
								click: () => {
									mainWindow.webContents.send('toggle-watch-request', false);
									saveMinifierData({...savedData, isWatching: false });
								},
							},
						],
					},
					{
						label: 'View Logs',
						click: () => {
							mainWindow.show();
							mainWindow.webContents.send('view-logs-request');
						},
					},
					{
						label: 'Clear Paths',
						click: () => {
							mainWindow.webContents.send('clear-paths-request');
						},
					},
					{
						label: 'Notification',
						submenu: [
							{
								label: 'On',
								type: 'radio',
								checked: notifictionState === true ? true : false,
								click: () => {
									mainWindow.webContents.send('notification-toggle', true);
									saveMinifierData({...savedData, notifictionState: true });
								},
							},
							{
								label: 'Off',
								type: 'radio',
								checked: notifictionState === false ? true : false,
								click: () => {
									mainWindow.webContents.send('notification-toggle', false);
									saveMinifierData({...savedData, notifictionState: false });
								},
							},
						],
					},
					{
						label: 'Quit',
						click: () => {
							app.isQuiting = true;
							app.quit();
						},
					},
				];
	
				const trayMenu = Menu.buildFromTemplate(trayMenuTemplate);
				tray.setContextMenu(trayMenu);
	
				console.log('Tray created successfully.');
				mainWindow.webContents.send('debug-message', 'Tray created successfully.');
			} else {
				console.error('Icon file not found:', iconPath);
				mainWindow.webContents.send('debug-message', 'Icon file not found:', iconPath);
			}
		});
	} catch (error) { }
}

ipcMain.on('check-folder-list-result', (event, state) => {
	loadMinifierData((savedData) => {
		const { notifictionState } = savedData;
		console.log('Check folder list result notifictionState: ', notifictionState);
		if (state) {
			mainWindow.webContents.send('toggle-watch-request', true);
			saveMinifierData({...savedData, isWatching: true });
		} else {
			mainWindow.webContents.send('watch-error', 'No folders selected to watch.');
			mainWindow.webContents.send('notify-message', {title:'Start Watch', message: 'No folders selected to watch.'});
			updateTray({start: false, stop: true});
		}
	});
});

function updateTray(data, notifictionState=null) {
	const { start, stop } = data;
	trayMenuTemplate[1].submenu[0].checked = start;
	trayMenuTemplate[1].submenu[1].checked = stop;
	if (notifictionState !== null) {
		trayMenuTemplate[4].submenu[0].checked = notifictionState === true ? true : false;
		trayMenuTemplate[4].submenu[1].checked = notifictionState === false ? true : false;
	}
	tray.setContextMenu(Menu.buildFromTemplate(trayMenuTemplate));
}

ipcMain.on('select-folder', async (event) => {
	try {
		const result = await dialog.showOpenDialog(mainWindow, {
			properties: ['openDirectory', 'multiSelections'],
		});

		if (!result.canceled) {
			const selectedPaths = result.filePaths;
			try {
				loadMinifierData((savedData) => {
					const existingPaths = savedData.paths || [];
					const newPaths = selectedPaths.filter((path) => !existingPaths.includes(path));
					existingPaths.push(...newPaths);
					mainWindow.webContents.send('selected-folders', existingPaths);
					saveMinifierData({ ...savedData, paths: existingPaths });
					startWatchingFolders(selectedPaths);
				});
			} catch (error) {
				mainWindow.webContents.send('watch-error', `Error loading watched paths: ${error}`);
			}
		}
	} catch (error) {
		mainWindow.webContents.send('watch-error', `Error selecting folder: ${error}`);
	}
});

ipcMain.on('start-watch', (event, { folders }) => {
	try {
		let folderArray = [];

		if (typeof folders === 'string') {
			folderArray = folders.split(',').map((folder) => folder.trim());
		} else if (Array.isArray(folders)) {
			folderArray = folders;
		}

		loadMinifierData((savedData) => {
			saveMinifierData({ ...savedData, paths: folderArray, isWatching: true });
			startWatchingFolders(folderArray);
		});
	} catch (error) {
		mainWindow.webContents.send('watch-error', `Error starting watch: ${error}`);
	}
});

ipcMain.on('check-folder-exists', (event, folderPath) => {
	event.reply('folder-exists-result', fs.existsSync(folderPath));
});

ipcMain.on('stop-watching-all', (event) => {
	loadMinifierData((savedData) => {
		saveMinifierData({ ...savedData, isWatching: false });
		stopMinifierData();
	});
});

function stopMinifierData() {
	try {
		watchers.forEach((watcher) => {
			watcher.close();
		});
		watchers = [];
		mainWindow.webContents.send('debug-message', 'Watched paths stopped successfully.');
	} catch (error) {
		mainWindow.webContents.send('watch-error', `Error starting watch: ${error}`);
	}
}

ipcMain.on('clear-saved-paths', (event) => {
	clearMinifierData();
	// event.reply('paths-cleared');
});

function clearMinifierData() {
	try {
		stopMinifierData();

		loadMinifierData((savedData) => {
			const { notifictionState } = savedData;
			fs.unlink(minifierDataPath, (err) => {
				if (err && err.code !== 'ENOENT') {
					console.error('Error clearing watched paths:', err);
				} else {
					console.log('Watched paths cleared successfully.');
					mainWindow.webContents.send('paths-cleared');
					updateTray({start: false, stop: true}, notifictionState);
				}
			});
		});
	} catch (error) {
		mainWindow.webContents.send('watch-error', `Error clearing watched paths: ${error}`);
	}
}

function loadMinifierData(callback) {
	try {
		fs.readFile(minifierDataPath, 'utf8', (err, data) => {
			if (err) {
				if (err.code !== 'ENOENT') {
					console.error('Error reading watched paths:', err);
				}
				callback({ paths: [], isWatching: false, notifictionState: true });
			} else {
				try {
					const parsedData = JSON.parse(data);
					callback(parsedData);
				} catch (parseErr) {
					console.error('Error parsing watched paths:', parseErr);
					callback({ paths: [], isWatching: false, notifictionState: true });
				}
			}
		});
	} catch (error) {
		mainWindow.webContents.send('watch-error', `Error loading watched paths: ${error}`);
	}
}

function saveMinifierData(data) {
	try {
		fs.writeFile(minifierDataPath, JSON.stringify(data), (err) => {
			if (err) {
				console.error('Error saving watched paths:', err);
			} else {
				console.log('Settings saved successfully.');
			}
		});
	} catch (error) {
		mainWindow.webContents.send('watch-error', `Error saving watched paths: ${error}`);
	}
}

function startWatchingFolders(folders) {
	try {
		const uniqueFolders = [...new Set(folders)];

		uniqueFolders.forEach((folder) => {
			if (!fs.existsSync(folder)) {
				mainWindow.webContents.send('watch-error', `Folder does not exist: ${folder}`);
				return;
			}

			if (watchers[folder]) {
				console.log(`Already watching folder: ${folder}`);
				return;
			}

			mainWindow.webContents.send('debug-message', `Starting watcher for folder: ${folder}`);

			const watcher = chokidar.watch(folder, {
				ignored: /(^|[/\\])(\..*|node_modules|lib|assets|cometchat)/,
				persistent: true,
				ignoreInitial: true,
			});

			watcher
				.on('add', (filePath) => handleFileChange(filePath, mainWindow.webContents))
				.on('change', (filePath) => handleFileChange(filePath, mainWindow.webContents))
				.on('unlink', (filePath) => {
					mainWindow.webContents.send('watch-update', `File removed: ${filePath}`);
				});
			watchers.push(watcher);

			mainWindow.webContents.send('set-is-watching', true);
			updateTray({start: true, stop: false});
		});
	} catch (error) {
		mainWindow.webContents.send('watch-error', `Error starting watcher: ${error}`);
	}
}

ipcMain.on('stop-watching-folder', (event, folder) => {
	stopWatchingFolder(folder);
});

function stopWatchingFolder(folder) {
	try {
		console.log("Watcher: ", watchers);
		if (watchers[folder]) {
			watchers[folder].close();
			delete watchers[folder];
		} else {
			console.log(`No watcher found for folder: ${folder}`);
		}
		updateSavedWatchPaths(folder);
	} catch (error) {
		mainWindow.webContents.send('watch-error', `Error stopping watcher: ${error}`);
	}
}

function updateSavedWatchPaths(folder){
	loadMinifierData((savedData) => {
		const updatedPaths = savedData.paths.filter((p) => p !== folder);
		saveMinifierData({ ...savedData, paths: updatedPaths });
		mainWindow.webContents.send('selected-folders', updatedPaths);
		mainWindow.webContents.send('set-is-watching', false);
		if (updatedPaths.length === 0) {
			updateTray({start: false, stop: true});
		}
	});
}

function handleFileChange(filePath, webContents) {
	try {
		if (filePath.endsWith('.min.js') || filePath.endsWith('.min.css')) {
			webContents.send('debug-message', `Ignoring minified file: ${filePath}`);
			return;
		}

		if (filePath.endsWith('.js')) {
			webContents.send('watch-update', `Processing JavaScript file: ${filePath}`);
			processJavaScriptFile(filePath, webContents);
		} else if (filePath.endsWith('.less')) {
			webContents.send('watch-update', `Processing LESS file: ${filePath}`);
			processFile(filePath, webContents, {
				inputExtension: '.less',
				outputExtension: '.css',
				testRegex: /\.less$/,
				loaders: [
					process.env.NODE_ENV !== 'production' ? 'style-loader' : MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader',
                        options: { url: false, esModule: false, }
                    },
                    'less-loader',
				],
				type: 'LESS',
			});
		} else if (filePath.endsWith('.scss') || filePath.endsWith('.sass')) {
			webContents.send('watch-update', `Processing SCSS file: ${filePath}`);
			processFile(filePath, webContents, {
				inputExtension: path.extname(filePath),
				outputExtension: '.css',
				testRegex: /\.(scss|sass)$/,
				loaders: [
					{
						loader: MiniCssExtractPlugin.loader,
						options: {
							esModule: false,
						},
					},
					'css-loader',
					'sass-loader',
				],
				type: 'SCSS',
			});
		} else if (filePath.endsWith('.styl')) {
			webContents.send('watch-update', `Processing Stylus file: ${filePath}`);
			processFile(filePath, webContents, {
				inputExtension: '.styl',
				outputExtension: '.css',
				testRegex: /\.styl$/,
				loaders: [
					{
						loader: MiniCssExtractPlugin.loader,
						options: {
							esModule: false,
						},
					},
					'css-loader',
					'stylus-loader',
				],
				type: 'Stylus',
			});
		} else if (filePath.endsWith('.ts')) {
			webContents.send('watch-update', `Processing TypeScript file: ${filePath}`);
			processJavaScriptFile(filePath, webContents, {
				inputExtension: '.ts',
				outputExtension: '.min.js',
				testRegex: /\.ts$/,
				loaders: [
					{
						loader: 'babel-loader',
						options: {
							presets: ['@babel/preset-env', '@babel/preset-typescript'],
						},
					},
				],
				type: 'TypeScript',
			});
		}
	} catch (error) {
		mainWindow.webContents.send('watch-error', `Error processing file: ${error}`);
	}
}

function processFile(filePath, webContents, options) {
	try {
		const { inputExtension, outputExtension, testRegex, loaders, type } = options;
		const baseName = path.basename(filePath, inputExtension);
		const outputFilePath = path.join(path.dirname(filePath), `${baseName}${outputExtension}`);

		const config = {
			entry: {
				[baseName]: filePath,
			},
			output: {
				path: path.dirname(filePath),
				filename: '[name].js',
			},
			mode: 'production',
			optimization: {
				splitChunks: false,
			},
			module: {
				rules: [
					{
						test: testRegex,
						use: loaders,
					},
				],
			},
			plugins: [
				new RemoveEmptyScriptsPlugin(),
				new MiniCssExtractPlugin({
					filename: `[name]${outputExtension}`,
				}),
			],
		};

		webpack(config, (err, stats) => {
			if (err || stats.hasErrors()) {
				const info = stats ? stats.toJson() : {};
				console.error('Webpack Error:', err || info.errors);
				webContents.send('watch-error', `Error processing ${type}: ${err || info.errors}`);
			} else {
				webContents.send('watch-update', `${type} processing completed: ${outputFilePath}`);
			}
		});
	} catch (error) {
		mainWindow.webContents.send('watch-error', `Error processing ${type}: ${error}`);
	}
}

function removeJavaScriptMinFile(filePath, webContents, options = {}) {

	const {
		inputExtension = '.js',
		outputExtension = '.min.js',
		testRegex = /\.js$/,
		loaders,
		type = 'JavaScript',
	} = options;
	const baseName = path.basename(filePath, inputExtension);
	const outputFilePath = path.join(path.dirname(filePath), `${baseName}${outputExtension}`);

	// **Workaround: Remove the existing minified file before recreating it**
	try {
		if (fs.existsSync(outputFilePath)) {
			fs.unlinkSync(outputFilePath);
			webContents.send('debug-message', `Deleted existing minified file: ${outputFilePath}`);
			processJavaScriptFile(filePath, webContents, options);
		}
	} catch (error) {
		webContents.send('watch-error', `Error deleting minified file: ${error}`);
	}

}

function processJavaScriptFile(filePath, webContents, options = {}) {
	try {
		const {
			inputExtension = '.js',
			outputExtension = '.min.js',
			testRegex = /\.js$/,
			loaders,
			type = 'JavaScript',
		} = options;
		const baseName = path.basename(filePath, inputExtension);
		const outputFilePath = path.join(path.dirname(filePath), `${baseName}${outputExtension}`);

		const config = {
			entry: filePath,
			output: {
				path: path.dirname(filePath),
				filename: path.basename(outputFilePath),
			},
			cache: false,
			mode: 'production',
			target: 'web',
			optimization: {
				splitChunks: false,
				minimize: true,
				minimizer: [
					new TerserPlugin({
						extractComments: false, // Disable the creation of .LICENSE.txt files
						terserOptions: {
							format: {
								comments: /@license|@preserve|^!/, // Preserve license comments
							},
						},
					}),
				],
			},
			module: {
				rules: [
					{
						test: testRegex,
						exclude: /node_modules/,
						use: loaders || [
							{
								loader: 'babel-loader',
								options: {
									presets: ['@babel/preset-env'],
								},
							},
						],
					},
				],
			},
		};


		try {
			webpack(config, (err, stats) => {
				if (err || stats.hasErrors()) {
					const info = stats ? stats.toJson() : {};
					console.error('Webpack Error:', err || info.errors);
					webContents.send('watch-error', `Error processing ${type}: ${err || info.errors}`);
				} else {
					webContents.send('watch-update', `${type} processing completed: ${outputFilePath}`);
				}
			});
		} catch (error) {
			webContents.send('watch-error', `Error processing ${type}: ${error}`);
		}
	} catch (error) {
		mainWindow.webContents.send('watch-error', `Error processing ${type}: ${error}`);
	}
}