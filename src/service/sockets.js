const WebSocket = require('ws');
const {app, BrowserWindow} = require('electron');

let mainWindow;

class SocketService {
  constructor(){
    this.wss = null;
    this.openConnections = {};
  }
  
  async getNewKey(origin, id){
		return new Promise((resolve, reject) => {
			this.rekeyPromise = {resolve, reject};
			this.emit(origin, id, 'rekey');
			return this.rekeyPromise;
		})
	}

	async emit(origin, id, path, data){
		const socket = this.openConnections[origin+id];
		return this.emitSocket(socket, path, data);
	}

	async emitSocket(socket, path, data){
		if(!socket) return console.error('No socket found');
		socket.send('42/scatter,' + JSON.stringify([path, data ? data : false]))
	}

  async initialize() {
    const socketHandler = socket => {
			let origin = null;

			socket.send("40");
			socket.send("40/scatter");
			socket.send(`42/scatter,["connected"]`);

			const id = Math.round(Math.random() * 999999999).toString();

			if(isDev) socket.on('error', async request => console.log('error', request));

			socket.on('close',      () => delete this.openConnections[origin+id]);
			socket.on('disconnect', () => delete this.openConnections[origin+id]);

      socket.on('message', msg => {
        if(msg.indexOf('42/scatter') === -1) return false;
				const [type, request] = JSON.parse(msg.replace('42/scatter,', ''));

				const killRequest = () => this.emitSocket(socket, 'api', {id:request.data.id, result:null});

				if(!request.plugin || request.plugin.length > 100) return killRequest();
				request.plugin = request.plugin.replace(/\s/g, "").trim();

				if(request.plugin.toLowerCase() === 'scatter') return killRequest();

				let requestOrigin;
				if(request.data.hasOwnProperty('payload')){
					request.data.payload.origin = request.data.payload.origin.replace(/\s/g, "").trim();
					if(request.data.payload.origin.toLowerCase() === 'scatter') return killRequest();
					requestOrigin = request.data.payload.origin;

				} else requestOrigin = request.data.origin.replace(/\s/g, "").trim();

				if(!origin) origin = requestOrigin;
				else if(origin && requestOrigin !== origin) return killRequest();

				if(!this.openConnections.hasOwnProperty(origin+id)) this.openConnections[origin+id] = socket;
      });
    };

    this.wss = new WebSocket.Server({ port: 50001 });
    this.wss.on('connection', socketHandler);
  }

  async close(){
    this.wss.terminate();

		return true;
	}

	sendEvent(event, payload, origin){
		const sockets = Object.keys(this.openConnections).filter(x => x.indexOf(origin) === 0).map(x => this.openConnections[x]);
		sockets.map(x => this.emitSocket(x, 'event', {event, payload}));
		return true;
	}

	broadcastEvent(event, payload){
		Object.keys(this.openConnections).map(origin => this.sendEvent(event, payload, origin));
		return true;
	}
}

let sockets = new SocketService();
class HighLevelSockets {
	static setMainWindow(w){
		mainWindow = w;
	}

	static async initialize(){
		return sockets.initialize();
	}

	static async close(){
		return sockets.close();
	}

	static async sendEvent(event, payload, origin){
		return sockets.sendEvent(event, payload, origin);
	}

	static async broadcastEvent(event, payload){
		return sockets.broadcastEvent(event, payload);
	}

	static async emit(origin, id, path, data){
		return sockets.emit(origin, id, path, data);
	}

	static async getNewKey(origin, id){
		return sockets.getNewKey(origin, id);
	}
}

module.exports = HighLevelSockets;