import { Client } from '@stomp/stompjs';
import { API_BASE_URL } from './api';

// Derived from the API URL rather than written out separately, so the two can
// never drift apart -- and so the protocol always matches: http -> ws,
// https -> wss. That pairing matters: a page served over HTTPS is blocked by
// the browser if it opens a plain ws:// connection (mixed content), so a
// hardcoded ws:// would break the moment the app is served over HTTPS.
const WS_URL = `${API_BASE_URL.replace(/^http/, 'ws')}/ws`;

let stompClient = null;

export function connectSocket(onMessage, onError) {
  stompClient = new Client({
    brokerURL: WS_URL,
    connectHeaders: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    reconnectDelay: 5000,
    onConnect: () => {
      stompClient.subscribe('/user/queue/messages', (message) => {
        onMessage(JSON.parse(message.body));
      });

      stompClient.subscribe('/user/queue/errors', (message) => {
        onError(message.body);
      });
    },
  });

  stompClient.activate();
}

export function sendSocketMessage(receiverId, content) {
  if (!stompClient || !stompClient.connected) {
    console.error('Not connected');
    return;
  }

  stompClient.publish({
    destination: '/app/chat.send',
    body: JSON.stringify({ receiverId, content }),
  });
}

export function disconnectSocket() {
  if (stompClient) stompClient.deactivate();
}
