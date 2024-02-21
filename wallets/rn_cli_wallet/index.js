/**
 * @format
 */

import 'react-native-gesture-handler';

import {AppRegistry, Platform} from 'react-native';
import {name as appName} from './app.json';

import messaging from '@react-native-firebase/messaging';
import notifee, {
  AndroidImportance,
  AndroidVisibility,
  EventType,
} from '@notifee/react-native';
import {NotifyClient} from '@walletconnect/notify-client';
import {decryptMessage} from '@walletconnect/notify-message-decrypter';
import crypto from 'react-native-quick-crypto';
import {request, PERMISSIONS} from 'react-native-permissions';

import App from './src/screens/App';

const polyfillDigest = async (algorithm, data) => {
  const algo = algorithm.replace('-', '').toLowerCase();
  const hash = crypto.createHash(algo);
  hash.update(data);
  return hash.digest();
};

globalThis.crypto = crypto;
globalThis.crypto.subtle = {
  digest: polyfillDigest,
};

async function registerAppWithFCM() {
  // This is expected to be automatically handled on iOS. See https://rnfirebase.io/reference/messaging#registerDeviceForRemoteMessages
  await messaging().registerDeviceForRemoteMessages();
}

registerAppWithFCM();

let notifyClient;

const projectId = process.env.ENV_PROJECT_ID;

async function registerClient(deviceToken, clientId) {
  const body = JSON.stringify({
    client_id: clientId,
    token: deviceToken,
    type: 'fcm',
    always_raw: true,
  });

  const requestOptions = {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body,
  };

  return fetch(
    `https://echo.walletconnect.com/${projectId}/clients`,
    requestOptions,
  )
    .then(response => response.json())
    .then(result => console.log('>>> registered client', result))
    .catch(error => console.log('>>> error while registering client', error));
}

async function handleGetToken(token) {
  if (Platform.OS === 'android') {
    await request(PERMISSIONS.ANDROID.POST_NOTIFICATIONS).then(result => {});
  } else if (Platform.OS === 'ios') {
    await request(PERMISSIONS.IOS.NOTIFICATIONS).then(result => {});
  }

  const status = await messaging().requestPermission();
  const enabled =
    status === messaging.AuthorizationStatus.AUTHORIZED ||
    status === messaging.AuthorizationStatus.PROVISIONAL;
  console.log('>>> get token, permission status', token, status, enabled);

  if (enabled) {
    notifyClient = await NotifyClient.init({projectId});
    const clientId = await notifyClient.core.crypto.getClientId();
    return registerClient(token, clientId);
  }
}

messaging().getToken().then(handleGetToken);
messaging().onTokenRefresh(handleGetToken);

// Create notification channel (Android only feature)
notifee.createChannel({
  id: 'default',
  name: 'Default Channel',
  lights: false,
  vibration: true,
  importance: AndroidImportance.HIGH,
  visibility: AndroidVisibility.PUBLIC,
});
notifee.onBackgroundEvent(async ({type, detail}) => {
  const {notification, pressAction} = detail;

  // Check if the user pressed the "Mark as read" action
  if (type === EventType.ACTION_PRESS && pressAction.id === 'mark-as-read') {
    // Remove the notification
    await notifee.cancelNotification(notification.id);
  }
});

async function onMessageReceived(remoteMessage) {
  if (!remoteMessage.data?.blob || !remoteMessage.data?.topic) {
    console.log('Missing blob or topic on notification message.');
    return;
  }

  const decryptedMessage = await decryptMessage({
    topic: remoteMessage.data?.topic,
    encryptedMessage: remoteMessage.data?.blob,
  });

  return notifee.displayNotification({
    title: remoteMessage?.data?.title || 'title',
    body: remoteMessage?.data?.body || 'body',
    id: 'default',
    ios: {
      badgeCount: 100,
    },
    android: {
      channelId: 'default',
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
      smallIcon: 'ic_launcher',
      pressAction: {
        id: 'default',
      },
    },
  });
}

messaging().onMessage(onMessageReceived);
messaging().setBackgroundMessageHandler(onMessageReceived);

function HeadlessCheck({isHeadless}) {
  if (isHeadless) {
    // App has been launched in the background by iOS, ignore
    return null;
  }

  // Render the app component on foreground launch
  return <App />;
}

AppRegistry.registerComponent(appName, () => HeadlessCheck);
