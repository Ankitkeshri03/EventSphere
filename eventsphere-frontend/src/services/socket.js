import { Client } from '@stomp/stompjs';

let stompClient = null;

export function connectSocket(onMessage, onError) {
  stompClient = new Client({
    brokerURL: 'ws://localhost:8080/ws',
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
