const {ipcMain, app, BrowserWindow, Menu} = require('electron');

const {mainUrl} = require('./utils');

const quit = () => {
	if(global && global.appShared && global.appShared.savingData){
		setTimeout(() => {
			quit();
		}, 100);
	} else {
		// HighLevelSockets.broadcastEvent('dced', {});
		app.quit();
	}
}

let  mainWindow, loadingWindow;

ipcMain.on('loaderconsole', () => { if(loadingWindow) loadingWindow.openDevTools(); });

const setupMenu = () => {
	const menu = new Menu();
	mainWindow.setMenu(menu);

	const template = [{
		label: "Application",
		submenu: [
			{ label: "About Application", selector: "orderFrontStandardAboutPanel:" },
			{ type: "separator" },
			{ label: "Quit", accelerator: "Command+Q", click: () => { quit(); }}
		]}, {
		label: "Edit",
		submenu: [
			{ label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
			{ label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
			{ type: "separator" },
			{ label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
			{ label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
			{ label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
			{ label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
		]}
	];

	Menu.setApplicationMenu(Menu.buildFromTemplate(template));
};

const restoreInstance = () => {
	mainWindow.show();
	if(mainWindow.isMinimized()) mainWindow.restore();
};

const activateInstance = e => {
	if(e) e.preventDefault();
	if(!mainWindow) return;
	restoreInstance();
};

const createKeyperInstance = async () => {
	app.setAsDefaultProtocolClient('keyper');

	const createMainWindow = (show, width = 1024, height = 800) => new BrowserWindow({
		width,
		height,
		frame: false,
		radii: [5,5,5,5],
		resizable: true,
		titleBarStyle:'hiddenInset',
		backgroundColor:"#fff",
		show,
		webPreferences:{
			nodeIntegration:true,
			webviewTag:true,
		}
	});

	loadingWindow = createMainWindow(true, 400, 250);
	loadingWindow.loadURL(mainUrl(false, 'loading'));

	loadingWindow.once('ready-to-show', () => {
		loadingWindow.show();
		loadingWindow.focus();
	});

  mainWindow = createMainWindow(false);
	mainWindow.loadURL(mainUrl(false));
	loadingWindow.close();
	loadingWindow = null;

	mainWindow.once('ready-to-show', () => {
		// HighLevelSockets.setMainWindow(mainWindow);
		mainWindow.show();
		mainWindow.focus();
	});

	// mainWindow.openDevTools();
	mainWindow.on('closed', () => mainWindow = null);
	mainWindow.on('close', () => quit());

	setupMenu();
};

app.on('ready', createKeyperInstance);
app.on('activate', activateInstance);
app.on('window-all-closed', () => quit())
app.on('second-instance', (event, argv) => {
	if (process.platform === 'win32' || process.platform === 'linux') callDeepLink(argv.slice(1));
	if (mainWindow) activateInstance();
})

app.on('web-contents-created', (event, contents) => {
	contents.on('will-navigate', (event, navigationUrl) => {
		// Never navigate away from localhost.
		if(navigationUrl.indexOf(mainUrl(false)) !== 0) event.preventDefault()
	})
})

const callDeepLink = url => {
	// TODO: Need to rebuild deep link functionality
	if(global.appShared.ApiWatcher !== null)
		global.appShared.ApiWatcher(url);
}

if(!app.requestSingleInstanceLock()) quit();

process.on('uncaughtException', (err) => {
	if(mainWindow) mainWindow.webContents.send('error', {message:err.message, file:err.fileName, line:err.lineNumber});
	console.error('There was an uncaught error', err)
	// process.exit(1) //mandatory (as per the Node docs)
});

const log = console.log;
console.log = (...params) => {
	if(mainWindow) mainWindow.webContents.send('console', params);
	if(loadingWindow) loadingWindow.webContents.send('console', params);
	log(...params);
}

const logerr = console.error;
console.error = (...params) => {
	if(mainWindow) mainWindow.webContents.send('console', params);
	if(loadingWindow) loadingWindow.webContents.send('console', params);
	logerr(...params);
}

global.keyperLog = (data) => mainWindow.webContents.send('keyperLog', data);
