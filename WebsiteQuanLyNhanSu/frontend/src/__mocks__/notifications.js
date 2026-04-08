export const isBroadcastNotif = (notif) => notif?.loai === 'BROADCAST';
export const notifId = (notif) => notif?._id || notif?.id;
